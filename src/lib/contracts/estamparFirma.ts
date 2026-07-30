import { PDFDocument } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Toma un PDF existente (bytes) y una firma en base64 (formato "data:image/png;base64,...",
 * tal cual la entrega SignatureCanvas.toDataURL("image/png")), y estampa la firma
 * en la esquina inferior derecha de la ÚLTIMA página.
 */
export async function estamparFirmaEnPdf(
  pdfBytes: Uint8Array,
  firmaBase64: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const paginas = pdfDoc.getPages();
  const ultimaPagina = paginas[paginas.length - 1];

  // Quita el prefijo "data:image/png;base64," si viene incluido
  const base64Limpio = firmaBase64.replace(/^data:image\/png;base64,/, "");
  const firmaBytes = Buffer.from(base64Limpio, "base64");

  const imagenFirma = await pdfDoc.embedPng(firmaBytes);

  // Escala la firma a un tamaño razonable manteniendo proporción
  const anchoMaximo = 160;
  const escala = anchoMaximo / imagenFirma.width;
  const anchoFinal = imagenFirma.width * escala;
  const altoFinal = imagenFirma.height * escala;

  const margen = 60;

  ultimaPagina.drawImage(imagenFirma, {
    x: ultimaPagina.getWidth() - anchoFinal - margen,
    y: margen,
    width: anchoFinal,
    height: altoFinal,
  });

  ultimaPagina.drawText(`Firmado electrónicamente el ${new Date().toLocaleDateString("es-MX")}`, {
    x: ultimaPagina.getWidth() - anchoFinal - margen,
    y: margen - 14,
    size: 8,
  });

  return pdfDoc.save();
}

/**
 * Descarga el contrato ya generado de Storage, le estampa la firma,
 * y sube la versión firmada (sin sobreescribir el original sin firmar).
 */
export async function firmarContratoExistente(
  rutaContratoOriginal: string,
  firmaBase64: string
): Promise<{ path: string }> {
  const { data: archivoOriginal, error: errorDescarga } = await supabaseAdmin.storage
    .from("contracts")
    .download(rutaContratoOriginal);

  if (errorDescarga || !archivoOriginal) {
    throw new Error(`No se pudo descargar el contrato original: ${errorDescarga?.message}`);
  }

  const pdfBytesOriginal = new Uint8Array(await archivoOriginal.arrayBuffer());
  const pdfBytesFirmado = await estamparFirmaEnPdf(pdfBytesOriginal, firmaBase64);

  const rutaFirmado = rutaContratoOriginal.replace(/\.pdf$/, "_firmado.pdf");

  const { error: errorUpload } = await supabaseAdmin.storage
    .from("contracts")
    .upload(rutaFirmado, pdfBytesFirmado, { contentType: "application/pdf" });

  if (errorUpload) {
    throw new Error(`Error al guardar el contrato firmado: ${errorUpload.message}`);
  }

  return { path: rutaFirmado };
}

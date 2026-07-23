// IMPORTANTE: este módulo corre SOLO en servidor (API Route / Server Action).
// Usa la Service Role Key porque necesita saltarse RLS para escribir
// en el bucket "contracts" en nombre del sistema, no del usuario.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // nunca exponer esta key al cliente
);

interface DatosContrato {
  loteId: string;
  toneladas: number;
  purezaPorcentaje: number;
  puertoOrigen: string;
  precioUsd: number;
  mineroNombreEmpresa: string;
  compradorEmail: string;
  montoOfertado: number;
}

async function obtenerDatosContrato(loteId: string): Promise<DatosContrato> {
  const { data: lote, error: errorLote } = await supabaseAdmin
    .from("lotes")
    .select("id, toneladas, pureza_porcentaje, puerto_origen, precio_usd, minero_id, perfiles(nombre_empresa)")
    .eq("id", loteId)
    .single();

  if (errorLote || !lote) throw new Error(`Lote ${loteId} no encontrado`);

  const { data: oferta, error: errorOferta } = await supabaseAdmin
    .from("ofertas")
    .select("comprador_email, monto_ofertado")
    .eq("lote_id", loteId)
    .eq("estatus", "aceptada")
    .single();

  if (errorOferta || !oferta) throw new Error(`No hay oferta aceptada para el lote ${loteId}`);

  return {
    loteId: lote.id,
    toneladas: lote.toneladas,
    purezaPorcentaje: lote.pureza_porcentaje,
    puertoOrigen: lote.puerto_origen,
    precioUsd: lote.precio_usd,
    mineroNombreEmpresa: (lote as any).perfiles?.nombre_empresa ?? "N/A",
    compradorEmail: oferta.comprador_email,
    montoOfertado: oferta.monto_ofertado,
  };
}

export async function generarContratoPdf(loteId: string): Promise<{ path: string }> {
  const datos = await obtenerDatosContrato(loteId);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // carta
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 740;
  const margenIzq = 60;

  const escribirLinea = (texto: string, tamano = 11, negrita = false, salto = 20) => {
    page.drawText(texto, {
      x: margenIzq,
      y,
      size: tamano,
      font: negrita ? fontBold : font,
      color: rgb(0.05, 0.1, 0.18),
    });
    y -= salto;
  };

  escribirLinea("CONTRATO DE COMPRAVENTA DE COBRE", 16, true, 30);
  escribirLinea("Nexus Node — Plataforma de Comercio de Cobre Certificado", 10, false, 30);

  escribirLinea("DATOS DEL LOTE", 13, true, 22);
  escribirLinea(`ID de Lote: ${datos.loteId}`);
  escribirLinea(`Toneladas: ${datos.toneladas} Tons`);
  escribirLinea(`Pureza: ${datos.purezaPorcentaje}%`);
  escribirLinea(`Puerto de Origen: ${datos.puertoOrigen}`, 11, false, 28);

  escribirLinea("PARTES", 13, true, 22);
  escribirLinea(`Vendedor (Minero): ${datos.mineroNombreEmpresa}`);
  escribirLinea(`Comprador: ${datos.compradorEmail}`, 11, false, 28);

  escribirLinea("TÉRMINOS COMERCIALES", 13, true, 22);
  escribirLinea(`Precio Publicado: $${datos.precioUsd.toLocaleString()} USD`);
  escribirLinea(`Monto Ofertado y Aceptado: $${datos.montoOfertado.toLocaleString()} USD`, 11, false, 28);

  escribirLinea(
    `Generado automáticamente el ${new Date().toLocaleDateString("es-MX")} por el sistema de Nexus Node.`,
    9,
    false
  );

  const pdfBytes = await pdfDoc.save();

  const rutaArchivo = `${datos.loteId}/contrato_${Date.now()}.pdf`;

  const { error: errorUpload } = await supabaseAdmin.storage
    .from("contracts")
    .upload(rutaArchivo, pdfBytes, { contentType: "application/pdf" });

  if (errorUpload) throw new Error(`Error al guardar el contrato: ${errorUpload.message}`);

  await supabaseAdmin.from("agent_activity_logs").insert({
    agent_name: "Transaction Notary",
    lot_id: datos.loteId,
    payload: { accion: "contrato_generado", ruta: rutaArchivo },
    status: "completado",
  });

  return { path: rutaArchivo };
}

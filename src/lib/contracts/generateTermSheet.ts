// Genera un resumen corto de términos (Term Sheet), distinto del contrato
// final (generarContratoPdf.ts), útil antes de que la negociación quede
// cerrada del todo.
// NOTA (fix 2026-08-03): el parámetro se unificó a "loteId" para que los
// tres endpoints de /api/contratos usen el mismo nombre — antes esta función
// usaba "dealId", inconsistente con el resto.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DatosTermSheet {
  loteId: string;
  toneladas: number;
  purezaPorcentaje: number;
  puertoOrigen: string;
  precioPublicado: number;
  mineroNombreEmpresa: string;
  compradorEmail: string;
  montoOfertado: number;
  estatusLote: string;
}

async function obtenerDatosDeal(loteId: string): Promise<DatosTermSheet> {
  const { data: lote, error: errorLote } = await supabaseAdmin
    .from("lotes")
    .select(
      "id, toneladas, pureza_porcentaje, puerto_origen, precio_usd, comprador_id, estatus, perfiles!lotes_minero_id_fkey(nombre_empresa)"
    )
    .eq("id", loteId)
    .single();

  if (errorLote || !lote) throw new Error(`Lote ${loteId} no encontrado`);

  // Modelo nuevo (2026-08-03): ya NO se valida contra la tabla ofertas (obsoleta).
  // El term sheet solo tiene sentido si ya hay un comprador asignado al lote
  // (via matches / lotes.comprador_id), sin importar si el trato ya se completó
  // del todo o sigue en curso.
  if (!lote.comprador_id) {
    throw new Error(`El lote ${loteId} todavía no tiene comprador asignado`);
  }

  const { data: escrow, error: errorEscrow } = await supabaseAdmin
    .from("escrow_transactions")
    .select("comprador_email, monto_bruto")
    .eq("lote_id", loteId)
    .order("creado_en", { ascending: false })
    .limit(1)
    .single();

  if (errorEscrow || !escrow) throw new Error(`No hay registro de escrow para el lote ${loteId}`);

  return {
    loteId: lote.id,
    toneladas: lote.toneladas,
    purezaPorcentaje: lote.pureza_porcentaje,
    puertoOrigen: lote.puerto_origen,
    precioPublicado: lote.precio_usd,
    mineroNombreEmpresa: (lote as any).perfiles?.nombre_empresa ?? "N/A",
    compradorEmail: escrow.comprador_email,
    montoOfertado: Number(escrow.monto_bruto),
    estatusLote: lote.estatus,
  };
}

export async function generateTermSheet(loteId: string): Promise<{ path: string }> {
  const datos = await obtenerDatosDeal(loteId);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
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

  escribirLinea("TÉRMINOS DE LA OPERACIÓN (TERM SHEET)", 16, true, 18);
  escribirLinea("Documento preliminar — no constituye el contrato definitivo", 9, false, 30);

  escribirLinea("RESUMEN DEL LOTE", 13, true, 22);
  escribirLinea(`ID de Lote: ${datos.loteId}`);
  escribirLinea(`Toneladas: ${datos.toneladas} Tons`);
  escribirLinea(`Pureza: ${datos.purezaPorcentaje}%`);
  escribirLinea(`Puerto de Origen: ${datos.puertoOrigen}`, 11, false, 28);

  escribirLinea("PARTES INVOLUCRADAS", 13, true, 22);
  escribirLinea(`Vendedor (Minero): ${datos.mineroNombreEmpresa}`);
  escribirLinea(`Comprador Interesado: ${datos.compradorEmail}`, 11, false, 28);

  escribirLinea("CONDICIONES PROPUESTAS", 13, true, 22);
  escribirLinea(`Precio Publicado (Referencia LME): $${datos.precioPublicado.toLocaleString()} USD`);
  escribirLinea(`Monto Ofertado: $${datos.montoOfertado.toLocaleString()} USD`);
  escribirLinea(`Estatus del Trato: ${datos.estatusLote}`, 11, false, 28);

  escribirLinea("Este documento resume los términos discutidos hasta el momento y está", 9);
  escribirLinea("sujeto a la validación final, depósito en escrow y firma del contrato formal.", 9, false, 24);

  escribirLinea(
    `Generado automáticamente el ${new Date().toLocaleDateString("es-MX")} por Nexus Node.`,
    9
  );

  const pdfBytes = await pdfDoc.save();
  const rutaArchivo = `${datos.loteId}/term_sheet_${Date.now()}.pdf`;

  const { error: errorUpload } = await supabaseAdmin.storage
    .from("contracts")
    .upload(rutaArchivo, pdfBytes, { contentType: "application/pdf" });

  if (errorUpload) throw new Error(`Error al guardar el term sheet: ${errorUpload.message}`);

  await supabaseAdmin.from("agent_activity_logs").insert({
    agent_name: "Transaction Notary",
    lot_id: datos.loteId,
    payload: { accion: "term_sheet_generado", ruta: rutaArchivo },
    status: "completado",
  });

  return { path: rutaArchivo };
}

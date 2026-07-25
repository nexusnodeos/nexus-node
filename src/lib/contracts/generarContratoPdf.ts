// src/lib/contracts/generarContratoPdf.ts
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

/**
 * SEGURIDAD (hallazgo 2026-07-24): antes esta función siempre escribía el
 * nombre real del vendedor y el email del comprador en el PDF, sin verificar
 * NCNDA, POF ni depósito en escrow. Un comprador con solo una "oferta
 * aceptada" podía obtener la identidad real del minero y evadir la comisión
 * de Nexus. Ahora la revelación de identidad real es un parámetro explícito,
 * apagado por default.
 */
function idVendedorCodificado(loteId: string): string {
  return `VENDEDOR-${loteId.slice(0, 8).toUpperCase()}`;
}

function idCompradorCodificado(compradorEmail: string): string {
  const hash = compradorEmail
    .split("")
    .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 99999, 7);
  return `COMPRADOR-${hash.toString().padStart(5, "0")}`;
}

async function generarPdfBase(
  datos: DatosContrato,
  opciones: { identidadRevelada: boolean }
): Promise<Uint8Array> {
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

  const vendedorMostrado = opciones.identidadRevelada
    ? datos.mineroNombreEmpresa
    : idVendedorCodificado(datos.loteId);
  const compradorMostrado = opciones.identidadRevelada
    ? datos.compradorEmail
    : idCompradorCodificado(datos.compradorEmail);

  const titulo = opciones.identidadRevelada
    ? "CONTRATO DE COMPRAVENTA FINAL (ETAPA 2 - IDENTIDAD REVELADA)"
    : "RESERVA DE EXCLUSIVIDAD 72H + NCNDA (ETAPA 1 - IDENTIDAD CODIFICADA)";

  escribirLinea(titulo, 15, true, 30);
  escribirLinea("Nexus Node — Plataforma de Comercio de Cobre Certificado", 10, false, 30);

  escribirLinea("DATOS DEL LOTE", 13, true, 22);
  escribirLinea(`ID de Lote: ${datos.loteId}`);
  escribirLinea(`Toneladas: ${datos.toneladas} Tons`);
  escribirLinea(`Pureza: ${datos.purezaPorcentaje}%`);
  escribirLinea(`Puerto de Origen: ${datos.puertoOrigen}`, 11, false, 28);

  escribirLinea("PARTES", 13, true, 22);
  escribirLinea(`Vendedor (Minero): ${vendedorMostrado}`);
  escribirLinea(`Comprador: ${compradorMostrado}`, 11, false, 28);

  if (!opciones.identidadRevelada) {
    escribirLinea("La identidad real de ambas partes se revela unicamente tras la", 9);
    escribirLinea("confirmacion de deposito en escrow (Contrato de Compraventa Final).", 9, false, 24);
  }

  escribirLinea("TÉRMINOS COMERCIALES", 13, true, 22);
  escribirLinea(`Precio Publicado: $${datos.precioUsd.toLocaleString()} USD`);
  escribirLinea(`Monto Ofertado y Aceptado: $${datos.montoOfertado.toLocaleString()} USD`, 11, false, 28);

  escribirLinea(
    `Generado automáticamente el ${new Date().toLocaleDateString("es-MX")} por el sistema de Nexus Node.`,
    9,
    false
  );

  return pdfDoc.save();
}

async function guardarYRegistrar(
  loteId: string,
  pdfBytes: Uint8Array,
  etiqueta: "reserva_ncnda" | "compraventa_final"
): Promise<{ path: string }> {
  const rutaArchivo = `${loteId}/${etiqueta}_${Date.now()}.pdf`;

  const { error: errorUpload } = await supabaseAdmin.storage
    .from("contracts")
    .upload(rutaArchivo, pdfBytes, { contentType: "application/pdf" });

  if (errorUpload) throw new Error(`Error al guardar el contrato: ${errorUpload.message}`);

  await supabaseAdmin.from("agent_activity_logs").insert({
    agent_name: "Transaction Notary",
    lot_id: loteId,
    payload: { accion: "contrato_generado", tipo: etiqueta, ruta: rutaArchivo },
    status: "completado",
  });

  return { path: rutaArchivo };
}

/**
 * Etapa 1 — se llama al aceptar la oferta. Identidad SIEMPRE codificada.
 */
export async function generarContratoReservaPdf(loteId: string): Promise<{ path: string }> {
  const datos = await obtenerDatosContrato(loteId);
  const pdfBytes = await generarPdfBase(datos, { identidadRevelada: false });
  return guardarYRegistrar(loteId, pdfBytes, "reserva_ncnda");
}

/**
 * Etapa 2 — SOLO debe llamarse desde el Agente Financiero & Escrow
 * (Tarea 2.3), una vez confirmado el depósito completo. Aquí sí se revela
 * la identidad real de ambas partes.
 */
export async function generarContratoFinalPdf(loteId: string): Promise<{ path: string }> {
  const datos = await obtenerDatosContrato(loteId);
  const pdfBytes = await generarPdfBase(datos, { identidadRevelada: true });
  return guardarYRegistrar(loteId, pdfBytes, "compraventa_final");
}

// Alias retrocompatible: cualquier código existente que aún importe
// generarContratoPdf() recibe la version segura (Etapa 1), nunca la que
// revela identidad, para que el hueco no se reintroduzca por accidente.
export const generarContratoPdf = generarContratoReservaPdf;

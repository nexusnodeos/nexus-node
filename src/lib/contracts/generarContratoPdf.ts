// src/lib/contracts/generarContratoPdf.ts
// IMPORTANTE: este módulo corre SOLO en servidor (API Route / Server Action).
// Usa la Service Role Key porque necesita saltarse RLS para escribir
// en el bucket "contracts" en nombre del sistema, no del usuario.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import { NEXUS_NODE_LEGAL_RULES } from "@/services/agents/config/rules";
import { RESERVA_TEMPLATE, FINAL_TEMPLATE, renderizarPlantilla } from "./plantillas";
import { sanearContraInyeccionLlaves, sanearParaWinAnsi } from "./sanitizacionPdf";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // nunca exponer esta key al cliente
);

interface DatosContrato {
  loteId: string;
  mineral: string;
  toneladas: number;
  purezaPorcentaje: number;
  puertoOrigen: string;
  pais: string;
  precioUsd: number;
  precioPublicadoUsd: number | null;
  fechaLimiteExclusividad: string | null;
  mineroNombreEmpresa: string;
  compradorEmail: string;
  montoOfertado: number;
  fechaOferta: string;
}

async function obtenerDatosContrato(loteId: string): Promise<DatosContrato> {
  const { data: lote, error: errorLote } = await supabaseAdmin
    .from("lotes")
    .select(
      "id, mineral, toneladas, pureza_porcentaje, puerto_origen, pais, precio_usd, precio_publicado_usd, fecha_limite_exclusividad, minero_id, comprador_id, estatus, perfiles!lotes_minero_id_fkey(nombre_empresa)"
    )
    .eq("id", loteId)
    .single();

  if (errorLote || !lote) throw new Error(`Lote ${loteId} no encontrado`);

  // Modelo nuevo (2026-08-03): el trato se confirma con lotes.estatus = 'completado'
  // y lotes.comprador_id asignado — ya NO se valida contra la tabla ofertas (obsoleta).
  if (lote.estatus !== "completado" || !lote.comprador_id) {
    throw new Error(
      `El lote ${loteId} no tiene un trato cerrado todavía (estatus actual: ${lote.estatus})`
    );
  }

  const { data: escrow, error: errorEscrow } = await supabaseAdmin
    .from("escrow_transactions")
    .select("comprador_email, monto_bruto, creado_en")
    .eq("lote_id", loteId)
    .order("creado_en", { ascending: false })
    .limit(1)
    .single();

  if (errorEscrow || !escrow) throw new Error(`No hay registro de escrow para el lote ${loteId}`);

  return {
    loteId: lote.id,
    mineral: lote.mineral,
    toneladas: lote.toneladas,
    purezaPorcentaje: lote.pureza_porcentaje,
    puertoOrigen: lote.puerto_origen,
    pais: lote.pais ?? "México",
    precioUsd: lote.precio_usd,
    precioPublicadoUsd: lote.precio_publicado_usd,
    fechaLimiteExclusividad: lote.fecha_limite_exclusividad,
    mineroNombreEmpresa: (lote as any).perfiles?.nombre_empresa ?? "N/A",
    compradorEmail: escrow.comprador_email,
    montoOfertado: Number(escrow.monto_bruto),
    fechaOferta: escrow.creado_en,
  };
}

/**
 * SEGURIDAD (hallazgo 2026-07-24): antes esta función siempre escribía el
 * nombre real del vendedor y el email del comprador en el PDF, sin verificar
 * NCNDA, POF ni depósito en escrow. Ahora la revelación de identidad real es
 * un parámetro explícito, apagado por default.
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

/**
 * Tarea 1.8: construye el mapa completo de variables que consumen las
 * plantillas de src/lib/contracts/plantillas.ts. Los valores legales
 * (periodo de proteccion, penalizacion, comision, etc.) se jalan siempre de
 * NEXUS_NODE_LEGAL_RULES -- nunca se repiten a mano, para no volver a
 * introducir un bug de numeros duplicados como el de la comision del 5%.
 */
function construirVariables(
  datos: DatosContrato,
  identidadRevelada: boolean
): Record<string, string | number> {
  const ahora = new Date();
  const fechaGeneracion = ahora.toLocaleString("es-MX");
  const fechaReserva = new Date(datos.fechaOferta).toLocaleString("es-MX");
  const fechaExpiracion72h = datos.fechaLimiteExclusividad
    ? new Date(datos.fechaLimiteExclusividad).toLocaleString("es-MX")
    : new Date(new Date(datos.fechaOferta).getTime() + 72 * 60 * 60 * 1000).toLocaleString("es-MX");

  return {
    loteId: datos.loteId,
    mineral: sanearContraInyeccionLlaves(datos.mineral),
    toneladas: datos.toneladas,
    purezaPorcentaje: datos.purezaPorcentaje,
    puertoOrigen: sanearContraInyeccionLlaves(datos.puertoOrigen),
    pais: sanearContraInyeccionLlaves(datos.pais),
    precioPublicadoUsd: (datos.precioPublicadoUsd ?? datos.precioUsd).toLocaleString(),
    montoOfertadoUsd: datos.montoOfertado.toLocaleString(),
    fechaReserva,
    fechaExpiracion72h,
    fechaGeneracion,
    pofEstatus: "Pendiente de verificación (Modo POF, Nexus-SDR-ForensicGuard)",
    vendedorIdCodificado: idVendedorCodificado(datos.loteId),
    compradorIdCodificado: idCompradorCodificado(datos.compradorEmail),
    vendedorNombreEmpresa: sanearContraInyeccionLlaves(
      identidadRevelada ? datos.mineroNombreEmpresa : idVendedorCodificado(datos.loteId)
    ),
    compradorEmail: sanearContraInyeccionLlaves(
      identidadRevelada ? datos.compradorEmail : idCompradorCodificado(datos.compradorEmail)
    ),
    periodoProteccionMeses: NEXUS_NODE_LEGAL_RULES.PERIODO_PROTECCION_MESES,
    porcentajePenalizacionTotal: NEXUS_NODE_LEGAL_RULES.PORCENTAJE_PENALIZACION_PUENTEO * 100,
    porcentajeVendedor: NEXUS_NODE_LEGAL_RULES.PORCENTAJE_MINERO * 100,
    porcentajeComprador: NEXUS_NODE_LEGAL_RULES.PORCENTAJE_COMPRADOR * 100,
    interesMoratorioMensual: NEXUS_NODE_LEGAL_RULES.INTERES_MORATORIO_MENSUAL * 100,
    diaInicioInteres: 11,
    comisionMinimaPct: NEXUS_NODE_LEGAL_RULES.COMISION_PLATAFORMA_MINIMA * 100,
    comisionMaximaPct: NEXUS_NODE_LEGAL_RULES.COMISION_PLATAFORMA_MAXIMA * 100,
  };
}

const MARGEN = 60;
const ANCHO_PAGINA = 612;
const ALTO_PAGINA = 792;
const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2;

/**
 * Dibuja un bloque de texto largo con salto de línea automático y paginación,
 * en vez de posiciones fijas por campo. Las líneas que están completamente en
 * mayúsculas se tratan como subtítulos (negrita, un poco más grandes).
 */
function dibujarTextoConWrap(
  pdfDoc: PDFDocument,
  paginaInicial: PDFPage,
  fontRegular: PDFFont,
  fontBold: PDFFont,
  texto: string
): void {
  let pagina = paginaInicial;
  let y = ALTO_PAGINA - 52;
  const tamanoTexto = 9.5;
  const tamanoSubtitulo = 11;
  const interlineado = 13;

  const nuevaPagina = () => {
    pagina = pdfDoc.addPage([ANCHO_PAGINA, ALTO_PAGINA]);
    y = ALTO_PAGINA - 52;
  };

  const parrafos = texto.split("\n");

  for (const parrafoOriginal of parrafos) {
    const parrafo = parrafoOriginal.trim();

    if (parrafo === "") {
      y -= interlineado * 0.6;
      if (y < MARGEN) nuevaPagina();
      continue;
    }

    const esSubtitulo =
      parrafo === parrafo.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(parrafo) && parrafo.length < 70;
    const font = esSubtitulo ? fontBold : fontRegular;
    const tamano = esSubtitulo ? tamanoSubtitulo : tamanoTexto;

    if (esSubtitulo) y -= 4; // un poco de aire antes de cada subtítulo

    const palabras = parrafo.split(" ");
    let lineaActual = "";

    for (const palabra of palabras) {
      const lineaPrueba = lineaActual ? `${lineaActual} ${palabra}` : palabra;
      const ancho = font.widthOfTextAtSize(lineaPrueba, tamano);

      if (ancho > ANCHO_UTIL && lineaActual) {
        if (y < MARGEN) nuevaPagina();
        pagina.drawText(lineaActual, { x: MARGEN, y, size: tamano, font, color: rgb(0.05, 0.1, 0.18) });
        y -= interlineado;
        lineaActual = palabra;
      } else {
        lineaActual = lineaPrueba;
      }
    }

    if (lineaActual) {
      if (y < MARGEN) nuevaPagina();
      pagina.drawText(lineaActual, { x: MARGEN, y, size: tamano, font, color: rgb(0.05, 0.1, 0.18) });
      y -= interlineado;
    }
  }
}

async function generarPdfBase(
  datos: DatosContrato,
  opciones: { identidadRevelada: boolean }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const primeraPagina = pdfDoc.addPage([ANCHO_PAGINA, ALTO_PAGINA]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const variables = construirVariables(datos, opciones.identidadRevelada);
  const plantilla = opciones.identidadRevelada ? FINAL_TEMPLATE : RESERVA_TEMPLATE;
  const textoRenderizado = renderizarPlantilla(plantilla, variables);
  // Ultima linea de defensa: si algun campo trae un caracter que WinAnsi no
  // soporta (emoji, chino, cirilico, etc.), lo reemplazamos por "?" en vez de
  // dejar que pdf-lib truene toda la generacion del contrato.
  const textoSaneado = sanearParaWinAnsi(font, textoRenderizado);

  dibujarTextoConWrap(pdfDoc, primeraPagina, font, fontBold, textoSaneado);

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
// generarContratoPdf() recibe la versión segura (Etapa 1), nunca la que
// revela identidad, para que el hueco no se reintroduzca por accidente.
export const generarContratoPdf = generarContratoReservaPdf;
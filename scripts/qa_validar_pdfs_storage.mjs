// Script de QA: valida que los archivos guardados en el bucket "contracts"
// sean PDFs reales y no esten corruptos.
//
// Uso:
//   SUPABASE_URL=https://wqochjmyjqebsnsxgytn.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=tu-key \
//   node scripts/qa_validar_pdfs_storage.mjs

import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "contracts";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listarArchivosRecursivo(prefijo = "") {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefijo, { limit: 1000 });
  if (error) throw new Error(`Error al listar ${prefijo}: ${error.message}`);

  let archivos = [];
  for (const item of data ?? []) {
    const rutaCompleta = prefijo ? `${prefijo}/${item.name}` : item.name;
    if (item.id === null) {
      // Es una "carpeta" (lote_id) -- entrar recursivamente
      archivos = archivos.concat(await listarArchivosRecursivo(rutaCompleta));
    } else {
      archivos.push(rutaCompleta);
    }
  }
  return archivos;
}

async function validarArchivo(ruta) {
  const { data, error } = await supabase.storage.from(BUCKET).download(ruta);
  if (error || !data) {
    return { ruta, valido: false, motivo: `No se pudo descargar: ${error?.message}` };
  }

  const bytes = new Uint8Array(await data.arrayBuffer());

  if (bytes.length === 0) {
    return { ruta, valido: false, motivo: "Archivo de 0 bytes" };
  }

  const encabezado = new TextDecoder().decode(bytes.slice(0, 5));
  if (encabezado !== "%PDF-") {
    return { ruta, valido: false, motivo: `No empieza con %PDF- (empieza con: "${encabezado}")` };
  }

  try {
    const pdfDoc = await PDFDocument.load(bytes);
    const numPaginas = pdfDoc.getPageCount();
    if (numPaginas === 0) {
      return { ruta, valido: false, motivo: "PDF válido pero sin páginas" };
    }
    return { ruta, valido: true, paginas: numPaginas, tamanoKb: Math.round(bytes.length / 1024) };
  } catch (err) {
    return { ruta, valido: false, motivo: `pdf-lib no pudo abrirlo: ${err.message}` };
  }
}

async function correr() {
  console.log(`Listando archivos en el bucket "${BUCKET}"...\n`);
  const archivos = await listarArchivosRecursivo();

  if (archivos.length === 0) {
    console.log("No hay archivos en el bucket todavía.");
    return;
  }

  console.log(`${archivos.length} archivo(s) encontrado(s). Validando...\n`);

  let validos = 0;
  let invalidos = 0;

  for (const ruta of archivos) {
    const resultado = await validarArchivo(ruta);
    if (resultado.valido) {
      validos++;
      console.log(`✅ ${ruta} — ${resultado.paginas} página(s), ${resultado.tamanoKb} KB`);
    } else {
      invalidos++;
      console.log(`🚨 ${ruta} — INVÁLIDO: ${resultado.motivo}`);
    }
  }

  console.log(`\n===== RESUMEN =====`);
  console.log(`Válidos: ${validos} | Inválidos: ${invalidos} | Total: ${archivos.length}`);
}

correr();

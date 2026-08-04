// Script de QA: compara metadatos y documentos de un conjunto de lotes
// para detectar "cruces" — casos donde algo que debería ser único entre
// lotes distintos no lo es. Esto es una señal de fraude (doble uso de
// certificado) o de un bug de datos (documento subido al lote equivocado).
//
// Uso:
//   SUPABASE_URL=https://wqochjmyjqebsnsxgytn.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=tu-key \
//   LOTE_IDS="id1,id2,id3,id4,id5" \
//   node scripts/qa_detectar_cruces_lotes.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOTE_IDS = (process.env.LOTE_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || LOTE_IDS.length === 0) {
  console.error("Faltan variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOTE_IDS (separados por coma)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function agruparPorClave(items, obtenerClave) {
  const grupos = new Map();
  for (const item of items) {
    const clave = obtenerClave(item);
    if (clave === null || clave === undefined) continue;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(item);
  }
  return grupos;
}

async function correr() {
  console.log(`Analizando ${LOTE_IDS.length} lotes en busca de cruces...\n`);

  const { data: lotes, error: errorLotes } = await supabase
    .from("lotes")
    .select("id, minero_id, mineral, toneladas, pureza_porcentaje, puerto_origen, precio_usd, estatus")
    .in("id", LOTE_IDS);

  if (errorLotes) {
    console.error("Error al leer lotes:", errorLotes.message);
    process.exit(1);
  }

  const { data: documentos, error: errorDocs } = await supabase
    .from("documentos")
    .select("lote_id, tipo_documento, hash_validacion, url_archivo")
    .in("lote_id", LOTE_IDS);

  if (errorDocs) {
    console.error("Error al leer documentos:", errorDocs.message);
    process.exit(1);
  }

  let seEncontraronCruces = false;

  // ============================================================
  // Chequeo 1: mismo hash de documento usado en más de un lote
  // (el cruce más grave — indica reutilización fraudulenta de certificados)
  // ============================================================
  const porHash = agruparPorClave(documentos, (d) => d.hash_validacion);
  for (const [hash, docs] of porHash) {
    const lotesDistintos = new Set(docs.map((d) => d.lote_id));
    if (lotesDistintos.size > 1) {
      seEncontraronCruces = true;
      console.log(`🚨 CRUCE DE DOCUMENTO — mismo hash usado en ${lotesDistintos.size} lotes distintos:`);
      console.log(`   Hash: ${hash}`);
      docs.forEach((d) => console.log(`   - Lote ${d.lote_id} (${d.tipo_documento}): ${d.url_archivo}`));
      console.log("");
    }
  }

  // ============================================================
  // Chequeo 2: lotes con exactamente la misma huella de metadatos
  // (mismo minero + toneladas + pureza + puerto) — posible duplicado
  // accidental o intento de listar el mismo cobre físico dos veces
  // ============================================================
  const porHuella = agruparPorClave(
    lotes,
    (l) => `${l.minero_id}|${l.toneladas}|${l.pureza_porcentaje}|${l.puerto_origen}`
  );
  for (const [huella, grupo] of porHuella) {
    if (grupo.length > 1) {
      seEncontraronCruces = true;
      console.log(`🚨 CRUCE DE METADATOS — ${grupo.length} lotes con el mismo minero+toneladas+pureza+puerto:`);
      grupo.forEach((l) => console.log(`   - Lote ${l.id} (estatus: ${l.estatus})`));
      console.log("");
    }
  }

  // ============================================================
  // Chequeo 3: mismo comprador con más de un lote en estatus 'en_escrow'
  // simultáneamente (podría indicar reserva duplicada por error de lógica)
  // ============================================================
  const { data: lotesEnEscrow } = await supabase
    .from("lotes")
    .select("id, comprador_id")
    .in("id", LOTE_IDS)
    .eq("estatus", "en_escrow")
    .not("comprador_id", "is", null);

  if (lotesEnEscrow) {
    const porComprador = agruparPorClave(lotesEnEscrow, (l) => l.comprador_id);
    for (const [compradorId, grupo] of porComprador) {
      if (grupo.length > 1) {
        seEncontraronCruces = true;
        console.log(`🚨 CRUCE DE RESERVA — comprador ${compradorId} tiene ${grupo.length} lotes en_escrow al mismo tiempo:`);
        grupo.forEach((l) => console.log(`   - Lote ${l.id}`));
        console.log("");
      }
    }
  }

  if (!seEncontraronCruces) {
    console.log("✅ No se encontraron cruces entre los lotes analizados.");
  }

  console.log(`\n===== RESUMEN =====`);
  console.log(`Lotes analizados: ${lotes.length} de ${LOTE_IDS.length} solicitados`);
  console.log(`Documentos analizados: ${documentos.length}`);
}

correr();

// Script de sysadmin: purga archivos del bucket kyc-documents que pertenecen
// SOLO a lotes rechazados. Por defecto corre en modo DRY-RUN (no borra nada,
// solo reporta) -- hay que pasar --confirmar explicito para borrar de verdad.
//
// PROTECCION CLAVE: en esta base de datos hay archivos reciclados/compartidos
// entre multiples lotes (ej. el mismo PDF usado en 8 lotes con estatus
// distintos). Este script NUNCA borra un archivo si tambien esta referenciado
// por al menos un lote que NO este rechazado -- evita tumbar evidencia de
// lotes completados/publicados/en revision por accidente.
//
// Uso:
//   SUPABASE_URL=https://wqochjmyjqebsnsxgytn.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=tu-key \
//   node scripts/purgar_documentos_lotes_rechazados.mjs
//
//   # Para borrar de verdad (si no, solo reporta que borraria):
//   node scripts/purgar_documentos_lotes_rechazados.mjs --confirmar

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CONFIRMAR = process.argv.includes("--confirmar");
const BUCKET = "kyc-documents";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function correr() {
  console.log(`Modo: ${CONFIRMAR ? "BORRADO REAL" : "DRY-RUN (solo reporte, nada se borra)"}\n`);

  // 1. Archivos referenciados por al menos un lote rechazado
  const { data: docsRechazados, error: errorRechazados } = await supabase
    .from("documentos")
    .select("id, lote_id, url_archivo, lotes!inner(estatus)")
    .eq("lotes.estatus", "rechazado");

  if (errorRechazados) {
    console.error("Error al leer documentos de lotes rechazados:", errorRechazados.message);
    process.exit(1);
  }

  if (!docsRechazados || docsRechazados.length === 0) {
    console.log("No hay documentos ligados a lotes rechazados. Nada que hacer.");
    return;
  }

  const rutasUnicas = [...new Set(docsRechazados.map((d) => d.url_archivo))];
  console.log(`${rutasUnicas.length} archivo(s) único(s) referenciado(s) por lotes rechazados.\n`);

  let borrados = 0;
  let protegidos = 0;

  for (const ruta of rutasUnicas) {
    // 2. ¿Este mismo archivo está también en uso por algún lote NO rechazado?
    const { data: usosCompartidos, error: errorCompartidos } = await supabase
      .from("documentos")
      .select("lote_id, lotes!inner(estatus)")
      .eq("url_archivo", ruta)
      .neq("lotes.estatus", "rechazado");

    if (errorCompartidos) {
      console.log(`⚠️  ${ruta} — error al verificar uso compartido, se omite por seguridad: ${errorCompartidos.message}`);
      continue;
    }

    if (usosCompartidos && usosCompartidos.length > 0) {
      protegidos++;
      const estatusCompartidos = usosCompartidos.map((u) => u.lotes.estatus).join(", ");
      console.log(`🛡️  PROTEGIDO — ${ruta}`);
      console.log(`    También en uso por lote(s) con estatus: ${estatusCompartidos} — NO se borra.`);
      continue;
    }

    // 3. Exclusivo de lotes rechazados -- seguro de borrar
    if (CONFIRMAR) {
      const { error: errorBorrado } = await supabase.storage.from(BUCKET).remove([ruta]);
      if (errorBorrado) {
        console.log(`🚨 ${ruta} — error al borrar: ${errorBorrado.message}`);
      } else {
        borrados++;
        console.log(`🗑️  BORRADO — ${ruta}`);
      }
    } else {
      borrados++;
      console.log(`🔎 SE BORRARÍA — ${ruta} (dry-run, no se tocó)`);
    }
  }

  console.log(`\n===== RESUMEN =====`);
  console.log(`${CONFIRMAR ? "Borrados" : "Se borrarían"}: ${borrados}`);
  console.log(`Protegidos (compartidos con lotes no rechazados): ${protegidos}`);
  if (!CONFIRMAR) {
    console.log(`\nEsto fue un dry-run. Para borrar de verdad, corre con --confirmar`);
  }
}

correr();

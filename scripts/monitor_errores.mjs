// Script de DevOps: polling de eventos error/warn en agent_activity_logs.
// Corre en tu terminal (necesita salida real a internet, no funciona
// dentro del sandbox de Claude por las restricciones de red conocidas).
//
// Uso:
//   SUPABASE_URL=https://wqochjmyjqebsnsxgytn.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=tu-key \
//   INTERVALO_SEGUNDOS=5 \
//   node scripts/monitor_errores.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INTERVALO_MS = (parseInt(process.env.INTERVALO_SEGUNDOS ?? "5", 10)) * 1000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const COLOR = {
  reset: "\x1b[0m",
  rojo: "\x1b[31m",
  amarillo: "\x1b[33m",
  gris: "\x1b[90m",
  cyan: "\x1b[36m",
};

let ultimaRevision = new Date().toISOString();

async function revisarEventos() {
  const { data, error } = await supabase
    .from("agent_activity_logs")
    .select("id, agent_name, lot_id, payload, status, created_at")
    .in("status", ["error", "warn"])
    .gt("created_at", ultimaRevision)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`${COLOR.rojo}[MONITOR] Error consultando Supabase: ${error.message}${COLOR.reset}`);
    return;
  }

  if (data && data.length > 0) {
    for (const evento of data) {
      const color = evento.status === "error" ? COLOR.rojo : COLOR.amarillo;
      const hora = new Date(evento.created_at).toLocaleTimeString("es-MX");
      console.log(
        `${color}[${hora}] [${evento.status.toUpperCase()}] ${evento.agent_name}${COLOR.reset} ` +
        `${COLOR.gris}(lote: ${evento.lot_id})${COLOR.reset} ${JSON.stringify(evento.payload)}`
      );
    }
    ultimaRevision = data[data.length - 1].created_at;
  }
}

console.log(`${COLOR.cyan}[MONITOR] Escuchando errores/warnings cada ${INTERVALO_MS / 1000}s... (Ctrl+C para salir)${COLOR.reset}`);

setInterval(revisarEventos, INTERVALO_MS);
revisarEventos(); // primera corrida inmediata

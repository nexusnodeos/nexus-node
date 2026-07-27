"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AgentLog {
  id: string;
  agent_name: string;
  lot_id: string;
  payload: Record<string, any> | null;
  status: string;
  created_at: string;
}

interface AgentLogViewerProps {
  loteId: string;
}

const COLOR_STATUS: Record<string, string> = {
  completado: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  error: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  procesando: "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

export default function AgentLogViewer({ loteId }: AgentLogViewerProps) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    const cargarLogsIniciales = async () => {
      const { data, error } = await supabase
        .from("agent_activity_logs")
        .select("*")
        .eq("lot_id", loteId)
        .order("created_at", { ascending: false });

      if (!activo) return;
      if (!error && data) setLogs(data as AgentLog[]);
      setCargando(false);
    };

    cargarLogsIniciales();

    // Suscripción en tiempo real: solo nuevos logs de este lote
    const canal = supabase
      .channel(`agent-logs-lote-${loteId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_activity_logs",
          filter: `lot_id=eq.${loteId}`,
        },
        (payload) => {
          setLogs((prev) => [payload.new as AgentLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, [loteId]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">Actividad de Agentes IA</h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          En vivo
        </span>
      </div>

      {cargando && <p className="text-xs text-slate-500">Cargando historial...</p>}

      {!cargando && logs.length === 0 && (
        <p className="text-xs text-slate-500">Sin actividad registrada para este lote todavía.</p>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`border rounded-lg px-3 py-2 text-xs ${
              COLOR_STATUS[log.status] ?? "text-slate-300 border-slate-700 bg-slate-800/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">{log.agent_name}</span>
              <span className="text-slate-500">
                {new Date(log.created_at).toLocaleTimeString("es-MX")}
              </span>
            </div>
            <div className="text-slate-400">
              {log.status}
              {log.payload && (
                <pre className="mt-1 whitespace-pre-wrap break-all text-[10px] text-slate-500">
                  {JSON.stringify(log.payload)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Lote {
  id: string;
  toneladas: number;
  puerto_origen: string;
  precio_usd: number;
  estatus: string;
  fuente_origen: string;
  tiene_exclusividad: boolean;
}

export default function ConsolaAgentesPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cargando, setCargando] = useState(true);

  async function consultarLotes() {
    try {
      const { data } = await supabase
        .from("lotes")
        .select("*")
        .order("creado_en", { ascending: false });
      if (data) setLotes(data);
    } catch (error) {
      console.error("Error al consultar lotes:", error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    consultarLotes();
    
    const canal = supabase
      .channel("cambios-consola")
      .on("postgres_changes", { event: "*", schema: "public", table: "lotes" }, () => {
        consultarLotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER DE CONTROL */}
        <header className="border-b border-slate-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">NEXUS NODE // OMNI-AGENTS CONSOLE v2.0</h1>
            <p className="text-xs text-slate-400 mt-1">Monitoreo de flujo híbrido: Outbound Sourcing + Marketplace Spillover</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-3 py-1 rounded">
              SISTEMA AUTOMATIZADO: INICIADO
            </span>
          </div>
        </header>

        {/* TABLERO DE MONITOREO DE INVENTARIO AUTOMÁTICO */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">🔄 Monitoreo de Lotes y Trazabilidad de Agentes</h2>
          
          {cargando ? (
            <p className="text-xs text-slate-500">Sincronizando con Supabase...</p>
          ) : lotes.length === 0 ? (
            <p className="text-xs text-slate-500 bg-slate-900 p-4 rounded border border-slate-800">No hay operaciones activas detectadas por los agentes.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {lotes.map((lote) => (
                <div key={lote.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-cyan-500/30 transition-all">
                  
                  {/* Info Primaria */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-200">{lote.toneladas} Tons</span>
                      <span className="text-xs text-slate-500">|</span>
                      <span className="text-xs text-slate-400">{lote.puerto_origen}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">ID: {lote.id}</p>
                  </div>

                  {/* Origen del Lote */}
                  <div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      lote.fuente_origen === "scout_externo" 
                        ? "bg-indigo-950 text-indigo-400 border-indigo-800" 
                        : "bg-amber-950 text-amber-400 border-amber-800"
                    }`}>
                      {lote.fuente_origen === "scout_externo" ? "🤖 Cazado por Scout (Mail)" : "👤 Registro Interno"}
                    </span>
                  </div>

                  {/* Contrato de Exclusividad */}
                  <div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      lote.tiene_exclusividad 
                        ? "bg-emerald-950 text-emerald-400 border-emerald-800 animate-pulse" 
                        : "bg-slate-950 text-slate-500 border-slate-800"
                    }`}>
                      {lote.tiene_exclusividad ? "🔒 Exclusividad 72h Firmada" : "⏳ Sin Exclusividad"}
                    </span>
                  </div>

                  {/* Estado de Venta / Derrame */}
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-400">${lote.precio_usd.toLocaleString()} USD</p>
                    <p className={`text-[10px] uppercase font-bold mt-1 ${
                      lote.estatus === "publicado" ? "text-cyan-400 animate-pulse" : "text-slate-400"
                    }`}>
                      {lote.estatus === "publicado" ? "🌐 En Marketplace (Derrame)" : `Estatus: ${lote.estatus}`}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

        {/* TERMINALES SIMULADAS DE LOGS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
            <p className="text-xs font-bold text-indigo-400">🤖 PIPELINE OUTBOUND (TRATO EXPRÉS)</p>
            <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-3 rounded h-32 overflow-y-auto">
              <p className="text-slate-600">[SCOUT] Buscando lotes de cobre en bases externas...</p>
              <p className="text-indigo-400">[SCOUT] Match! Detectado lote con spread &gt; 28% v LME.</p>
              <p className="text-amber-400">[CLOSER] Correos automáticos enviados (Minero: Solicitud Exclusividad / Comprador: Oferta Caliente).</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
            <p className="text-xs font-bold text-cyan-400">🌐 SPILLOVER ENGINE (DERRAME MARKETPLACE)</p>
            <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-3 rounded h-32 overflow-y-auto">
              <p className="text-slate-600">[MARKET SYNCER] Escaneando firmas de exclusividad...</p>
              <p className="text-emerald-400">[MARKET SYNCER] Firma detectada. Trato exprés en proceso.</p>
              <p className="text-cyan-400">[MARKET SYNCER] Alerta: Lote no cerrado en primeras horas. Subiendo automáticamente al Marketplace web para venta manual...</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
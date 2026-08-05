"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EstatusLote = "borrador" | "validando" | "publicado" | "en_escrow" | "completado";
type EstatusEscrow = "PENDING" | "DEPOSITED" | "RELEASED";

interface DealProgressBarProps {
  // Modo controlado (como antes): el padre pasa el estatus directo, sin Realtime.
  estatus?: EstatusLote;
  estatusEscrow?: EstatusEscrow;
  // Modo en vivo (nuevo): pasando loteId, el componente jala su propio estado
  // inicial y se suscribe a Realtime -- se actualiza solo sin que el padre
  // tenga que volver a renderizarlo.
  loteId?: string;
}

const PASOS: { key: EstatusLote; label: string }[] = [
  { key: "borrador", label: "Borrador" },
  { key: "validando", label: "En Validación" },
  { key: "publicado", label: "Publicado" },
  { key: "en_escrow", label: "En Escrow" },
  { key: "completado", label: "Completado" },
];

const SUBLABEL_ESCROW: Record<EstatusEscrow, string> = {
  PENDING: "Esperando depósito",
  DEPOSITED: "Depósito confirmado",
  RELEASED: "Fondos liberados",
};

export default function DealProgressBar({ estatus, estatusEscrow, loteId }: DealProgressBarProps) {
  const [estatusEnVivo, setEstatusEnVivo] = useState<EstatusLote | undefined>(estatus);
  const [estatusEscrowEnVivo, setEstatusEscrowEnVivo] = useState<EstatusEscrow | undefined>(estatusEscrow);

  useEffect(() => {
    if (!loteId) return; // modo controlado: no hace nada, usa los props tal cual

    let activo = true;

    const cargarEstadoInicial = async () => {
      const { data: lote } = await supabase.from("lotes").select("estatus").eq("id", loteId).single();
      if (activo && lote) setEstatusEnVivo(lote.estatus as EstatusLote);

      const { data: escrow } = await supabase
        .from("escrow_transactions")
        .select("status")
        .eq("lote_id", loteId)
        .order("creado_en", { ascending: false })
        .limit(1)
        .single();
      if (activo && escrow) setEstatusEscrowEnVivo(escrow.status as EstatusEscrow);
    };

    cargarEstadoInicial();

    const canal = supabase
      .channel(`deal-progress-${loteId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lotes", filter: `id=eq.${loteId}` },
        (payload) => setEstatusEnVivo(payload.new.estatus as EstatusLote)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "escrow_transactions", filter: `lote_id=eq.${loteId}` },
        (payload) => setEstatusEscrowEnVivo((payload.new as any).status as EstatusEscrow)
      )
      .subscribe();

    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, [loteId]);

  const estatusFinal = loteId ? estatusEnVivo : estatus;
  const estatusEscrowFinal = loteId ? estatusEscrowEnVivo : estatusEscrow;

  if (!estatusFinal) return null; // aún cargando el estado inicial en modo loteId

  const indiceActual = PASOS.findIndex((p) => p.key === estatusFinal);

  return (
    <div className="w-full">
      <div className="flex items-center">
        {PASOS.map((paso, i) => {
          const completado = i < indiceActual;
          const actual = i === indiceActual;
          const pendiente = i > indiceActual;

          return (
            <div key={paso.key} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                    ${completado ? "bg-amber-500 text-slate-950" : ""}
                    ${actual ? "bg-amber-500/20 border-2 border-amber-500 text-amber-400" : ""}
                    ${pendiente ? "bg-slate-800 border border-slate-700 text-slate-500" : ""}
                  `}
                >
                  {completado ? "✓" : i + 1}
                </div>
                <span
                  className={`text-[11px] whitespace-nowrap ${
                    actual ? "text-amber-400 font-semibold" : completado ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {paso.label}
                </span>
                {actual && paso.key === "en_escrow" && estatusEscrowFinal && (
                  <span className="text-[10px] text-slate-400">{SUBLABEL_ESCROW[estatusEscrowFinal]}</span>
                )}
              </div>

              {i < PASOS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 -mt-5 ${
                    completado ? "bg-amber-500" : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

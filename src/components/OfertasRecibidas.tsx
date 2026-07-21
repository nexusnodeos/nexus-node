"use client";

import { useEffect, useState } from "react";
import { Mail, DollarSign, Check, X, Loader2 } from "lucide-react";
import { obtenerOfertasPorLote, aceptarOferta, rechazarOferta, Oferta } from "@/lib/ofertas";

export default function OfertasRecibidas({
  loteId,
  onLoteActualizado,
}: {
  loteId: string;
  onLoteActualizado: () => void;
}) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const cargar = async () => {
    setCargando(true);
    const { data } = await obtenerOfertasPorLote(loteId);
    setOfertas(data ?? []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, [loteId]);

  const handleAceptar = async (ofertaId: string) => {
    setProcesandoId(ofertaId);
    const { error } = await aceptarOferta(loteId, ofertaId);
    setProcesandoId(null);
    if (error) return alert(error.message);
    await cargar();
    onLoteActualizado();
  };

  const handleRechazar = async (ofertaId: string) => {
    setProcesandoId(ofertaId);
    const { error } = await rechazarOferta(ofertaId);
    setProcesandoId(null);
    if (error) return alert(error.message);
    cargar();
  };

  if (cargando) return <p className="text-xs text-foreground/50 py-2">Cargando ofertas...</p>;
  if (ofertas.length === 0) return <p className="text-xs text-foreground/50 py-2">Sin ofertas todavía.</p>;

  return (
    <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
      {ofertas.map((o) => (
        <div key={o.id} className="glass-panel rounded-lg p-3 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1 text-xs text-foreground/70">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-foreground/40" /> {o.comprador_email}
            </span>
            <span className="flex items-center gap-1.5 text-nexus-gold font-semibold">
              <DollarSign className="h-3 w-3" /> {Number(o.monto_ofertado).toLocaleString()}
            </span>
          </div>

          {o.estatus === "pendiente" ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleAceptar(o.id)}
                disabled={procesandoId === o.id}
                className="p-2 rounded-md bg-nexus-cyan/10 border border-nexus-cyan/30 text-nexus-cyan hover:bg-nexus-cyan/20"
              >
                {procesandoId === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => handleRechazar(o.id)}
                disabled={procesandoId === o.id}
                className="p-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs capitalize text-foreground/50">{o.estatus}</span>
          )}
        </div>
      ))}
    </div>
  );
}
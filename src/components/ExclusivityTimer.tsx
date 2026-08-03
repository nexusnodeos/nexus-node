"use client";

import { useEffect, useState } from "react";

// Debe coincidir con el INTERVAL usado en expirar_reservas_desatendidas() (Supabase)
const MINUTOS_EXCLUSIVIDAD = 10;

interface ExclusivityTimerProps {
  reservadoEn: string; // ISO timestamp, viene de lotes.reservado_en
  onExpirar?: () => void;
}

function calcularSegundosRestantes(reservadoEn: string): number {
  const inicio = new Date(reservadoEn).getTime();
  const limite = inicio + MINUTOS_EXCLUSIVIDAD * 60 * 1000;
  const restante = Math.floor((limite - Date.now()) / 1000);
  return Math.max(restante, 0);
}

export default function ExclusivityTimer({ reservadoEn, onExpirar }: ExclusivityTimerProps) {
  const [segundosRestantes, setSegundosRestantes] = useState(() => calcularSegundosRestantes(reservadoEn));
  const [yaAvisoExpiracion, setYaAvisoExpiracion] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const restante = calcularSegundosRestantes(reservadoEn);
      setSegundosRestantes(restante);

      if (restante === 0 && !yaAvisoExpiracion) {
        setYaAvisoExpiracion(true);
        onExpirar?.();
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [reservadoEn, onExpirar, yaAvisoExpiracion]);

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const expirado = segundosRestantes === 0;
  const esCritico = segundosRestantes > 0 && segundosRestantes <= 60; // último minuto

  if (expirado) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg px-3 py-1.5 text-xs font-semibold">
        Reserva expirada
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border ${
        esCritico
          ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse"
          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      Exclusividad: {String(minutos).padStart(2, "0")}:{String(segundos).padStart(2, "0")}
    </div>
  );
}

"use client";

type EstatusLote = "borrador" | "validando" | "publicado" | "en_escrow" | "completado";
type EstatusEscrow = "PENDING" | "DEPOSITED" | "RELEASED";

interface DealProgressBarProps {
  estatus: EstatusLote;
  estatusEscrow?: EstatusEscrow; // opcional: detalle fino cuando estatus === "en_escrow"
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

export default function DealProgressBar({ estatus, estatusEscrow }: DealProgressBarProps) {
  const indiceActual = PASOS.findIndex((p) => p.key === estatus);

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
                {actual && paso.key === "en_escrow" && estatusEscrow && (
                  <span className="text-[10px] text-slate-400">{SUBLABEL_ESCROW[estatusEscrow]}</span>
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

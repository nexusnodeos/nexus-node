"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (firmaBase64: string) => void;
  titulo?: string;
}

export default function SignatureModal({
  isOpen,
  onClose,
  onGuardar,
  titulo = "Firma el Contrato",
}: SignatureModalProps) {
  const firmaRef = useRef<SignatureCanvas>(null);
  const [estaVacio, setEstaVacio] = useState(true);
  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  const limpiarFirma = () => {
    firmaRef.current?.clear();
    setEstaVacio(true);
  };

  const confirmarFirma = async () => {
    if (!firmaRef.current || firmaRef.current.isEmpty()) {
      alert("Dibuja tu firma antes de continuar.");
      return;
    }

    setGuardando(true);
    try {
      const firmaBase64 = firmaRef.current.getTrimmedCanvas().toDataURL("image/png");

      onGuardar(firmaBase64);
      limpiarFirma();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{titulo}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">
            ×
          </button>
        </div>

        <p className="text-xs text-slate-400">Dibuja tu firma en el recuadro con el dedo o el mouse.</p>

        <div className="bg-white rounded-lg overflow-hidden border border-slate-700">
          <SignatureCanvas
            ref={firmaRef}
            penColor="black"
            canvasProps={{
              width: 400,
              height: 180,
              className: "w-full touch-none",
            }}
            onBegin={() => setEstaVacio(false)}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={limpiarFirma}
            disabled={estaVacio}
            className="flex-1 border border-slate-700 text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-800 disabled:opacity-40"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={confirmarFirma}
            disabled={guardando}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg py-2 text-sm disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Confirmar Firma"}
          </button>
        </div>
      </div>
    </div>
  );
}

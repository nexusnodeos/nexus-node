"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const TIPOS_DOCUMENTO = [
  { value: "certificado_sgs", label: "Certificado SGS" },
  { value: "certificado_alex_stewart", label: "Certificado Alex Stewart" },
  { value: "pedimento", label: "Pedimento de Exportación" },
];

interface ArchivoPendiente {
  tipo: string;
  file: File;
}

interface LotUploadFormProps {
  onSuccess?: () => void;
}

export default function LotUploadForm({ onSuccess }: LotUploadFormProps) {
  const [toneladas, setToneladas] = useState("");
  const [pureza, setPureza] = useState("");
  const [puerto, setPuerto] = useState("Manzanillo");
  const [precio, setPrecio] = useState("");
  const [archivos, setArchivos] = useState<ArchivoPendiente[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPOS_DOCUMENTO[0].value);
  const [registrando, setRegistrando] = useState(false);

  function agregarArchivo(file: File) {
    setArchivos((prev) => [...prev, { tipo: tipoSeleccionado, file }]);
  }

  function quitarArchivo(index: number) {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  }

  const manejarRegistroLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toneladas || !pureza || !precio) return alert("Llena todos los campos");
    if (archivos.length === 0) return alert("Sube al menos un documento de certificación");

    setRegistrando(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("No hay sesión activa. Autentica primero.");
      const mineroId = userData.user.id;

      // 1. Crear el lote en borrador, ligado al minero autenticado
      const { data: lote, error: errorLote } = await supabase
        .from("lotes")
        .insert({
          minero_id: mineroId,
          toneladas: Number(toneladas),
          pureza_porcentaje: Number(pureza),
          puerto_origen: puerto,
          precio_usd: Number(precio),
          estatus: "borrador",
        })
        .select()
        .single();

      if (errorLote || !lote) throw new Error(errorLote?.message ?? "Error al crear el lote");

      // 2. Subir cada documento al bucket kyc-documents (ruta obligatoria: {mineroId}/...)
      for (const { tipo, file } of archivos) {
        const rutaArchivo = `${mineroId}/${lote.id}_${tipo}_${file.name}`;

        const { error: errorUpload } = await supabase.storage
          .from("kyc-documents")
          .upload(rutaArchivo, file);

        if (errorUpload) throw new Error(`Error al subir ${file.name}: ${errorUpload.message}`);

        const { error: errorDoc } = await supabase.from("documentos").insert({
          lote_id: lote.id,
          tipo_documento: tipo,
          url_archivo: rutaArchivo,
          validado_por_ia: false,
        });

        if (errorDoc) throw new Error(`Error al registrar documento: ${errorDoc.message}`);
      }

      // 3. Pasar el lote a "validando" para que el Legal Guardián lo revise
      await supabase.from("lotes").update({ estatus: "validando" }).eq("id", lote.id);

      alert("¡Lote registrado con éxito! Está en validación.");
      setToneladas("");
      setPureza("");
      setPrecio("");
      setArchivos([]);
      onSuccess?.();
    } catch (error: any) {
      alert("Error al registrar lote: " + error.message);
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <form onSubmit={manejarRegistroLote} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Toneladas</label>
        <input type="number" required value={toneladas} onChange={(e) => setToneladas(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500" placeholder="Ej. 500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Pureza (%)</label>
        <input type="number" step="0.1" required value={pureza} onChange={(e) => setPureza(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500" placeholder="Ej. 99.4" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Puerto de Origen</label>
        <select value={puerto} onChange={(e) => setPuerto(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500">
          <option value="Manzanillo">Manzanillo</option>
          <option value="Lázaro Cárdenas">Lázaro Cárdenas</option>
          <option value="Veracruz">Veracruz</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Precio Deseado (USD)</label>
        <input type="number" required value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500" placeholder="Ej. 3500000" />
      </div>

      <div className="border-t border-slate-800 pt-4">
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Documentos de Certificación</label>

        <div className="flex gap-2 mb-3">
          <select
            value={tipoSeleccionado}
            onChange={(e) => setTipoSeleccionado(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
          >
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 bg-amber-950/30 border border-amber-500/40 text-amber-400 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-amber-900/40 whitespace-nowrap">
            + Adjuntar archivo
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files?.[0]) agregarArchivo(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <div className="space-y-2">
          {archivos.map((a, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-300 truncate">
                {a.file.name} <span className="text-slate-500">({TIPOS_DOCUMENTO.find((t) => t.value === a.tipo)?.label})</span>
              </span>
              <button type="button" onClick={() => quitarArchivo(i)} className="text-slate-500 hover:text-rose-400 text-xs font-bold px-2">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={registrando} className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
        {registrando ? "Registrando..." : "Registrar Lote"}
      </button>
    </form>
  );
}

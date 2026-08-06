"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TIPOS_DOCUMENTO = [
  { value: "certificado_sgs", label: "Certificado SGS" },
  { value: "certificado_alex_stewart", label: "Certificado Alex Stewart" },
  { value: "pedimento", label: "Pedimento de Exportación" },
];

// Clave de localStorage para el borrador. Solo guarda los campos de texto --
// los archivos (File) no se pueden serializar y hay que volver a adjuntarlos
// si se pierde la sesión del navegador (limitación real, no evitable).
const CLAVE_BORRADOR = "nexus_borrador_lote";

interface ArchivoPendiente {
  tipo: string;
  file: File;
}

interface LotUploadFormProps {
  onSuccess?: () => void;
}

function cargarBorrador() {
  if (typeof window === "undefined") return null;
  try {
    const guardado = window.localStorage.getItem(CLAVE_BORRADOR);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

function guardarBorrador(datos: { toneladas: string; pureza: string; puerto: string; precio: string }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos));
  } catch {
    // Si localStorage falla (modo incógnito estricto, cuota llena, etc.),
    // no rompemos el formulario -- simplemente no hay borrador esa vez.
  }
}

function borrarBorrador() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLAVE_BORRADOR);
}

export default function LotUploadForm({ onSuccess }: LotUploadFormProps) {
  const [toneladas, setToneladas] = useState("");
  const [pureza, setPureza] = useState("");
  const [puerto, setPuerto] = useState("Manzanillo");
  const [precio, setPrecio] = useState("");
  const [archivos, setArchivos] = useState<ArchivoPendiente[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPOS_DOCUMENTO[0].value);
  const [registrando, setRegistrando] = useState(false);
  const [borradorRestaurado, setBorradorRestaurado] = useState(false);

  // Al montar: si hay un borrador guardado de una sesión anterior (ej. se
  // cortó la conexión y el usuario recargó la página), lo restauramos.
  useEffect(() => {
    const borrador = cargarBorrador();
    if (borrador) {
      setToneladas(borrador.toneladas ?? "");
      setPureza(borrador.pureza ?? "");
      setPuerto(borrador.puerto ?? "Manzanillo");
      setPrecio(borrador.precio ?? "");
      setBorradorRestaurado(true);
    }
  }, []);

  // Cada vez que cambia un campo, se guarda el borrador -- esto no depende
  // de la red en absoluto (localStorage es 100% local), así que sobrevive
  // un corte de conexión sin problema.
  useEffect(() => {
    guardarBorrador({ toneladas, pureza, puerto, precio });
  }, [toneladas, pureza, puerto, precio]);

  function agregarArchivo(file: File) {
    setArchivos((prev) => [...prev, { tipo: tipoSeleccionado, file }]);
  }

  function quitarArchivo(index: number) {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  }

  function descartarBorrador() {
    setToneladas("");
    setPureza("");
    setPuerto("Manzanillo");
    setPrecio("");
    borrarBorrador();
    setBorradorRestaurado(false);
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
      borrarBorrador();
      setBorradorRestaurado(false);
      onSuccess?.();
    } catch (error: any) {
      alert("Error al registrar lote: " + error.message);
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <form onSubmit={manejarRegistroLote} className="space-y-4">
      {borradorRestaurado && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs text-amber-800">
          <span>📋 Se restauró un borrador guardado localmente (ej. de una conexión interrumpida).</span>
          <button type="button" onClick={descartarBorrador} className="font-semibold underline shrink-0 ml-2">
            Descartar
          </button>
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-[#75604F] uppercase mb-1">Toneladas</label>
        <input type="number" required value={toneladas} onChange={(e) => setToneladas(e.target.value)} className="w-full bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] focus:outline-none focus:border-[#B15A2A]" placeholder="Ej. 500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#75604F] uppercase mb-1">Pureza (%)</label>
        <input type="number" step="0.1" required value={pureza} onChange={(e) => setPureza(e.target.value)} className="w-full bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] focus:outline-none focus:border-[#B15A2A]" placeholder="Ej. 99.4" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#75604F] uppercase mb-1">Puerto de Origen</label>
        <select value={puerto} onChange={(e) => setPuerto(e.target.value)} className="w-full bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] focus:outline-none focus:border-[#B15A2A]">
          <option value="Manzanillo">Manzanillo</option>
          <option value="Lázaro Cárdenas">Lázaro Cárdenas</option>
          <option value="Veracruz">Veracruz</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#75604F] uppercase mb-1">Precio Deseado (USD)</label>
        <input type="number" required value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] focus:outline-none focus:border-[#B15A2A]" placeholder="Ej. 3500000" />
      </div>

      <div className="border-t border-[#E9DFD2] pt-4">
        <label className="block text-xs font-semibold text-[#75604F] uppercase mb-2">Documentos de Certificación</label>

        <div className="flex gap-2 mb-3">
          <select
            value={tipoSeleccionado}
            onChange={(e) => setTipoSeleccionado(e.target.value)}
            className="bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] text-sm focus:outline-none focus:border-[#B15A2A]"
          >
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 bg-[#F7E5D3] border border-[#B15A2A]/40 text-[#8C4620] rounded-full px-4 py-2 text-sm cursor-pointer hover:bg-[#F0D5BC] whitespace-nowrap">
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
            <div key={i} className="flex items-center justify-between bg-white border border-[#E9DFD2] rounded-lg px-3 py-2">
              <span className="text-xs text-[#241A14] truncate">
                {a.file.name} <span className="text-[#8A7561]">({TIPOS_DOCUMENTO.find((t) => t.value === a.tipo)?.label})</span>
              </span>
              <button type="button" onClick={() => quitarArchivo(i)} className="text-[#8A7561] hover:text-rose-600 text-xs font-bold px-2">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={registrando} className="w-full bg-[#B15A2A] hover:bg-[#8C4620] text-white font-medium text-sm py-3 px-4 rounded-full transition-colors disabled:opacity-50">
        {registrando ? "Registrando..." : "Registrar Lote"}
      </button>
    </form>
  );
}

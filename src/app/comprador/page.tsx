"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Lote {
  id: string;
  toneladas: number;
  pureza_porcentaje: number;
  puerto_origen: string;
  precio_usd: number;
  estatus: string;
  creado_en: string;
}

interface MiOferta {
  id: string;
  monto_ofertado: number;
  estatus: string;
  creado_en: string;
  lotes: {
    toneladas: number;
    puerto_origen: string;
  } | null;
}

export default function CompradorPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [misOfertas, setMisOfertas] = useState<MiOferta[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [ofertaDinero, setOfertaDinero] = useState("");
  const [enviandoOferta, setEnviandoOferta] = useState(false);

  const emailComprador = "comprador.test@nexus.com";

  // Función para obtener datos de Supabase
  async function cargarDatos() {
    try {
      // 1. Obtener lotes publicados
      const { data: dataLotes, error: errorLotes } = await supabase
        .from("lotes")
        .select("*")
        .eq("estatus", "publicado")
        .order("creado_en", { ascending: false });

      if (errorLotes) throw errorLotes;
      setLotes(dataLotes || []);

      // 2. Obtener ofertas que ha enviado este comprador (con datos del lote)
      const { data: dataOfertas, error: errorOfertas } = await supabase
        .from("ofertas")
        .select(`
          id,
          monto_ofertado,
          estatus,
          creado_en,
          lotes (
            toneladas,
            puerto_origen
          )
        `)
        .eq("comprador_email", emailComprador)
        .order("creado_en", { ascending: false });

      if (errorOfertas) throw errorOfertas;
      // Adaptar el tipado de la relación
      setMisOfertas((dataOfertas as any) || []);

    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const manejarEnviarOferta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteSeleccionado || !ofertaDinero) return;

    setEnviandoOferta(true);
    try {
      const { error } = await supabase.from("ofertas").insert([
        {
          lote_id: loteSeleccionado.id,
          comprador_email: emailComprador,
          monto_ofertado: Number(ofertaDinero),
          estatus: "pendiente",
        },
      ]);

      if (error) throw error;

      alert("¡Oferta enviada con éxito al minero!");
      setLoteSeleccionado(null);
      setOfertaDinero("");
      cargarDatos(); // Recargar todo para ver la oferta en la lista
    } catch (error) {
      console.error("Error al enviar oferta:", error);
      alert("No se pudo enviar la oferta.");
    } finally {
      setEnviandoOferta(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* SECCIÓN IZQUIERDA Y CENTRAL: PIZARRA DE LOTES (Ocupa 2 columnas) */}
      <div className="lg:col-span-2 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-amber-500">Pizarra de Minerales Disponibles</h1>
          <p className="text-slate-400 mt-2">Portal exclusivo para compradores de Nexus Node</p>
        </header>

        {cargando ? (
          <div className="text-center py-12 text-slate-400">Cargando mercado...</div>
        ) : lotes.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
            <p className="text-slate-400">No hay lotes disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lotes.map((lote) => (
              <div key={lote.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-amber-500/50 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-amber-500/10 text-amber-500 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase">
                    {lote.estatus}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(lote.creado_en).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-slate-300">
                    <span className="mr-2">📦</span>
                    <span className="font-medium">{lote.toneladas} Toneladas</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <span className="mr-2">🧪</span>
                    <span>Pureza: {lote.pureza_porcentaje}%</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <span className="mr-2">⚓</span>
                    <span>Puerto: {lote.puerto_origen}</span>
                  </div>
                  <div className="flex items-center text-slate-300 pt-2 border-t border-slate-800">
                    <span className="mr-1 text-emerald-400">💵</span>
                    <span className="text-xl font-bold text-emerald-400">
                      ${lote.precio_usd.toLocaleString()} USD
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setLoteSeleccionado(lote)}
                  className="w-full mt-6 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Enviar Oferta de Compra
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN DERECHA: MIS OFERTAS ENVIADAS (Ocupa 1 columna) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
        <h2 className="text-xl font-bold text-slate-200 mb-4">Mis Ofertas Enviadas</h2>
        
        {cargando ? (
          <p className="text-sm text-slate-500">Cargando tus ofertas...</p>
        ) : misOfertas.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no has enviado ofertas de compra.</p>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {misOfertas.map((of) => (
              <div key={of.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${
                    of.estatus === "aceptada" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    of.estatus === "rechazada" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                    "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}>
                    {of.estatus === "aceptada" ? "✓ Ganada" : of.estatus === "rechazada" ? "✗ Rechazada" : "⏳ Pendiente"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(of.creado_en).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm font-medium text-slate-300">
                  {of.lotes?.toneladas || 0} Tons en {of.lotes?.puerto_origen || "N/A"}
                </p>
                <p className="text-md font-bold text-emerald-400 mt-1">
                  ${of.monto_ofertado.toLocaleString()} USD
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL FLOTANTE DE OFERTA --- */}
      {loteSeleccionado && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-amber-500 mb-2">Enviar Oferta</h3>
            <p className="text-sm text-slate-400 mb-4">
              Estás ofertando por el lote de {loteSeleccionado.toneladas} Tons en {loteSeleccionado.puerto_origen}.
            </p>
            
            <form onSubmit={manejarEnviarOferta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Tu oferta en USD
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 3400000"
                  value={ofertaDinero}
                  onChange={(e) => setOfertaDinero(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLoteSeleccionado(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoOferta}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {enviandoOferta ? "Enviando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
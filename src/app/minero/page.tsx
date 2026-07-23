"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LotUploadForm from "@/components/LotUploadForm";

interface Lote {
  id: string;
  toneladas: number;
  pureza_porcentaje: number;
  puerto_origen: string;
  precio_usd: number;
  estatus: string;
  creado_en: string;
}

interface Oferta {
  id: string;
  lote_id: string;
  comprador_email: string;
  monto_ofertado: number;
  estatus: string;
}

export default function MineroPage() {
  const [autenticado, setAutenticado] = useState(false);

  // Estados de Lotes y Ofertas
  const [misLotes, setMisLotes] = useState<Lote[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [ofertasRecibidas, setOfertasRecibidas] = useState<Oferta[]>([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(false);

  // 1. Botón inteligente de Autenticación de Prueba
  const manejarAutenticacionPrueba = async () => {
    const emailPrueba = "test.user@example.com";
    const passwordPrueba = "NexusTest123!";

    // Intentar Login
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: emailPrueba,
      password: passwordPrueba,
    });

    if (signInError) {
      // Si no existe, lo registramos automáticamente
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailPrueba,
        password: passwordPrueba,
      });

      if (signUpError) {
        alert("Error de autenticación: " + signUpError.message);
        return;
      }
    }

    setAutenticado(true);
    alert("¡Usuario de prueba autenticado con éxito!");
    obtenerMisLotes();
  };

  // 2. Traer los lotes creados
  const obtenerMisLotes = async () => {
    const { data, error } = await supabase
      .from("lotes")
      .select("*")
      .order("creado_en", { ascending: false });

    if (!error && data) setMisLotes(data);
  };

  useEffect(() => {
    obtenerMisLotes();
  }, []);

  // 4. Ver Ofertas de un lote específico
  const verOfertasDelLote = async (lote: Lote) => {
    setLoteSeleccionado(lote);
    setCargandoOfertas(true);
    
    const { data, error } = await supabase
      .from("ofertas")
      .select("*")
      .eq("lote_id", lote.id);

    if (!error && data) setOfertasRecibidas(data);
    setCargandoOfertas(false);
  };

  // 5. Resolver Oferta (Aceptar / Rechazar)
  const resolverOferta = async (ofertaId: string, accion: "aceptar" | "rechazar") => {
    if (!loteSeleccionado) return;

    try {
      if (accion === "aceptar") {
        // Aceptar esta oferta específica
        await supabase.from("ofertas").update({ estatus: "aceptada" }).eq("id", ofertaId);
        // Rechazar todas las demás ofertas de este lote
        await supabase.from("ofertas").update({ estatus: "rechazada" }).eq("lote_id", loteSeleccionado.id).neq("id", ofertaId);
        // Marcar el lote original como VENDIDO
        await supabase.from("lotes").update({ estatus: "vendido" }).eq("id", loteSeleccionado.id);
        
        alert("¡Felicidades! Oferta aceptada y lote vendido.");
      } else {
        // Simplemente rechazar esta oferta
        await supabase.from("ofertas").update({ estatus: "rechazada" }).eq("id", ofertaId);
        alert("Oferta rechazada.");
      }

      // Actualizar datos en pantalla
      obtenerMisLotes();
      setLoteSeleccionado(null);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al procesar la acción.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* COLUMNA IZQUIERDA: FORMULARIO */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
        <h1 className="text-2xl font-bold text-amber-500 mb-6">Portal del Minero - Registrar Mineral</h1>
        
        <button
          onClick={manejarAutenticacionPrueba}
          className={`w-full mb-6 py-2 px-4 rounded-lg font-semibold border transition-colors ${
            autenticado ? "bg-emerald-950/30 border-emerald-500 text-emerald-400" : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
          }`}
        >
          {autenticado ? "✓ Usuario de Prueba Conectado" : "⚡ Autenticar Usuario de Prueba"}
        </button>

        <LotUploadForm onSuccess={obtenerMisLotes} />
      </div>

      {/* COLUMNA DERECHA: HISTORIAL Y OFERTAS */}
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-4">Mis Lotes En Mercado</h2>
          
          {misLotes.length === 0 ? (
            <p className="text-slate-500 text-sm">No has registrado ningún lote todavía.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {misLotes.map((lote) => (
                <div key={lote.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-slate-200">{lote.toneladas} Tons - {lote.puerto_origen}</p>
                    <p className="text-xs text-slate-500">Pureza: {lote.pureza_porcentaje}% | Status: <span className={lote.estatus === "vendido" ? "text-emerald-400 font-bold" : "text-amber-400"}>{lote.estatus}</span></p>
                  </div>
                  {lote.estatus === "publicado" && (
                    <button onClick={() => verOfertasDelLote(lote)} className="bg-slate-800 hover:bg-slate-700 text-xs text-amber-500 font-semibold py-1 px-3 rounded border border-slate-700">
                      Ver Ofertas
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBPANEL DE OFERTAS COMPRADOR */}
        {loteSeleccionado && (
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-amber-500 mb-1">Ofertas para el Lote seleccionado</h3>
            <p className="text-xs text-slate-400 mb-4">Lote ID: {loteSeleccionado.id.slice(0, 8)}... ({loteSeleccionado.toneladas} Tons)</p>

            {cargandoOfertas ? (
              <p className="text-sm text-slate-400">Buscando en la base de datos...</p>
            ) : ofertasRecibidas.length === 0 ? (
              <p className="text-sm text-slate-500">Ningún comprador ha ofertado por este lote todavía.</p>
            ) : (
              <div className="space-y-3">
                {ofertasRecibidas.map((of) => (
                  <div key={of.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <p className="text-xs text-slate-400">Comprador: <span className="text-slate-200 font-medium">{of.comprador_email}</span></p>
                      <p className="text-lg font-bold text-emerald-400">${of.monto_ofertado.toLocaleString()} USD</p>
                      <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Estado: {of.estatus}</p>
                    </div>
                    {of.estatus === "pendiente" && (
                      <div className="flex gap-2">
                        <button onClick={() => resolverOferta(of.id, "rechazar")} className="bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-800/60 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors">
                          Rechazar
                        </button>
                        <button onClick={() => resolverOferta(of.id, "aceptar")} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors">
                          Aceptar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
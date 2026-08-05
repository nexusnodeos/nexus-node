"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Fraunces } from "next/font/google";
import { supabase } from "@/lib/supabase";
import LotUploadForm from "@/components/LotUploadForm";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const displayFont = { fontFamily: "var(--font-display)" } as const;

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

type EstadoSesion = "cargando" | "sin_sesion" | "necesita_vendedor" | "vendedor";

export default function MineroPage() {
  const [estadoSesion, setEstadoSesion] = useState<EstadoSesion>("cargando");
  const [email, setEmail] = useState<string | null>(null);

  // Registro rápido para activar la capacidad de vender sobre la cuenta existente
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [rfc, setRfc] = useState("");
  const [activandoVendedor, setActivandoVendedor] = useState(false);
  const [errorVendedor, setErrorVendedor] = useState<string | null>(null);

  // Estados de Lotes y Ofertas
  const [misLotes, setMisLotes] = useState<Lote[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [ofertasRecibidas, setOfertasRecibidas] = useState<Oferta[]>([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(false);

  async function evaluarSesion() {
    const { data } = await supabase.auth.getSession();
    const usuario = data.session?.user ?? null;

    if (!usuario) {
      setEstadoSesion("sin_sesion");
      return;
    }

    setEmail(usuario.email ?? null);

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("puede_vender")
      .eq("id", usuario.id)
      .maybeSingle();

    if (perfil?.puede_vender) {
      setEstadoSesion("vendedor");
      obtenerMisLotes();
    } else {
      setEstadoSesion("necesita_vendedor");
    }
  }

  useEffect(() => {
    evaluarSesion();
  }, []);

  const activarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorVendedor(null);
    if (!nombreEmpresa.trim()) return setErrorVendedor("Escribe el nombre de tu empresa.");

    setActivandoVendedor(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("No hay sesión activa.");

      const { error } = await supabase
        .from("perfiles")
        .update({
          puede_vender: true,
          nombre_empresa: nombreEmpresa.trim(),
          rfc: rfc.trim() || null,
        })
        .eq("id", data.user.id);

      if (error) throw error;

      setEstadoSesion("vendedor");
      obtenerMisLotes();
    } catch (err: any) {
      setErrorVendedor(err.message || "No se pudo activar la cuenta de vendedor.");
    } finally {
      setActivandoVendedor(false);
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setEstadoSesion("sin_sesion");
    setEmail(null);
    setMisLotes([]);
  };

  // 2. Traer los lotes creados
  const obtenerMisLotes = async () => {
    const { data, error } = await supabase
      .from("lotes")
      .select("*")
      .order("creado_en", { ascending: false });

    if (!error && data) setMisLotes(data);
  };

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
        await supabase.from("ofertas").update({ estatus: "aceptada" }).eq("id", ofertaId);
        await supabase.from("ofertas").update({ estatus: "rechazada" }).eq("lote_id", loteSeleccionado.id).neq("id", ofertaId);
        await supabase.from("lotes").update({ estatus: "vendido" }).eq("id", loteSeleccionado.id);

        alert("¡Felicidades! Oferta aceptada y lote vendido.");
      } else {
        await supabase.from("ofertas").update({ estatus: "rechazada" }).eq("id", ofertaId);
        alert("Oferta rechazada.");
      }

      obtenerMisLotes();
      setLoteSeleccionado(null);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al procesar la acción.");
    }
  };

  if (estadoSesion === "cargando") {
    return <div className="min-h-screen bg-white" />;
  }

  if (estadoSesion === "sin_sesion") {
    return (
      <div className={`${display.variable} min-h-screen bg-white flex items-center justify-center p-6 text-center`}>
        <div className="w-full max-w-sm bg-[#FBF6F0] border border-[#E9DFD2] rounded-2xl p-8">
          <h1 className="text-xl font-medium text-[#241A14] mb-2" style={displayFont}>
            Necesitas una cuenta para publicar
          </h1>
          <p className="text-sm text-[#75604F] mb-6">
            Con la misma cuenta puedes comprar y vender — solo activa la parte de vendedor cuando quieras publicar tu primer lote.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link href="/registro?redirect=/minero" className="bg-[#B15A2A] hover:bg-[#8C4620] text-white text-sm font-medium py-3 rounded-full transition-colors">
              Crear cuenta
            </Link>
            <Link href="/login?redirect=/minero" className="bg-[#F3ECE2] hover:bg-[#EADFCF] text-[#241A14] text-sm font-medium py-3 rounded-full transition-colors">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (estadoSesion === "necesita_vendedor") {
    return (
      <div className={`${display.variable} min-h-screen bg-white flex items-center justify-center p-6`}>
        <div className="w-full max-w-sm bg-[#FBF6F0] border border-[#E9DFD2] rounded-2xl p-8">
          <h1 className="text-xl font-medium text-[#241A14] mb-1" style={displayFont}>Conviértete en vendedor</h1>
          <p className="text-sm text-[#75604F] mb-6">
            Conectado como <span className="text-[#241A14] font-medium">{email}</span>. Completa esto para poder publicar lotes.
          </p>
          <form onSubmit={activarVendedor} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#75604F] uppercase mb-1">Nombre de tu empresa</label>
              <input
                type="text"
                required
                value={nombreEmpresa}
                onChange={(e) => setNombreEmpresa(e.target.value)}
                className="w-full bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] focus:outline-none focus:border-[#B15A2A]"
                placeholder="Ej. Minera del Pacífico S.A. de C.V."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#75604F] uppercase mb-1">RFC (opcional)</label>
              <input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                className="w-full bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] focus:outline-none focus:border-[#B15A2A]"
              />
            </div>
            {errorVendedor && <p className="text-xs text-rose-600">{errorVendedor}</p>}
            <button
              type="submit"
              disabled={activandoVendedor}
              className="w-full bg-[#B15A2A] hover:bg-[#8C4620] text-white font-medium text-sm py-3 rounded-full transition-colors disabled:opacity-50"
            >
              {activandoVendedor ? "Activando..." : "Activar cuenta de vendedor"}
            </button>
          </form>
          <button onClick={cerrarSesion} className="text-xs text-[#8A7561] hover:text-[#75604F] mt-5 block mx-auto">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${display.variable} min-h-screen bg-white text-[#241A14] p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8`}>
      {/* COLUMNA IZQUIERDA: FORMULARIO */}
      <div className="bg-[#FBF6F0] border border-[#E9DFD2] rounded-2xl p-7 h-fit">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-2xl font-medium text-[#B15A2A]" style={displayFont}>
            Portal del Minero — Registrar Mineral
          </h1>
        </div>
        <p className="text-xs text-emerald-600 font-semibold mb-6">✓ Conectado como {email} · <button onClick={cerrarSesion} className="text-[#8A7561] hover:text-rose-600 font-normal underline">Cerrar sesión</button></p>

        <LotUploadForm onSuccess={obtenerMisLotes} />
      </div>

      {/* COLUMNA DERECHA: HISTORIAL Y OFERTAS */}
      <div className="space-y-6">
        <div className="bg-[#FBF6F0] border border-[#E9DFD2] rounded-2xl p-7">
          <h2 className="text-xl font-medium text-[#241A14] mb-4" style={displayFont}>
            Mis Lotes en Mercado
          </h2>

          {misLotes.length === 0 ? (
            <p className="text-[#8A7561] text-sm">No has registrado ningún lote todavía.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {misLotes.map((lote) => (
                <div key={lote.id} className="bg-white border border-[#E9DFD2] rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-[#241A14]">{lote.toneladas} Tons - {lote.puerto_origen}</p>
                    <p className="text-xs text-[#8A7561]">Pureza: {lote.pureza_porcentaje}% | Status: <span className={lote.estatus === "vendido" ? "text-emerald-600 font-bold" : "text-[#B15A2A]"}>{lote.estatus}</span></p>
                  </div>
                  {lote.estatus === "publicado" && (
                    <button onClick={() => verOfertasDelLote(lote)} className="bg-[#F3ECE2] hover:bg-[#EADFCF] text-xs text-[#B15A2A] font-medium py-1.5 px-4 rounded-full border border-[#E9DFD2]">
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
          <div className="bg-[#FBF6F0] border border-[#B15A2A]/30 rounded-2xl p-7">
            <h3 className="text-lg font-medium text-[#B15A2A] mb-1" style={displayFont}>
              Ofertas para el Lote seleccionado
            </h3>
            <p className="text-xs text-[#75604F] mb-4">Lote ID: {loteSeleccionado.id.slice(0, 8)}... ({loteSeleccionado.toneladas} Tons)</p>

            {cargandoOfertas ? (
              <p className="text-sm text-[#75604F]">Buscando en la base de datos...</p>
            ) : ofertasRecibidas.length === 0 ? (
              <p className="text-sm text-[#8A7561]">Ningún comprador ha ofertado por este lote todavía.</p>
            ) : (
              <div className="space-y-3">
                {ofertasRecibidas.map((of) => (
                  <div key={of.id} className="bg-white border border-[#E9DFD2] rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <p className="text-xs text-[#75604F]">Comprador: <span className="text-[#241A14] font-medium">{of.comprador_email}</span></p>
                      <p className="text-lg font-medium text-emerald-600" style={displayFont}>${of.monto_ofertado.toLocaleString()} USD</p>
                      <p className="text-xs uppercase tracking-wider font-semibold text-[#8A7561] mt-0.5">Estado: {of.estatus}</p>
                    </div>
                    {of.estatus === "pendiente" && (
                      <div className="flex gap-2">
                        <button onClick={() => resolverOferta(of.id, "rechazar")} className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold py-1.5 px-4 rounded-full transition-colors">
                          Rechazar
                        </button>
                        <button onClick={() => resolverOferta(of.id, "aceptar")} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-1.5 px-4 rounded-full transition-colors">
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

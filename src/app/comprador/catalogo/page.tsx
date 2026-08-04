'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Lote {
  id: string;
  mineral: string;
  toneladas: number;
  pureza_porcentaje: number;
  puerto_origen: string;
  pais: string | null;
  laboratorio: string | null;
  antifraud_score: number | null;
  precio_usd: number;
  precio_publicado_usd: number | null;
  tiene_exclusividad: boolean;
  creado_en: string;
}

interface MiOferta {
  id: string;
  monto_ofertado: number;
  estatus: string;
  creado_en: string;
  lotes: { toneladas: number; puerto_origen: string; mineral: string } | null;
}

interface Criterios {
  mineral_preferido: string;
  volumen_minimo_toneladas: string;
  pureza_minima_porcentaje: string;
  presupuesto_maximo_usd: string;
}

// Cuenta de prueba para simular al comprador (Rodrigo) durante el piloto.
// El rol="comprador" en los metadatos hace que el trigger on_auth_user_created
// de Supabase cree automáticamente el perfil correcto (ver migración de hoy).
const EMAIL_PRUEBA_COMPRADOR = 'comprador.demo@nexus.com';
const PASSWORD_PRUEBA_COMPRADOR = 'NexusComprador123!';

const CRITERIOS_VACIOS: Criterios = {
  mineral_preferido: 'Cobre (Concentrado)',
  volumen_minimo_toneladas: '',
  pureza_minima_porcentaje: '95',
  presupuesto_maximo_usd: '',
};

export default function BuyerCatalogPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [misOfertas, setMisOfertas] = useState<MiOferta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMineral, setSelectedMineral] = useState('ALL');
  const [selectedLot, setSelectedLot] = useState<Lote | null>(null);
  const [modalStep, setModalStep] = useState<'REQUIREMENTS' | 'SUCCESS'>('REQUIREMENTS');
  const [hasSignedNCNDA, setHasSignedNCNDA] = useState(false);
  const [hasUploadedPOF, setHasUploadedPOF] = useState(false);
  const [ofertaDinero, setOfertaDinero] = useState('');
  const [enviandoOferta, setEnviandoOferta] = useState(false);

  // --- Autenticación real de comprador ---
  const [autenticado, setAutenticado] = useState(false);
  const [autenticando, setAutenticando] = useState(false);
  const [emailComprador, setEmailComprador] = useState<string | null>(null);
  const [compradorId, setCompradorId] = useState<string | null>(null);

  // --- Criterios de compra (alimentan al Matchmaker) ---
  const [criterios, setCriterios] = useState<Criterios>(CRITERIOS_VACIOS);
  const [criteriosGuardados, setCriteriosGuardados] = useState(false);
  const [guardandoCriterios, setGuardandoCriterios] = useState(false);

  async function cargarDatos(emailActivo?: string | null) {
    setCargando(true);
    try {
      const { data: dataLotes, error: errorLotes } = await supabase
        .from('lotes')
        .select(
          'id, mineral, toneladas, pureza_porcentaje, puerto_origen, pais, laboratorio, antifraud_score, precio_usd, precio_publicado_usd, tiene_exclusividad, creado_en'
        )
        .eq('estatus', 'publicado')
        .order('creado_en', { ascending: false });

      if (errorLotes) throw errorLotes;
      setLotes(dataLotes || []);

      if (emailActivo) {
        const { data: dataOfertas, error: errorOfertas } = await supabase
          .from('ofertas')
          .select(`id, monto_ofertado, estatus, creado_en, lotes ( toneladas, puerto_origen, mineral )`)
          .eq('comprador_email', emailActivo)
          .order('creado_en', { ascending: false });

        if (errorOfertas) throw errorOfertas;
        setMisOfertas((dataOfertas as any) || []);
      } else {
        setMisOfertas([]);
      }
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    } finally {
      setCargando(false);
    }
  }

  async function cargarCriterios(idComprador: string) {
    const { data, error } = await supabase
      .from('criterios_comprador')
      .select('*')
      .eq('comprador_id', idComprador)
      .eq('activo', true)
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setCriterios({
        mineral_preferido: data.mineral_preferido,
        volumen_minimo_toneladas: String(data.volumen_minimo_toneladas),
        pureza_minima_porcentaje: String(data.pureza_minima_porcentaje),
        presupuesto_maximo_usd: String(data.presupuesto_maximo_usd),
      });
      setCriteriosGuardados(true);
    }
  }

  // Si ya hay una sesion activa en el navegador (Supabase la persiste), hay
  // que confirmar que sea realmente una cuenta de COMPRADOR antes de
  // adoptarla -- si el navegador tenia una sesion de minero abierta (por
  // ejemplo por haber probado /minero antes), nunca debe tratarse como si
  // fuera el comprador.
  async function esSesionDeComprador(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', userId)
      .maybeSingle();
    return !error && data?.rol === 'comprador';
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const usuario = data.session?.user ?? null;

      if (usuario && (await esSesionDeComprador(usuario.id))) {
        setAutenticado(true);
        setEmailComprador(usuario.email ?? null);
        setCompradorId(usuario.id);
        cargarCriterios(usuario.id);
        cargarDatos(usuario.email ?? null);
      } else {
        cargarDatos(null);
      }
    })();
  }, []);

  const manejarAutenticacionComprador = async () => {
    setAutenticando(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: EMAIL_PRUEBA_COMPRADOR,
        password: PASSWORD_PRUEBA_COMPRADOR,
      });

      let usuario = signInData?.user ?? null;

      if (signInError) {
        // No existe todavía: lo registramos con rol="comprador" en los metadatos.
        // El trigger on_auth_user_created crea el perfil correcto automáticamente.
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: EMAIL_PRUEBA_COMPRADOR,
          password: PASSWORD_PRUEBA_COMPRADOR,
          options: {
            data: { rol: 'comprador', nombre_empresa: 'Comprador Piloto (Rodrigo)' },
          },
        });

        if (signUpError) {
          alert('Error de autenticación de comprador: ' + signUpError.message);
          return;
        }
        usuario = signUpData.user;
      }

      if (!usuario) {
        alert('No se pudo autenticar al comprador de prueba.');
        return;
      }

      setAutenticado(true);
      setEmailComprador(usuario.email ?? EMAIL_PRUEBA_COMPRADOR);
      setCompradorId(usuario.id);
      await cargarCriterios(usuario.id);
      await cargarDatos(usuario.email ?? EMAIL_PRUEBA_COMPRADOR);
    } finally {
      setAutenticando(false);
    }
  };

  const guardarCriterios = async () => {
    if (!compradorId) return;
    if (!criterios.presupuesto_maximo_usd) {
      alert('Indica tu presupuesto máximo — el Matchmaker lo necesita para poder calificarte contra nuevos lotes.');
      return;
    }
    setGuardandoCriterios(true);
    try {
      // Desactiva el criterio anterior (si existía) antes de guardar el nuevo,
      // para que el Matchmaker siempre use solo tu criterio más reciente.
      await supabase
        .from('criterios_comprador')
        .update({ activo: false })
        .eq('comprador_id', compradorId)
        .eq('activo', true);

      const { error } = await supabase.from('criterios_comprador').insert([
        {
          comprador_id: compradorId,
          mineral_preferido: criterios.mineral_preferido,
          volumen_minimo_toneladas: Number(criterios.volumen_minimo_toneladas || 0),
          pureza_minima_porcentaje: Number(criterios.pureza_minima_porcentaje || 90),
          presupuesto_maximo_usd: Number(criterios.presupuesto_maximo_usd),
          activo: true,
        },
      ]);

      if (error) throw error;
      setCriteriosGuardados(true);
      alert('Tus criterios de compra quedaron guardados. El Matchmaker ya puede calificarte contra nuevos lotes.');
    } catch (error: any) {
      alert('No se pudieron guardar tus criterios: ' + error.message);
    } finally {
      setGuardandoCriterios(false);
    }
  };

  const filteredLots = lotes.filter((lote) => {
    const codigo = lote.id.slice(0, 8).toUpperCase();
    const matchesSearch =
      codigo.includes(searchTerm.toUpperCase()) ||
      lote.mineral.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMineral = selectedMineral === 'ALL' || lote.mineral.includes(selectedMineral);
    return matchesSearch && matchesMineral;
  });

  const handleOpenReserveModal = (lote: Lote) => {
    if (!autenticado || !emailComprador) {
      alert('Primero autentícate como comprador (panel derecho) para poder reservar un lote.');
      return;
    }
    setSelectedLot(lote);
    setModalStep('REQUIREMENTS');
    setHasSignedNCNDA(false);
    setHasUploadedPOF(false);
    setOfertaDinero(String(lote.precio_publicado_usd ?? lote.precio_usd));
  };

  const confirmarReserva = async () => {
    if (!selectedLot || !ofertaDinero) return;
    if (!autenticado || !emailComprador) {
      alert('Primero autentícate como comprador para poder reservar un lote.');
      return;
    }
    setEnviandoOferta(true);
    try {
      const { error } = await supabase.from('ofertas').insert([
        {
          lote_id: selectedLot.id,
          comprador_email: emailComprador,
          monto_ofertado: Number(ofertaDinero),
          estatus: 'pendiente',
        },
      ]);
      if (error) throw error;
      setModalStep('SUCCESS');
      cargarDatos(emailComprador);
    } catch (error: any) {
      alert('No se pudo confirmar la reserva: ' + error.message);
    } finally {
      setEnviandoOferta(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-ink p-6 md:p-10 font-sans grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink flex items-center gap-3">
              <span className="text-cyan-brand">Nexus</span> Catálogo de Lotes Verificados
            </h1>
            <p className="text-xs md:text-sm text-ink-soft mt-1">
              Lotes auditados con forensia digital, validación minera y ensayo de laboratorio.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-panel px-3 py-1.5 rounded-lg border border-line text-xs">
            <span className={`w-2 h-2 rounded-full ${autenticado ? 'bg-emerald-500 animate-pulse' : 'bg-line'}`}></span>
            <span className="text-ink font-mono">
              {autenticado ? `Comprador: ${emailComprador}` : 'Modo Comprador — sin autenticar'}
            </span>
          </div>
        </div>

        <div className="bg-slate-panel p-4 rounded-xl border border-line mb-8 flex flex-col md:flex-row gap-4 justify-between">
          <input
            type="text"
            placeholder="Buscar por código de lote o mineral..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-line text-ink text-xs rounded-lg px-4 py-2.5 w-full md:w-80 focus:outline-none focus:border-cyan-brand"
          />
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['ALL', 'Cobre', 'Oro', 'Litio'].map((mineral) => (
              <button
                key={mineral}
                onClick={() => setSelectedMineral(mineral)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  selectedMineral === mineral
                    ? 'bg-cyan-brand text-white'
                    : 'bg-white text-ink-soft hover:border-line border border-line'
                }`}
              >
                {mineral === 'ALL' ? 'Todos' : mineral}
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-ink-soft text-sm">Cargando catálogo...</div>
        ) : filteredLots.length === 0 ? (
          <div className="text-center py-12 bg-slate-panel rounded-xl border border-line text-ink-soft text-sm">
            No hay lotes verificados disponibles en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLots.map((lote) => (
              <div key={lote.id} className="bg-slate-panel border border-line hover:border-line rounded-xl p-5 flex flex-col justify-between transition-all">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono bg-cyan-brand/10 text-cyan-brand border border-cyan-brand/30 px-2 py-0.5 rounded">
                      LOT-{lote.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      {lote.antifraud_score != null ? `✓ Score ${lote.antifraud_score}/100` : 'Score pendiente (Agente SDR)'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-ink mb-1">{lote.mineral}</h3>
                  <p className="text-xs text-ink-soft mb-4">{lote.puerto_origen}{lote.pais ? `, ${lote.pais}` : ''}</p>
                  <div className="bg-white rounded-lg p-3 border border-line space-y-2 mb-4 text-xs font-mono">
                    <div className="flex justify-between text-ink">
                      <span className="text-ink-soft">Ley / Pureza:</span>
                      <span className="text-emerald-600 font-bold">{lote.pureza_porcentaje}%</span>
                    </div>
                    <div className="flex justify-between text-ink">
                      <span className="text-ink-soft">Volumen:</span>
                      <span>{Number(lote.toneladas).toLocaleString()} Ton</span>
                    </div>
                    <div className="flex justify-between text-ink">
                      <span className="text-ink-soft">Laboratorio:</span>
                      <span>{lote.laboratorio || 'Pendiente de verificación'}</span>
                    </div>
                    {lote.tiene_exclusividad && (
                      <div className="flex justify-between text-amber-600">
                        <span>🔒 Exclusividad 72h activa</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-line flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-ink-soft block">Precio publicado</span>
                    <span className="text-sm font-bold text-ink">
                      ${Number(lote.precio_publicado_usd ?? lote.precio_usd).toLocaleString()} USD
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenReserveModal(lote)}
                    className="bg-cyan-brand hover:bg-gold-brand text-white text-xs px-4 py-2 rounded-lg font-semibold transition shadow-lg shadow-cyan-brand/20"
                  >
                    Reservar Lote
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SIDEBAR DERECHO: PERFIL DE COMPRADOR + MIS OFERTAS */}
      <div className="space-y-6">
        {/* PERFIL DE COMPRADOR / AUTENTICACIÓN */}
        <div className="bg-slate-panel border border-line rounded-xl p-6 h-fit">
          <h2 className="text-lg font-bold text-ink mb-3">Tu Perfil de Comprador</h2>

          {!autenticado ? (
            <>
              <p className="text-xs text-ink-soft mb-3">
                Autentícate como comprador para reservar lotes y para que el Agente Matchmaker
                pueda calificarte automáticamente contra nuevos lotes que se publiquen.
              </p>
              <button
                onClick={manejarAutenticacionComprador}
                disabled={autenticando}
                className="w-full py-2.5 px-4 rounded-lg font-semibold border bg-slate-panel border-line hover:bg-line text-ink text-xs transition-colors"
              >
                {autenticando ? 'Conectando...' : '⚡ Autenticar como Comprador de Prueba'}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-emerald-600 font-semibold mb-4">✓ Conectado como {emailComprador}</p>
              <h3 className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-2">
                Criterios de Compra (alimentan al Matchmaker)
              </h3>
              <div className="space-y-2 mb-3">
                <select
                  value={criterios.mineral_preferido}
                  onChange={(e) => setCriterios({ ...criterios, mineral_preferido: e.target.value })}
                  className="w-full bg-white border border-line text-ink text-xs rounded-lg px-3 py-2"
                >
                  <option value="Cobre (Concentrado)">Cobre (Concentrado)</option>
                  <option value="Oro">Oro</option>
                  <option value="Litio">Litio</option>
                </select>
                <input
                  type="number"
                  placeholder="Volumen mínimo (Ton)"
                  value={criterios.volumen_minimo_toneladas}
                  onChange={(e) => setCriterios({ ...criterios, volumen_minimo_toneladas: e.target.value })}
                  className="w-full bg-white border border-line text-ink text-xs rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Pureza mínima (%)"
                  value={criterios.pureza_minima_porcentaje}
                  onChange={(e) => setCriterios({ ...criterios, pureza_minima_porcentaje: e.target.value })}
                  className="w-full bg-white border border-line text-ink text-xs rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Presupuesto máximo (USD)"
                  value={criterios.presupuesto_maximo_usd}
                  onChange={(e) => setCriterios({ ...criterios, presupuesto_maximo_usd: e.target.value })}
                  className="w-full bg-white border border-line text-ink text-xs rounded-lg px-3 py-2"
                />
              </div>
              <button
                onClick={guardarCriterios}
                disabled={guardandoCriterios}
                className="w-full py-2 rounded-lg text-xs font-bold bg-cyan-brand hover:bg-gold-brand text-white transition"
              >
                {guardandoCriterios ? 'Guardando...' : criteriosGuardados ? 'Actualizar Criterios' : 'Guardar Criterios'}
              </button>
            </>
          )}
        </div>

        {/* MIS OFERTAS ENVIADAS */}
        <div className="bg-slate-panel border border-line rounded-xl p-6 h-fit">
          <h2 className="text-xl font-bold text-ink mb-4">Mis Ofertas Enviadas</h2>
          {!autenticado ? (
            <p className="text-sm text-ink-soft">Autentícate para ver tus ofertas.</p>
          ) : cargando ? (
            <p className="text-sm text-ink-soft">Cargando tus ofertas...</p>
          ) : misOfertas.length === 0 ? (
            <p className="text-sm text-ink-soft">Aún no has enviado ofertas de compra.</p>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {misOfertas.map((of) => (
                <div key={of.id} className="bg-white border border-line rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${
                      of.estatus === 'aceptada' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      of.estatus === 'rechazada' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                      'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {of.estatus === 'aceptada' ? '✓ Ganada' : of.estatus === 'rechazada' ? '✗ Rechazada' : '⏳ Pendiente'}
                    </span>
                    <span className="text-[10px] text-ink-soft">{new Date(of.creado_en).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium text-ink">
                    {of.lotes?.mineral || 'N/A'} — {of.lotes?.toneladas || 0} Tons en {of.lotes?.puerto_origen || 'N/A'}
                  </p>
                  <p className="text-md font-bold text-emerald-600 mt-1">${Number(of.monto_ofertado).toLocaleString()} USD</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE RESERVA */}
      {selectedLot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-panel border border-line rounded-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setSelectedLot(null)}
              className="absolute top-4 right-4 text-ink-soft hover:text-ink text-sm font-mono"
            >
              ✕
            </button>
            {modalStep === 'REQUIREMENTS' && (
              <div>
                <div className="mb-4">
                  <span className="text-[10px] font-mono text-cyan-brand uppercase tracking-widest">Protocolo de Acceso</span>
                  <h2 className="text-lg font-bold text-ink mt-1">Requisitos para Reservar LOT-{selectedLot.id.slice(0, 8).toUpperCase()}</h2>
                  <p className="text-xs text-ink-soft mt-1">
                    Para proteger la confidencialidad de la mina y liberar la Ficha Técnica Cegada, completa las siguientes validaciones:
                  </p>
                </div>
                <div className="space-y-3 mb-4">
                  <div className={`p-3 rounded-lg border flex justify-between items-center ${hasSignedNCNDA ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-line'}`}>
                    <div>
                      <h4 className="text-xs font-bold text-ink">1. Acuerdo NCNDA Digital</h4>
                      <p className="text-[11px] text-ink-soft">Protección de no circunvención comercial.</p>
                    </div>
                    {hasSignedNCNDA ? (
                      <span className="text-xs text-emerald-600 font-bold">✓ Firmado</span>
                    ) : (
                      <button onClick={() => setHasSignedNCNDA(true)} className="text-xs bg-slate-panel hover:bg-line text-cyan-brand border border-line px-3 py-1 rounded">
                        Firmar
                      </button>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg border flex justify-between items-center ${hasUploadedPOF ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-line'}`}>
                    <div>
                      <h4 className="text-xs font-bold text-ink">2. Prueba de Fondos (POF)</h4>
                      <p className="text-[11px] text-ink-soft">Acreditación de liquidez bancaria para compra.</p>
                    </div>
                    {hasUploadedPOF ? (
                      <span className="text-xs text-emerald-600 font-bold">✓ Cargado</span>
                    ) : (
                      <button onClick={() => setHasUploadedPOF(true)} className="text-xs bg-slate-panel hover:bg-line text-cyan-brand border border-line px-3 py-1 rounded">
                        Adjuntar
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-ink-soft mb-3">
                  Nota piloto: firma y adjunto todavía son un gate de UI (Tareas 2.1/2.2 — firma digital real —
                  aún no construidas). La oferta que se registra al confirmar sí es real en Supabase, ligada a tu
                  cuenta autenticada de comprador.
                </p>
                <button
                  disabled={!hasSignedNCNDA || !hasUploadedPOF || enviandoOferta}
                  onClick={confirmarReserva}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition ${
                    hasSignedNCNDA && hasUploadedPOF
                      ? 'bg-cyan-brand hover:bg-gold-brand text-white cursor-pointer'
                      : 'bg-slate-panel text-ink-soft cursor-not-allowed'
                  }`}
                >
                  {enviandoOferta ? 'Confirmando...' : hasSignedNCNDA && hasUploadedPOF ? 'Confirmar Reserva de 72 Horas' : 'Completa los requisitos para continuar'}
                </button>
              </div>
            )}
            {modalStep === 'SUCCESS' && (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">✓</div>
                <h2 className="text-base font-bold text-ink mb-2">¡Oferta Registrada!</h2>
                <p className="text-xs text-ink-soft mb-6 leading-relaxed">
                  Tu oferta por el lote <strong className="text-ink">LOT-{selectedLot.id.slice(0, 8).toUpperCase()}</strong> quedó
                  registrada en Supabase. El minero la verá en su panel para aceptar o rechazar.
                </p>
                <button onClick={() => setSelectedLot(null)} className="bg-slate-panel hover:bg-line text-xs text-ink font-semibold px-6 py-2 rounded-lg border border-line">
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

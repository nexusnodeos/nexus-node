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

// NOTA: todavía no hay autenticación real de comprador (Tarea 1.04 / 1.6 pendiente).
// Se usa un email de prueba fijo, igual que ya hacía /comprador antes de unificarse aquí.
const EMAIL_COMPRADOR_PRUEBA = 'comprador.test@nexus.com';

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

  async function cargarDatos() {
    setCargando(true);
    try {
      const { data: dataLotes, error: errorLotes } = await supabase
        .from('lotes')
        .select('id, mineral, toneladas, pureza_porcentaje, puerto_origen, pais, laboratorio, antifraud_score, precio_usd, precio_publicado_usd, tiene_exclusividad, creado_en')
        .eq('estatus', 'publicado')
        .order('creado_en', { ascending: false });
      if (errorLotes) throw errorLotes;
      setLotes(dataLotes || []);

      const { data: dataOfertas, error: errorOfertas } = await supabase
        .from('ofertas')
        .select(`id, monto_ofertado, estatus, creado_en, lotes ( toneladas, puerto_origen, mineral )`)
        .eq('comprador_email', EMAIL_COMPRADOR_PRUEBA)
        .order('creado_en', { ascending: false });
      if (errorOfertas) throw errorOfertas;
      setMisOfertas((dataOfertas as any) || []);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const filteredLots = lotes.filter((lote) => {
    const codigo = lote.id.slice(0, 8).toUpperCase();
    const matchesSearch =
      codigo.includes(searchTerm.toUpperCase()) ||
      lote.mineral.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMineral = selectedMineral === 'ALL' || lote.mineral.includes(selectedMineral);
    return matchesSearch && matchesMineral;
  });

  const handleOpenReserveModal = (lote: Lote) => {
    setSelectedLot(lote);
    setModalStep('REQUIREMENTS');
    setHasSignedNCNDA(false);
    setHasUploadedPOF(false);
    setOfertaDinero(String(lote.precio_publicado_usd ?? lote.precio_usd));
  };

  const confirmarReserva = async () => {
    if (!selectedLot || !ofertaDinero) return;
    setEnviandoOferta(true);
    try {
      const { error } = await supabase.from('ofertas').insert([
        {
          lote_id: selectedLot.id,
          comprador_email: EMAIL_COMPRADOR_PRUEBA,
          monto_ofertado: Number(ofertaDinero),
          estatus: 'pendiente',
        },
      ]);
      if (error) throw error;
      setModalStep('SUCCESS');
      cargarDatos();
    } catch (error: any) {
      alert('No se pudo confirmar la reserva: ' + error.message);
    } finally {
      setEnviandoOferta(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 p-6 md:p-10 font-sans grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <span className="text-blue-500">Nexus</span> Catálogo de Lotes Verificados
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Lotes auditados con forensia digital, validación minera y ensayo de laboratorio.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#131926] px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono">Modo Comprador Acreditado</span>
          </div>
        </div>

        <div className="bg-[#131926] p-4 rounded-xl border border-slate-800 mb-8 flex flex-col md:flex-row gap-4 justify-between">
          <input
            type="text"
            placeholder="Buscar por código de lote o mineral..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#0B0F17] border border-slate-700 text-slate-200 text-xs rounded-lg px-4 py-2.5 w-full md:w-80 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['ALL', 'Cobre', 'Oro', 'Litio'].map((mineral) => (
              <button
                key={mineral}
                onClick={() => setSelectedMineral(mineral)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  selectedMineral === mineral
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0B0F17] text-slate-400 hover:border-slate-600 border border-slate-800'
                }`}
              >
                {mineral === 'ALL' ? 'Todos' : mineral}
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-slate-400 text-sm">Cargando catálogo...</div>
        ) : filteredLots.length === 0 ? (
          <div className="text-center py-12 bg-[#131926] rounded-xl border border-slate-800 text-slate-400 text-sm">
            No hay lotes verificados disponibles en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLots.map((lote) => (
              <div key={lote.id} className="bg-[#131926] border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono bg-blue-950/80 text-blue-400 border border-blue-800/50 px-2 py-0.5 rounded">
                      LOT-{lote.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded flex items-center gap-1">
                      {lote.antifraud_score != null ? `✓ Score ${lote.antifraud_score}/100` : 'Score pendiente (Agente SDR)'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{lote.mineral}</h3>
                  <p className="text-xs text-slate-400 mb-4">{lote.puerto_origen}{lote.pais ? `, ${lote.pais}` : ''}</p>
                  <div className="bg-[#0B0F17] rounded-lg p-3 border border-slate-800/80 space-y-2 mb-4 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Ley / Pureza:</span>
                      <span className="text-emerald-400 font-bold">{lote.pureza_porcentaje}%</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Volumen:</span>
                      <span>{Number(lote.toneladas).toLocaleString()} Ton</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Laboratorio:</span>
                      <span>{lote.laboratorio || 'Pendiente de verificación'}</span>
                    </div>
                    {lote.tiene_exclusividad && (
                      <div className="flex justify-between text-amber-400">
                        <span>🔒 Exclusividad 72h activa</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Precio publicado</span>
                    <span className="text-sm font-bold text-slate-200">
                      ${Number(lote.precio_publicado_usd ?? lote.precio_usd).toLocaleString()} USD
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenReserveModal(lote)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-semibold transition shadow-lg shadow-blue-600/20"
                  >
                    Reservar Lote
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SIDEBAR: MIS OFERTAS ENVIADAS */}
      <div className="bg-[#131926] border border-slate-800 rounded-xl p-6 h-fit">
        <h2 className="text-xl font-bold text-slate-200 mb-4">Mis Ofertas Enviadas</h2>
        {cargando ? (
          <p className="text-sm text-slate-500">Cargando tus ofertas...</p>
        ) : misOfertas.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no has enviado ofertas de compra.</p>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {misOfertas.map((of) => (
              <div key={of.id} className="bg-[#0B0F17] border border-slate-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${
                    of.estatus === 'aceptada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    of.estatus === 'rechazada' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {of.estatus === 'aceptada' ? '✓ Ganada' : of.estatus === 'rechazada' ? '✗ Rechazada' : '⏳ Pendiente'}
                  </span>
                  <span className="text-[10px] text-slate-500">{new Date(of.creado_en).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-slate-300">
                  {of.lotes?.mineral || 'N/A'} — {of.lotes?.toneladas || 0} Tons en {of.lotes?.puerto_origen || 'N/A'}
                </p>
                <p className="text-md font-bold text-emerald-400 mt-1">${Number(of.monto_ofertado).toLocaleString()} USD</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE RESERVA */}
      {selectedLot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#131926] border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setSelectedLot(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-sm font-mono"
            >
              ✕
            </button>

            {modalStep === 'REQUIREMENTS' && (
              <div>
                <div className="mb-4">
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Protocolo de Acceso</span>
                  <h2 className="text-lg font-bold text-white mt-1">Requisitos para Reservar LOT-{selectedLot.id.slice(0, 8).toUpperCase()}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Para proteger la confidencialidad de la mina y liberar la Ficha Técnica Cegada, completa las siguientes validaciones:
                  </p>
                </div>
                <div className="space-y-3 mb-4">
                  <div className={`p-3 rounded-lg border flex justify-between items-center ${hasSignedNCNDA ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-[#0B0F17] border-slate-800'}`}>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">1. Acuerdo NCNDA Digital</h4>
                      <p className="text-[11px] text-slate-400">Protección de no circunvención comercial.</p>
                    </div>
                    {hasSignedNCNDA ? (
                      <span className="text-xs text-emerald-400 font-bold">✓ Firmado</span>
                    ) : (
                      <button onClick={() => setHasSignedNCNDA(true)} className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 px-3 py-1 rounded">
                        Firmar
                      </button>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg border flex justify-between items-center ${hasUploadedPOF ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-[#0B0F17] border-slate-800'}`}>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">2. Prueba de Fondos (POF)</h4>
                      <p className="text-[11px] text-slate-400">Acreditación de liquidez bancaria para compra.</p>
                    </div>
                    {hasUploadedPOF ? (
                      <span className="text-xs text-emerald-400 font-bold">✓ Cargado</span>
                    ) : (
                      <button onClick={() => setHasUploadedPOF(true)} className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 px-3 py-1 rounded">
                        Adjuntar
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mb-3">
                  Nota piloto: firma y adjunto todavía son un gate de UI (Tareas 2.1/2.2 — firma digital real —
                  aún no construidas). La oferta que se registra al confirmar sí es real en Supabase.
                </p>
                <button
                  disabled={!hasSignedNCNDA || !hasUploadedPOF || enviandoOferta}
                  onClick={confirmarReserva}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition ${
                    hasSignedNCNDA && hasUploadedPOF
                      ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {enviandoOferta ? 'Confirmando...' : hasSignedNCNDA && hasUploadedPOF ? 'Confirmar Reserva de 72 Horas' : 'Completa los requisitos para continuar'}
                </button>
              </div>
            )}

            {modalStep === 'SUCCESS' && (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">✓</div>
                <h2 className="text-base font-bold text-white mb-2">¡Oferta Registrada!</h2>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Tu oferta por el lote <strong className="text-slate-200">LOT-{selectedLot.id.slice(0, 8).toUpperCase()}</strong> quedó
                  registrada en Supabase. El minero la verá en su panel para aceptar o rechazar.
                </p>
                <button onClick={() => setSelectedLot(null)} className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold px-6 py-2 rounded-lg border border-slate-700">
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

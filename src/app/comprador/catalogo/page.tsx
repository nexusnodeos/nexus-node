'use client';

import React, { useState } from 'react';

interface Lot {
  id: string;
  lot_code: string;
  mineral: string;
  grade: string;
  volume_tons: number;
  region: string;
  country: string;
  score: number;
  lab: string;
  price_estimated_usd: string;
}

const MOCK_LOTS: Lot[] = [
  {
    id: '1',
    lot_code: 'LOT-2026-089',
    mineral: 'Cobre (Concentrado)',
    grade: '28.5% Cu',
    volume_tons: 5000,
    region: 'Atacama',
    country: 'Chile',
    score: 98,
    lab: 'SGS Chile',
    price_estimated_usd: '$4.2M USD',
  },
  {
    id: '2',
    lot_code: 'LOT-2026-104',
    mineral: 'Oro (Doré / Dique)',
    grade: '45 g/t Au',
    volume_tons: 120,
    region: 'Arequipa',
    country: 'Perú',
    score: 95,
    lab: 'ALS Global',
    price_estimated_usd: '$1.8M USD',
  },
  {
    id: '3',
    lot_code: 'LOT-2026-112',
    mineral: 'Litio (Carbonato)',
    grade: '99.2% Li2CO3',
    volume_tons: 800,
    region: 'Jujuy',
    country: 'Argentina',
    score: 92,
    lab: 'Alex Stewart',
    price_estimated_usd: '$9.5M USD',
  },
];

export default function BuyerCatalogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMineral, setSelectedMineral] = useState('ALL');
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [modalStep, setModalStep] = useState<'REQUIREMENTS' | 'NCNDA' | 'SUCCESS'>('REQUIREMENTS');

  // Estados ficticios de cumplimiento del comprador
  const [hasSignedNCNDA, setHasSignedNCNDA] = useState(false);
  const [hasUploadedPOF, setHasUploadedPOF] = useState(false);

  const filteredLots = MOCK_LOTS.filter((lot) => {
    const matchesSearch = lot.lot_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lot.mineral.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMineral = selectedMineral === 'ALL' || lot.mineral.includes(selectedMineral);
    return matchesSearch && matchesMineral;
  });

  const handleOpenReserveModal = (lot: Lot) => {
    setSelectedLot(lot);
    setModalStep('REQUIREMENTS');
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 p-6 md:p-10 font-sans">
      
      {/* HEADER DEL CATÁLOGO */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="text-blue-500">Nexus</span> Catálogo de Lotes Verificados
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Lotes auditados con fotoforesia digital, validación minera y ensayo de laboratorio.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#131926] px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-mono">Modo Comprador Acreditado</span>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="max-w-7xl mx-auto bg-[#131926] p-4 rounded-xl border border-slate-800 mb-8 flex flex-col md:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Buscar por Código de Lote o Mineral..."
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

      {/* GRID DE LOTES */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLots.map((lot) => (
          <div
            key={lot.id}
            className="bg-[#131926] border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all"
          >
            <div>
              {/* HEAD CARD */}
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-mono bg-blue-950/80 text-blue-400 border border-blue-800/50 px-2 py-0.5 rounded">
                  {lot.lot_code}
                </span>
                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded flex items-center gap-1">
                  ✓ Score {lot.score}/100
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{lot.mineral}</h3>
              <p className="text-xs text-slate-400 mb-4">{lot.region}, {lot.country}</p>

              {/* ESPECIFICACIONES TÉCNICAS */}
              <div className="bg-[#0B0F17] rounded-lg p-3 border border-slate-800/80 space-y-2 mb-4 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Ley / Pureza:</span>
                  <span className="text-emerald-400 font-bold">{lot.grade}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Volumen:</span>
                  <span>{lot.volume_tons.toLocaleString()} Ton</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Laboratorio:</span>
                  <span>{lot.lab}</span>
                </div>
              </div>
            </div>

            {/* FOOTER CARD */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 block">Est. Valor</span>
                <span className="text-sm font-bold text-slate-200">{lot.price_estimated_usd}</span>
              </div>
              <button
                onClick={() => handleOpenReserveModal(lot)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-semibold transition shadow-lg shadow-blue-600/20"
              >
                Reservar Lote
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL REQUISITOS / RESERVA ANTI-CIRCUNVENCIÓN */}
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
                  <h2 className="text-lg font-bold text-white mt-1">Requisitos para Reservar {selectedLot.lot_code}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Para proteger la confidencialidad de la mina y liberar la Ficha Técnica Cegada, completa las siguientes validaciones:
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {/* REQUISITO 1: NCNDA */}
                  <div className={`p-3 rounded-lg border flex justify-between items-center ${
                    hasSignedNCNDA ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-[#0B0F17] border-slate-800'
                  }`}>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">1. Acuerdo NCNDA Digital</h4>
                      <p className="text-[11px] text-slate-400">Protección de no circunvención comercial.</p>
                    </div>
                    {hasSignedNCNDA ? (
                      <span className="text-xs text-emerald-400 font-bold">✓ Firmado</span>
                    ) : (
                      <button
                        onClick={() => setHasSignedNCNDA(true)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 px-3 py-1 rounded"
                      >
                        Firmar
                      </button>
                    )}
                  </div>

                  {/* REQUISITO 2: PROOF OF FUNDS */}
                  <div className={`p-3 rounded-lg border flex justify-between items-center ${
                    hasUploadedPOF ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-[#0B0F17] border-slate-800'
                  }`}>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">2. Prueba de Fondos (POF)</h4>
                      <p className="text-[11px] text-slate-400">Acreditación de liquidez bancaria para compra.</p>
                    </div>
                    {hasUploadedPOF ? (
                      <span className="text-xs text-emerald-400 font-bold">✓ Cargado</span>
                    ) : (
                      <button
                        onClick={() => setHasUploadedPOF(true)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 px-3 py-1 rounded"
                      >
                        Adjuntar
                      </button>
                    )}
                  </div>
                </div>

                <button
                  disabled={!hasSignedNCNDA || !hasUploadedPOF}
                  onClick={() => setModalStep('SUCCESS')}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition ${
                    hasSignedNCNDA && hasUploadedPOF
                      ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {hasSignedNCNDA && hasUploadedPOF
                    ? 'Confirmar Reserva de 72 Horas'
                    : 'Completa los requisitos para continuar'}
                </button>
              </div>
            )}

            {modalStep === 'SUCCESS' && (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                  ✓
                </div>
                <h2 className="text-base font-bold text-white mb-2">¡Lote Reservado Exitosamente!</h2>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  El lote <strong className="text-slate-200">{selectedLot.lot_code}</strong> ha quedado congelado para tu cuenta durante 72 horas. Se ha enviado la Ficha Técnica Cegada y el reporte del laboratorio a tu correo registrado.
                </p>
                <button
                  onClick={() => setSelectedLot(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold px-6 py-2 rounded-lg border border-slate-700"
                >
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

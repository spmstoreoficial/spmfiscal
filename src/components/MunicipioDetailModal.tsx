import React from 'react';
import {
  X,
  MapPin,
  Building2,
  DollarSign,
  ShoppingBag,
  FileText,
  Users,
  Sparkles,
  TrendingUp,
  Tag,
  ExternalLink
} from 'lucide-react';
import { Invoice } from '../types';
import { findMunicipioUniversal } from '../data/spMunicipalities';
import { getIbgePopulationFormatted } from '../data/ibgePopData';

interface MunicipioDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string | null;
  invoices: Invoice[];
  onSelectInvoice?: (inv: Invoice) => void;
}

export const MunicipioDetailModal: React.FC<MunicipioDetailModalProps> = ({
  isOpen,
  onClose,
  cityName,
  invoices,
  onSelectInvoice
}) => {
  if (!isOpen || !cityName) return null;

  const munInfo = findMunicipioUniversal(cityName);
  const cityInvoices = invoices.filter(inv =>
    (inv.municipio || '').toLowerCase().trim() === cityName.toLowerCase().trim()
  );

  const totalFaturamento = cityInvoices.reduce((acc, inv) => {
    const valClean = (inv.valorNota || '0').replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
    return acc + (parseFloat(valClean) || 0);
  }, 0);

  const ticketMedio = cityInvoices.length > 0 ? totalFaturamento / cityInvoices.length : 0;

  // Marketplace breakdown
  const mktBreakdown: Record<string, number> = {};
  cityInvoices.forEach(inv => {
    const m = inv.origem || 'Shopee';
    mktBreakdown[m] = (mktBreakdown[m] || 0) + 1;
  });

  const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  {munInfo ? munInfo.nome : cityName} - {munInfo ? munInfo.uf : 'SP'}
                </h3>
                {munInfo?.regiao && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    Região {munInfo.regiao}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {munInfo?.codigoIbge ? `Código IBGE: ${munInfo.codigoIbge}` : 'Geolocalizado no Brasil'} • População IBGE: {munInfo?.codigoIbge ? getIbgePopulationFormatted(munInfo.codigoIbge) : 'N/D'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Faturamento Total</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {formatBRL(totalFaturamento)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Notas Emitidas</span>
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {cityInvoices.length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ticket Médio</span>
              <span className="text-base sm:text-lg font-black text-cyan-300 font-mono">
                {formatBRL(ticketMedio)}
              </span>
            </div>
          </div>

          {/* Marketplaces breakdown */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="font-bold text-cyan-400 uppercase tracking-wider text-[10px] block">
              Distribuição por Canais / Marketplaces
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(mktBreakdown).map(([mkt, count]) => (
                <div key={mkt} className="px-3 py-1.5 rounded-lg bg-[#020617] border border-slate-700 flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-white">{mkt}:</span>
                  <span className="font-mono font-bold text-cyan-400">{count} NFs</span>
                </div>
              ))}
              {Object.keys(mktBreakdown).length === 0 && (
                <p className="text-slate-500 italic">Nenhum canal registrado para este município.</p>
              )}
            </div>
          </div>

          {/* Invoices List */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="font-bold text-purple-400 uppercase tracking-wider text-[10px] block">
              Notas Fiscais Emitidas nesta Cidade ({cityInvoices.length})
            </span>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {cityInvoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice && onSelectInvoice(inv)}
                  className="p-2.5 rounded-xl bg-[#020617] border border-slate-800 hover:border-cyan-500 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-white block truncate">{inv.nome || 'Consumidor'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Fatura: {inv.fatura || 'N/A'} • SKU: {inv.codigo || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-emerald-400 text-xs block">
                      R$ {inv.valorNota}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{inv.dataSaida}</span>
                  </div>
                </div>
              ))}

              {cityInvoices.length === 0 && (
                <div className="p-4 text-center text-slate-500 italic">
                  Nenhuma nota fiscal emitida até o momento para {cityName}.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Dados sincronizados com a malha oficial do IBGE
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

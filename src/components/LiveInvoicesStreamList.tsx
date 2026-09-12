import React, { useState } from 'react';
import {
  Search,
  MapPin,
  FileText,
  Eye,
  Trash2,
  Edit2,
  Tag,
  DollarSign,
  ShoppingBag,
  ExternalLink,
  Download,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Invoice } from '../types';

interface LiveInvoicesStreamListProps {
  invoices: Invoice[];
  onSelectInvoice?: (invoice: Invoice) => void;
  onSelectCity?: (cityName: string) => void;
  onViewDanfe?: (invoice: Invoice) => void;
  onDeleteInvoice?: (id: string) => void;
}

export const LiveInvoicesStreamList: React.FC<LiveInvoicesStreamListProps> = ({
  invoices,
  onSelectInvoice,
  onSelectCity,
  onViewDanfe,
  onDeleteInvoice
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Shopee' | 'WhatsApp' | 'TikTok' | 'Mercado Livre'>('Todos');

  const filtered = invoices.filter(inv => {
    if (statusFilter !== 'Todos' && (inv.origem || 'Outros') !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        (inv.nome || '').toLowerCase().includes(s) ||
        (inv.documento || '').toLowerCase().includes(s) ||
        (inv.fatura || '').toLowerCase().includes(s) ||
        (inv.municipio || '').toLowerCase().includes(s) ||
        (inv.codigo || '').toLowerCase().includes(s) ||
        (inv.descricao || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  const getMarketplaceMeta = (origem?: string) => {
    const o = origem?.toLowerCase() || '';
    if (o.includes('shopee')) {
      return {
        label: 'Shopee',
        badge: 'bg-orange-950/80 text-orange-400 border border-orange-500/40',
        dot: 'bg-orange-500'
      };
    }
    if (o.includes('mercado') || o.includes('ml')) {
      return {
        label: 'Mercado Livre',
        badge: 'bg-yellow-950/80 text-yellow-400 border border-yellow-500/40',
        dot: 'bg-yellow-400'
      };
    }
    if (o.includes('tiktok')) {
      return {
        label: 'TikTok Shop',
        badge: 'bg-pink-950/80 text-pink-400 border border-pink-500/40',
        dot: 'bg-pink-500'
      };
    }
    if (o.includes('whats') || o.includes('direto')) {
      return {
        label: 'WhatsApp',
        badge: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40',
        dot: 'bg-emerald-400'
      };
    }
    return {
      label: origem || 'E-commerce',
      badge: 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40',
      dot: 'bg-cyan-400'
    };
  };

  return (
    <div className="flex flex-col h-full bg-[#0b1329]/95 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      
      {/* Feed Header */}
      <div className="p-2.5 sm:p-3 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-1">
              Feed Fiscal ao Vivo
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 font-bold bg-[#020617] px-2 py-0.5 rounded border border-slate-800">
            {filtered.length} NFs
          </span>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por cliente, fatura, cidade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#020617] text-white text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-800 focus:border-cyan-500 outline-none placeholder-slate-500 shadow-inner"
          />
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
          {(['Todos', 'Shopee', 'WhatsApp', 'TikTok', 'Mercado Livre'] as const).map(ch => (
            <button
              key={ch}
              onClick={() => setStatusFilter(ch)}
              className={`px-2 py-0.5 rounded font-bold transition whitespace-nowrap ${
                statusFilter === ch
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Stream Cards List */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Nenhuma nota fiscal encontrada para o filtro atual.
          </div>
        ) : (
          filtered.map(inv => {
            const meta = getMarketplaceMeta(inv.origem);
            return (
              <div
                key={inv.id}
                onClick={() => onSelectInvoice?.(inv)}
                className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer group relative overflow-hidden"
              >
                {/* Top Row: Date/Time + Channel Badge + Value */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold bg-[#020617] px-1.5 py-0.5 rounded border border-slate-800">
                      {inv.dataSaida || 'Sem Data'}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.badge} flex items-center gap-1`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </div>

                  <span className="font-mono font-extrabold text-xs text-emerald-300">
                    R$ {inv.valorNota}
                  </span>
                </div>

                {/* Customer Name */}
                <div className="font-bold text-xs text-white group-hover:text-cyan-200 transition truncate mb-1">
                  {inv.nome || 'Consumidor Final'}
                </div>

                {/* City & Doc & Fatura */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono mb-1.5">
                  {inv.municipio && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCity?.(inv.municipio);
                      }}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition"
                    >
                      <MapPin className="w-3 h-3 text-cyan-500" />
                      <span>{inv.municipio} - {inv.uf || 'SP'}</span>
                    </button>
                  )}

                  {inv.fatura && (
                    <span className="text-slate-400 font-mono">
                      FAT: {inv.fatura}
                    </span>
                  )}
                </div>

                {/* SKU / Description / Color */}
                <div className="text-[10px] text-slate-400 bg-[#020617]/80 px-2 py-1 rounded border border-slate-800/80 flex items-center justify-between gap-1 mb-2">
                  <span className="truncate flex-1">
                    {inv.codigo ? `[${inv.codigo}] ` : ''}{inv.descricao || 'Produto SPM'}
                  </span>
                  <span className="font-bold text-slate-300 shrink-0">
                    Cor: {inv.cor || 'Padrão'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDanfe?.(inv);
                      }}
                      className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" />
                      DANFE
                    </button>
                  </div>

                  {onDeleteInvoice && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja realmente excluir a nota fatura ${inv.fatura}?`)) {
                          onDeleteInvoice(inv.id);
                        }
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                      title="Excluir Nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

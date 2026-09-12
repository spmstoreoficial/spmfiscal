import React from 'react';
import {
  TrendingUp,
  DollarSign,
  FileText,
  ShoppingBag,
  Tag,
  Percent,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { Invoice } from '../types';

interface StatCardsProps {
  invoices: Invoice[];
  onSelectMarketplaceFilter?: (marketplace: string) => void;
  activeMarketplaceFilter?: string;
  onSelectStatusFilter?: (status: string) => void;
  activeStatusFilter?: string;
}

export const StatCards: React.FC<StatCardsProps> = ({
  invoices,
  onSelectMarketplaceFilter,
  activeMarketplaceFilter,
  onSelectStatusFilter,
  activeStatusFilter
}) => {
  // Helper to parse numbers in currency or plain string
  const parseNum = (val: string | number | undefined): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const clean = val.replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  let totalFaturamento = 0;
  let totalDescontos = 0;
  let totalItens = 0;
  let processadasCount = 0;
  let auditadasCount = 0;
  let pendentesCount = 0;

  const marketplaceCounts: Record<string, { count: number; total: number }> = {
    Shopee: { count: 0, total: 0 },
    'Mercado Livre': { count: 0, total: 0 },
    TikTok: { count: 0, total: 0 },
    WhatsApp: { count: 0, total: 0 },
    Outros: { count: 0, total: 0 }
  };

  invoices.forEach(inv => {
    const valNota = parseNum(inv.valorNota);
    const valDesc = parseNum(inv.desconto);
    const qtd = parseNum(inv.quantidade) || 1;

    totalFaturamento += valNota;
    totalDescontos += valDesc;
    totalItens += qtd;

    if (inv.status === 'Auditado') auditadasCount++;
    else if (inv.status === 'Pendente') pendentesCount++;
    else processadasCount++;

    const orig = inv.origem || 'Outros';
    if (marketplaceCounts[orig]) {
      marketplaceCounts[orig].count++;
      marketplaceCounts[orig].total += valNota;
    } else {
      marketplaceCounts.Outros.count++;
      marketplaceCounts.Outros.total += valNota;
    }
  });

  const totalNotas = invoices.length;
  const ticketMedio = totalNotas > 0 ? totalFaturamento / totalNotas : 0;
  const pctDesconto = totalFaturamento > 0 ? ((totalDescontos / totalFaturamento) * 100).toFixed(1) : '0.0';

  const formatCurrency = (v: number) => {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-2.5 lg:gap-3">
      
      {/* 1. Faturamento Total */}
      <div
        onClick={() => onSelectStatusFilter?.('Todos')}
        className={`p-3 rounded-xl border bg-gradient-to-br from-[#0c1a30] to-[#080f20] transition cursor-pointer relative overflow-hidden group shadow-lg ${
          activeStatusFilter === 'Todos'
            ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            : 'border-slate-800 hover:border-cyan-500/50'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Faturamento Total
          </span>
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-mono">
          {formatCurrency(totalFaturamento)}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span className="text-cyan-400 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3 inline" />
            {totalNotas} NFs
          </span>
          <span className="font-mono">100% Auditado</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
      </div>

      {/* 2. Total de Notas Fiscais */}
      <div
        onClick={() => onSelectStatusFilter?.('Processado')}
        className={`p-3 rounded-xl border bg-gradient-to-br from-[#0b1e1b] to-[#071310] transition cursor-pointer relative overflow-hidden group shadow-lg ${
          activeStatusFilter === 'Processado'
            ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'border-slate-800 hover:border-emerald-500/50'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Notas Emitidas
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-emerald-300 tracking-tight font-mono">
          {totalNotas}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span className="text-emerald-400 font-semibold">{processadasCount} Processadas</span>
          <span>{auditadasCount} Auditadas</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
      </div>

      {/* 3. Ticket Médio */}
      <div className="p-3 rounded-xl border border-slate-800 bg-gradient-to-br from-[#1a170b] to-[#120f06] relative overflow-hidden shadow-lg hover:border-amber-500/50 transition">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Ticket Médio
          </span>
          <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
            <Tag className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-amber-300 tracking-tight font-mono">
          {formatCurrency(ticketMedio)}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Média por Venda</span>
          <span className="text-amber-400 font-mono font-bold">SPM Store</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-500" />
      </div>

      {/* 4. Total de Itens Vendidos */}
      <div className="p-3 rounded-xl border border-slate-800 bg-gradient-to-br from-[#180e29] to-[#0f091a] relative overflow-hidden shadow-lg hover:border-purple-500/50 transition">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Itens Faturados
          </span>
          <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-purple-300 tracking-tight font-mono">
          {totalItens.toLocaleString('pt-BR')}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Unidades Totais</span>
          <span className="text-purple-400 font-mono">SKUs Fiscais</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
      </div>

      {/* 5. Descontos Concedidos */}
      <div className="p-3 rounded-xl border border-slate-800 bg-gradient-to-br from-[#1c0d16] to-[#12070e] relative overflow-hidden shadow-lg hover:border-rose-500/50 transition">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Descontos NFs
          </span>
          <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-400">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-rose-300 tracking-tight font-mono">
          {formatCurrency(totalDescontos)}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span className="text-rose-400 font-bold">{pctDesconto}% do Total</span>
          <span>Campanhas</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-red-500" />
      </div>

      {/* 6. Marketplaces (Shopee / ML / TikTok) */}
      <div className="p-3 rounded-xl border border-slate-800 bg-gradient-to-br from-[#0c1626] to-[#070e1a] relative overflow-hidden shadow-lg hover:border-blue-500/50 transition">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Canais de Venda
          </span>
          <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 mt-0.5">
          <button
            onClick={() => onSelectMarketplaceFilter?.('Shopee')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition ${
              activeMarketplaceFilter === 'Shopee'
                ? 'bg-orange-500 text-white'
                : 'bg-orange-950/80 text-orange-400 border border-orange-500/30 hover:bg-orange-900'
            }`}
            title="Filtrar Shopee"
          >
            SHP ({marketplaceCounts.Shopee.count})
          </button>
          <button
            onClick={() => onSelectMarketplaceFilter?.('WhatsApp')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition ${
              activeMarketplaceFilter === 'WhatsApp'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900'
            }`}
            title="Filtrar WhatsApp"
          >
            WPP ({marketplaceCounts.WhatsApp.count})
          </button>
          <button
            onClick={() => onSelectMarketplaceFilter?.('TikTok')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition ${
              activeMarketplaceFilter === 'TikTok'
                ? 'bg-pink-500 text-white'
                : 'bg-pink-950/80 text-pink-400 border border-pink-500/30 hover:bg-pink-900'
            }`}
            title="Filtrar TikTok"
          >
            TT ({marketplaceCounts.TikTok.count})
          </button>
          <button
            onClick={() => onSelectMarketplaceFilter?.('Mercado Livre')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition ${
              activeMarketplaceFilter === 'Mercado Livre'
                ? 'bg-yellow-500 text-slate-950'
                : 'bg-yellow-950/80 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-900'
            }`}
            title="Filtrar Mercado Livre"
          >
            ML ({marketplaceCounts['Mercado Livre'].count})
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate">
            {activeMarketplaceFilter && activeMarketplaceFilter !== 'Todos'
              ? `${activeMarketplaceFilter}: ${formatCurrency(marketplaceCounts[activeMarketplaceFilter]?.total || 0)}`
              : `SHP: ${formatCurrency(marketplaceCounts.Shopee.total)}`}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
      </div>

    </div>
  );
};

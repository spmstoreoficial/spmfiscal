import React from 'react';
import { DashboardStats, Invoice } from '../types';
import {
  Activity,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  MapPin,
  Package,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface StatCardsProps {
  stats: DashboardStats | null;
  invoices: Invoice[];
  activeMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (marketplace: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  stats,
  invoices,
  activeMarketplaceFilter,
  onSelectMarketplaceFilter
}) => {
  const totalNotas = stats?.totalNotas ?? invoices.length;
  const totalFaturamento = stats?.totalFaturamento ?? 0;
  const ticketMedio = stats?.ticketMedio ?? (totalNotas > 0 ? totalFaturamento / totalNotas : 0);
  const totalItens = stats?.totalItens ?? invoices.reduce((acc, i) => acc + (parseInt(i.quantidade, 10) || 1), 0);

  // Top marketplace calculation
  let topMarketplace = 'Shopee';
  let topMarketplaceCount = 0;
  if (stats?.marketplacesCount) {
    Object.entries(stats.marketplacesCount).forEach(([mp, rawCount]) => {
      const count = Number(rawCount) || 0;
      if (count > topMarketplaceCount) {
        topMarketplaceCount = count;
        topMarketplace = mp;
      }
    });
  }

  // Geographic coverage
  const uniqueUFs = new Set(invoices.map(i => i.uf).filter(Boolean)).size;
  const uniqueCities = new Set(invoices.map(i => i.municipio).filter(Boolean)).size;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
      
      {/* 1. Total Notas */}
      <div 
        onClick={() => onSelectMarketplaceFilter?.('Todas')}
        className={`bg-[#0f172a]/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer shadow-lg hover:border-cyan-500/60 flex flex-col justify-between ${
          !activeMarketplaceFilter || activeMarketplaceFilter === 'Todas'
            ? 'border-cyan-500/80 ring-1 ring-cyan-500/40 bg-[#0f172a]'
            : 'border-slate-800'
        }`}
      >
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Notas</span>
            <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {totalNotas}
            </span>
            <span className="text-[10px] sm:text-xs text-cyan-400 font-medium flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> Ativas
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-full"></div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-between">
          <span>Extraídas e Validadas</span>
          <span className="text-cyan-400">100%</span>
        </div>
      </div>

      {/* 2. Faturamento Total */}
      <div 
        className="bg-[#0f172a]/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-800 transition-all shadow-lg hover:border-emerald-500/60 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Faturamento</span>
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400 tracking-tight truncate">
              {formatBRL(totalFaturamento)}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-full"></div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-between">
          <span>Valor Bruto NF-e</span>
          <span className="text-emerald-400">Sincronizado</span>
        </div>
      </div>

      {/* 3. Ticket Médio */}
      <div 
        className="bg-[#0f172a]/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-800 transition-all shadow-lg hover:border-purple-500/60 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Ticket Médio</span>
            <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-purple-300 tracking-tight truncate">
              {formatBRL(ticketMedio)}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-4/5"></div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-between">
          <span>Média por DANFE</span>
          <span className="text-purple-400">Estável</span>
        </div>
      </div>

      {/* 4. Canal Líder */}
      <div 
        onClick={() => onSelectMarketplaceFilter?.(topMarketplace)}
        className="bg-[#0f172a]/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-800 transition-all cursor-pointer shadow-lg hover:border-amber-500/60 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Canal Líder</span>
            <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-amber-300 tracking-tight truncate">
              {topMarketplace}
            </span>
            <span className="text-[10px] sm:text-xs text-amber-400 font-mono font-bold">
              ({topMarketplaceCount} NFs)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full w-3/4"></div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-between">
          <span>Maior Volume</span>
          <span className="text-amber-400">Filtrar</span>
        </div>
      </div>

      {/* 5. Cobertura Geográfica */}
      <div 
        className="bg-[#0f172a]/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-800 transition-all shadow-lg hover:border-blue-500/60 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Cidades / UFs</span>
            <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-blue-300 tracking-tight">
              {uniqueCities}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
              em {uniqueUFs} estados
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-5/6"></div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-between">
          <span>Alcance Nacional</span>
          <span className="text-blue-400">Brasil</span>
        </div>
      </div>

      {/* 6. Total Peças & Itens */}
      <div 
        className="bg-[#0f172a]/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-800 transition-all shadow-lg hover:border-teal-500/60 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Itens / Peças</span>
            <div className="p-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-teal-300 tracking-tight">
              {totalItens}
            </span>
            <span className="text-[10px] sm:text-xs text-teal-400 font-medium">
              unidades
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full w-full"></div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-between">
          <span>Estoque Faturado</span>
          <span className="text-teal-400">OK</span>
        </div>
      </div>

    </div>
  );
};

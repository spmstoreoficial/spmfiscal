import React from 'react';
import { 
  DollarSign, 
  FileText, 
  ShoppingBag, 
  TrendingUp, 
  Tag, 
  Percent, 
  MapPin, 
  Layers,
  ArrowUpRight,
  Sparkles,
  Activity,
  Package,
  Clock,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { DashboardStats, Invoice } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  CartesianGrid
} from 'recharts';

interface DashboardViewProps {
  stats: DashboardStats | null;
  invoices: Invoice[];
  onSelectTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, invoices, onSelectTab }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-mono text-xs">
        <Activity className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
        Carregando estatísticas fiscais em tempo real...
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Timeline chart data
  const timelineData = stats.timeline && stats.timeline.length > 0 
    ? stats.timeline 
    : invoices.slice(0, 10).map((inv, idx) => ({
        data: inv.dataSaida || `Dia ${idx + 1}`,
        total: parseFloat((inv.valorNota || '0').replace(',', '.')) || 0,
        count: 1
      }));

  // Marketplaces chart data
  const marketplaceData = Object.entries(stats.marketplacesFaturamento).map(([name, value]) => ({
    name,
    faturamento: Number(value) || 0,
    count: Number(stats.marketplacesCount[name]) || 0
  }));

  const MARKETPLACE_COLORS: Record<string, string> = {
    'Shopee': '#f97316',
    'Mercado Livre': '#eab308',
    'TikTok': '#ec4899',
    'WhatsApp': '#10b981',
    'Outros': '#3b82f6'
  };

  return (
    <div className="space-y-6">
      
      {/* Top Graphic Area: Timeline & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline Chart (2 cols) */}
        <div className="lg:col-span-2 bg-[#0f172a]/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                  Evolução do Faturamento & Emissão de NFs
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Valores consolidados em Reais (R$) por data de saída/emissão
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#020617] text-cyan-400 border border-slate-800 text-[11px] font-mono font-bold">
              Tempo Real
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis 
                  dataKey="data" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: 'rgba(6,182,212,0.4)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Faturamento']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#06b6d4" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorFaturamento)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Marketplaces Breakdown */}
        <div className="bg-[#0f172a]/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-white text-sm tracking-tight">
                  Canais & Marketplaces
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {Object.keys(stats.marketplacesFaturamento).length} Canais
              </span>
            </div>

            <div className="space-y-3.5 mt-4">
              {Object.entries(stats.marketplacesFaturamento).map(([mkt, rawVal]) => {
                const val = Number(rawVal) || 0;
                const count = Number(stats.marketplacesCount[mkt]) || 0;
                const pct = stats.totalFaturamento > 0 ? (val / stats.totalFaturamento) * 100 : 0;
                const barColor = MARKETPLACE_COLORS[mkt] || '#3b82f6';

                return (
                  <div key={mkt} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: barColor }} />
                        <span>{mkt}</span>
                        <span className="text-[10px] font-mono text-slate-400">({count} NFs)</span>
                      </span>
                      <span className="text-emerald-400 font-mono font-bold">{formatCurrency(val)}</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, Math.max(5, pct))}%`,
                          backgroundColor: barColor
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Ticket Médio Geral:</span>
            <span className="font-mono font-bold text-purple-300">{formatCurrency(stats.ticketMedio)}</span>
          </div>
        </div>

      </div>

      {/* Second Row: Colors & Brazil Geo Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colors Breakdown */}
        <div className="bg-[#0f172a]/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Tag className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-white text-sm tracking-tight">
                Vendas por Cor do Produto
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {stats.totalItens} Peças
            </span>
          </div>

          <div className="space-y-3 mt-3">
            {Object.entries(stats.coresCount).map(([cor, rawCount]) => {
              const count = Number(rawCount) || 0;
              const pct = stats.totalNotas > 0 ? (count / stats.totalNotas) * 100 : 0;
              return (
                <div key={cor} className="space-y-1.5 bg-[#020617] p-2.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border border-slate-600 ${
                        cor.toLowerCase() === 'preto' ? 'bg-slate-950' :
                        cor.toLowerCase() === 'marrom' ? 'bg-amber-800' :
                        cor.toLowerCase() === 'incolor' ? 'bg-cyan-300' : 'bg-slate-500'
                      }`} />
                      <span className="capitalize">{cor}</span>
                    </span>
                    <span className="text-cyan-400 font-mono font-bold">{count} itens ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        cor.toLowerCase() === 'preto' ? 'bg-slate-400' :
                        cor.toLowerCase() === 'marrom' ? 'bg-amber-600' :
                        cor.toLowerCase() === 'incolor' ? 'bg-cyan-400' : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geo Distribution with Map link (2 cols) */}
        <div className="lg:col-span-2 bg-[#0f172a]/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <MapPin className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-white text-sm tracking-tight">
                Distribuição Geográfica de Vendas por Estado (UF)
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('map')}
              className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 transition cursor-pointer"
            >
              <span>Abrir Mapa do Brasil</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(stats.ufDistribution).map(([uf, count]) => (
              <div 
                key={uf}
                onClick={() => onSelectTab('map')}
                className="bg-[#020617] hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 p-2.5 rounded-xl transition cursor-pointer flex flex-col items-center justify-center space-y-1 shadow-md group"
              >
                <span className="font-extrabold text-sm font-mono text-white group-hover:text-cyan-400 transition">{uf}</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
                  {count} {count === 1 ? 'NF' : 'NFs'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Invoices Table Quick View */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Últimos Registros DANFE Processados</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Visualização instantânea com Nome, Documento, Fatura, Canal e Valor
            </p>
          </div>
          <button
            onClick={() => onSelectTab('database')}
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition"
          >
            <span>Ver Todas no Banco ({invoices.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#020617] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">NF / Fatura</th>
                <th className="p-3">Canal</th>
                <th className="p-3">Cliente / Destinatário</th>
                <th className="p-3">Data NF</th>
                <th className="p-3">Cidade / UF</th>
                <th className="p-3">Código SKU</th>
                <th className="p-3">Cor</th>
                <th className="p-3 text-right">Valor Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {invoices.slice(0, 8).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-cyan-400">
                    #{inv.fatura || inv.id}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[10px]">
                      {inv.origem}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-white max-w-[200px] truncate">{inv.nome}</td>
                  <td className="p-3 font-mono text-slate-400">{inv.dataSaida}</td>
                  <td className="p-3 text-slate-300">{inv.municipio} - {inv.uf}</td>
                  <td className="p-3 font-mono text-slate-400 font-semibold">{inv.codigo}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      inv.cor.toLowerCase() === 'preto' ? 'bg-slate-900 text-white border-slate-700' :
                      inv.cor.toLowerCase() === 'marrom' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                      inv.cor.toLowerCase() === 'incolor' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {inv.cor}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    R$ {inv.valorNota}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

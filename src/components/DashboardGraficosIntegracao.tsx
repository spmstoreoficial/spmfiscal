import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  MapPin,
  ShoppingBag,
  Award,
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { Invoice } from '../types';

interface DashboardGraficosIntegracaoProps {
  invoices: Invoice[];
  onBackToMap?: () => void;
  onSelectCity?: (cityName: string) => void;
}

const COLORS_CHART = [
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#64748b'  // Slate
];

const MARKETPLACE_COLORS: Record<string, string> = {
  Shopee: '#f97316',
  'Mercado Livre': '#eab308',
  TikTok: '#ec4899',
  WhatsApp: '#10b981',
  Outros: '#3b82f6'
};

export const DashboardGraficosIntegracao: React.FC<DashboardGraficosIntegracaoProps> = ({
  invoices,
  onBackToMap,
  onSelectCity
}) => {
  const parseNum = (val: string | number | undefined): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const clean = val.replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  const formatCurrency = (v: number) => {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // 1. Marketplace Stats
  const marketplaceData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    invoices.forEach(inv => {
      const orig = inv.origem || 'Outros';
      const val = parseNum(inv.valorNota);
      if (!map[orig]) map[orig] = { total: 0, count: 0 };
      map[orig].total += val;
      map[orig].count += 1;
    });

    return Object.keys(map).map(k => ({
      name: k,
      total: Math.round(map[k].total),
      count: map[k].count,
      fill: MARKETPLACE_COLORS[k] || '#06b6d4'
    })).sort((a, b) => b.total - a.total);
  }, [invoices]);

  // 2. UF Stats
  const ufData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    invoices.forEach(inv => {
      const uf = (inv.uf || 'SP').toUpperCase();
      const val = parseNum(inv.valorNota);
      if (!map[uf]) map[uf] = { total: 0, count: 0 };
      map[uf].total += val;
      map[uf].count += 1;
    });

    return Object.keys(map).map(uf => ({
      uf,
      total: Math.round(map[uf].total),
      count: map[uf].count
    })).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [invoices]);

  // 3. Timeline Data (por data de saída)
  const timelineData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    invoices.forEach(inv => {
      const data = inv.dataSaida || 'Sem Data';
      const val = parseNum(inv.valorNota);
      if (!map[data]) map[data] = { total: 0, count: 0 };
      map[data].total += val;
      map[data].count += 1;
    });

    return Object.keys(map).map(d => ({
      data: d,
      total: Math.round(map[d].total),
      count: map[d].count
    })).slice(-12);
  }, [invoices]);

  // 4. Cores Data
  const coresData = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach(inv => {
      const cor = inv.cor || 'Não identificada';
      map[cor] = (map[cor] || 0) + (parseNum(inv.quantidade) || 1);
    });

    return Object.keys(map).map(cor => ({
      name: cor,
      value: map[cor]
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [invoices]);

  const totalGeral = invoices.reduce((acc, inv) => acc + parseNum(inv.valorNota), 0);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 bg-[#020617] text-slate-100 font-sans">
      
      {/* Top Bar with Back Button & Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          {onBackToMap && (
            <button
              onClick={onBackToMap}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              Voltar ao Mapa
            </button>
          )}
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Dashboard Analítico & Inteligência de Faturamento
            </h2>
            <p className="text-xs text-slate-400">
              Métricas consolidadas de vendas, marketplaces, canais e cobertura estadual
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-[#0b1329] px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Faturamento Consolidado:</span>
          <span className="font-mono font-extrabold text-emerald-400 text-sm">
            {formatCurrency(totalGeral)}
          </span>
        </div>
      </div>

      {/* Grid: 2 Columns of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 1: Evolução Temporal de Faturamento */}
        <div className="p-4 rounded-2xl bg-[#0b1329]/90 border border-slate-800/90 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Evolução Temporal de Faturamento (R$)
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              Diário / Mensal
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="data" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Faturamento']}
                />
                <Area type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Faturamento por Marketplace (Donut) */}
        <div className="p-4 rounded-2xl bg-[#0b1329]/90 border border-slate-800/90 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              Distribuição por Marketplace
            </h3>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
              Canais
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketplaceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="total"
                  nameKey="name"
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {marketplaceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS_CHART[index % COLORS_CHART.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Faturamento']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Faturamento por Estado (Top 10 UFs) */}
        <div className="p-4 rounded-2xl bg-[#0b1329]/90 border border-slate-800/90 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Top 10 Estados / UFs em Vendas (R$)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
              Cobertura Brasil
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ufData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <YAxis dataKey="uf" type="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Faturamento']}
                />
                <Bar dataKey="total" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Cores & Variantes Vendidas */}
        <div className="p-4 rounded-2xl bg-[#0b1329]/90 border border-slate-800/90 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Mix de Cores / Variantes Mais Faturadas
            </h3>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
              Produtos
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coresData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [`${val} unidades`, 'Quantidade']}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

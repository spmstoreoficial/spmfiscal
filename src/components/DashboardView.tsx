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
  Sparkles
} from 'lucide-react';
import { DashboardStats, Invoice } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  invoices: Invoice[];
  onSelectTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, invoices, onSelectTab }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Carregando estatísticas fiscais...
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturamento Final (Notas)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {formatCurrency(stats.totalFaturamento)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Soma do 'Valor Final' das notas</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Itens / Notas</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {stats.totalNotas} <span className="text-sm font-normal text-slate-400">registros</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{stats.totalItens} unidades no total</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket Médio por Nota</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {formatCurrency(stats.ticketMedio)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Média de faturamento por registro</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Descontos</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600 tracking-tight font-mono">
              {formatCurrency(stats.totalDescontos)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Economia concedida aos clientes</p>
        </div>
      </div>

      {/* Marketplaces & Colors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Marketplaces breakdown */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Faturamento por Marketplace</span>
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.marketplacesFaturamento).map(([mkt, rawVal]) => {
              const val = Number(rawVal) || 0;
              const count = Number(stats.marketplacesCount[mkt]) || 0;
              const pct = stats.totalFaturamento > 0 ? (val / stats.totalFaturamento) * 100 : 0;
              return (
                <div key={mkt} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{mkt} ({count} notas)</span>
                    <span className="text-slate-900 font-mono font-bold">{formatCurrency(val)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        mkt === 'Shopee' ? 'bg-orange-500' :
                        mkt === 'Mercado Livre' ? 'bg-amber-500' :
                        mkt === 'WhatsApp' ? 'bg-emerald-500' :
                        mkt === 'TikTok' ? 'bg-pink-500' : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cores Identificadas */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Tag className="w-4 h-4 text-amber-600" />
              <span>Distribuição por Cor do Produto</span>
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.coresCount).map(([cor, rawCount]) => {
              const count = Number(rawCount) || 0;
              const pct = stats.totalNotas > 0 ? (count / stats.totalNotas) * 100 : 0;
              return (
                <div key={cor} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 flex items-center space-x-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        cor.toLowerCase() === 'preto' ? 'bg-slate-900' :
                        cor.toLowerCase() === 'marrom' ? 'bg-amber-700' :
                        cor.toLowerCase() === 'incolor' ? 'bg-cyan-400' : 'bg-slate-400'
                      }`} />
                      <span>{cor}</span>
                    </span>
                    <span className="text-slate-900 font-mono font-bold">{count} itens ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        cor.toLowerCase() === 'preto' ? 'bg-slate-900' :
                        cor.toLowerCase() === 'marrom' ? 'bg-amber-700' :
                        cor.toLowerCase() === 'incolor' ? 'bg-cyan-400' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribuição por UF com link para o Mapa */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Distribuição Geográfica (UF & Cidades)</span>
            </h3>
            <button
              onClick={() => onSelectTab('map')}
              className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
            >
              <span>Abrir Mapa do Brasil</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.ufDistribution).map(([uf, count]) => (
              <div 
                key={uf}
                onClick={() => onSelectTab('map')}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-xs cursor-pointer transition"
              >
                <span className="font-black text-slate-900">{uf}</span>
                <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono font-bold text-blue-600">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Invoices Table Quick View */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Últimos Registros Processados</h3>
            <p className="text-slate-500 text-xs">Exibindo NOME, FATURA, COR, SKU e VALOR FINAL</p>
          </div>
          <button
            onClick={() => onSelectTab('database')}
            className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-500"
          >
            <span>Ver Todas no Banco de Dados</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
              <tr>
                <th className="p-2.5">NOME</th>
                <th className="p-2.5">DATA NF-e</th>
                <th className="p-2.5">CIDADE / UF</th>
                <th className="p-2.5">FATURA</th>
                <th className="p-2.5">CÓDIGO (SKU)</th>
                <th className="p-2.5">COR</th>
                <th className="p-2.5">MARKETPLACE</th>
                <th className="p-2.5 text-right">VALOR FINAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="p-2.5 font-bold text-slate-900">{inv.nome}</td>
                  <td className="p-2.5 text-slate-500">{inv.dataSaida}</td>
                  <td className="p-2.5 text-slate-600">{inv.municipio} - {inv.uf}</td>
                  <td className="p-2.5 font-mono text-[11px] text-slate-600">{inv.fatura}</td>
                  <td className="p-2.5 font-mono text-slate-800 font-semibold">{inv.codigo}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      inv.cor.toLowerCase() === 'preto' ? 'bg-slate-900 text-white border-slate-900' :
                      inv.cor.toLowerCase() === 'marrom' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                      inv.cor.toLowerCase() === 'incolor' ? 'bg-cyan-50 text-cyan-800 border-cyan-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {inv.cor}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {inv.origem}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
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

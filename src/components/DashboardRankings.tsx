import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Users,
  ShoppingBag,
  MapPin,
  DollarSign,
  ArrowLeft,
  Medal,
  TrendingUp,
  Search,
  CheckCircle2,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Invoice } from '../types';

interface DashboardRankingsProps {
  invoices: Invoice[];
  onBackToMap?: () => void;
  onSelectCity?: (cityName: string) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
}

type RankingTab = 'clientes' | 'produtos' | 'cidades' | 'marketplaces';

export const DashboardRankings: React.FC<DashboardRankingsProps> = ({
  invoices,
  onBackToMap,
  onSelectCity,
  onSelectInvoice
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>('clientes');
  const [search, setSearch] = useState('');

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

  // 1. Top Clientes
  const topClientes = useMemo(() => {
    const map: Record<string, { nome: string; documento: string; uf: string; cidade: string; total: number; count: number; items: Invoice[] }> = {};
    invoices.forEach(inv => {
      const key = inv.nome || 'Consumidor Não Identificado';
      const val = parseNum(inv.valorNota);
      if (!map[key]) {
        map[key] = {
          nome: key,
          documento: inv.documento || '',
          uf: inv.uf || 'SP',
          cidade: inv.municipio || 'São Paulo',
          total: 0,
          count: 0,
          items: []
        };
      }
      map[key].total += val;
      map[key].count += 1;
      map[key].items.push(inv);
    });

    let list = Object.values(map).sort((a, b) => b.total - a.total);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(c => c.nome.toLowerCase().includes(s) || c.cidade.toLowerCase().includes(s));
    }
    return list;
  }, [invoices, search]);

  // 2. Top Produtos / SKUs
  const topProdutos = useMemo(() => {
    const map: Record<string, { codigo: string; descricao: string; cor: string; total: number; qtd: number }> = {};
    invoices.forEach(inv => {
      const code = inv.codigo || 'SEM_CODIGO';
      const val = parseNum(inv.valorNota);
      const qtd = parseNum(inv.quantidade) || 1;
      if (!map[code]) {
        map[code] = {
          codigo: code,
          descricao: inv.descricao || 'Produto SPM',
          cor: inv.cor || 'Padrão',
          total: 0,
          qtd: 0
        };
      }
      map[code].total += val;
      map[code].qtd += qtd;
    });

    let list = Object.values(map).sort((a, b) => b.qtd - a.qtd);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(p => p.codigo.toLowerCase().includes(s) || p.descricao.toLowerCase().includes(s));
    }
    return list;
  }, [invoices, search]);

  // 3. Top Cidades
  const topCidades = useMemo(() => {
    const map: Record<string, { cidade: string; uf: string; total: number; count: number }> = {};
    invoices.forEach(inv => {
      const city = inv.municipio || 'São Paulo';
      const uf = inv.uf || 'SP';
      const key = `${city}-${uf}`;
      const val = parseNum(inv.valorNota);
      if (!map[key]) {
        map[key] = {
          cidade: city,
          uf,
          total: 0,
          count: 0
        };
      }
      map[key].total += val;
      map[key].count += 1;
    });

    let list = Object.values(map).sort((a, b) => b.total - a.total);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(c => c.cidade.toLowerCase().includes(s) || c.uf.toLowerCase().includes(s));
    }
    return list;
  }, [invoices, search]);

  // 4. Top Marketplaces
  const topMarketplaces = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    invoices.forEach(inv => {
      const orig = inv.origem || 'Outros';
      const val = parseNum(inv.valorNota);
      if (!map[orig]) map[orig] = { name: orig, total: 0, count: 0 };
      map[orig].total += val;
      map[orig].count += 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [invoices]);

  const maxClienteTotal = topClientes.length > 0 ? topClientes[0].total : 1;
  const maxProdutoQtd = topProdutos.length > 0 ? topProdutos[0].qtd : 1;
  const maxCidadeTotal = topCidades.length > 0 ? topCidades[0].total : 1;

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-amber-300 bg-amber-950/80 border-amber-500/50';
    if (index === 1) return 'text-slate-200 bg-slate-800 border-slate-600';
    if (index === 2) return 'text-amber-600 bg-amber-950/50 border-amber-700/50';
    return 'text-slate-400 bg-slate-900 border-slate-800';
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 bg-[#020617] text-slate-100 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
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
              <Trophy className="w-5 h-5 text-amber-400" />
              Rankings & Liderança de Vendas Fiscais
            </h2>
            <p className="text-xs text-slate-400">
              Classificação por clientes, produtos, municípios e canais de faturamento
            </p>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex items-center bg-[#0b1329] p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => { setActiveTab('clientes'); setSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'clientes' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Top Clientes
          </button>
          <button
            onClick={() => { setActiveTab('produtos'); setSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'produtos' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Top Produtos
          </button>
          <button
            onClick={() => { setActiveTab('cidades'); setSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'cidades' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Top Cidades
          </button>
          <button
            onClick={() => { setActiveTab('marketplaces'); setSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'marketplaces' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Marketplaces
          </button>
        </div>
      </div>

      {/* Search Input for rankings */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Filtrar ${activeTab}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0b1329] text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none placeholder-slate-500 shadow-inner"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Exibindo {activeTab === 'clientes' ? topClientes.length : activeTab === 'produtos' ? topProdutos.length : topCidades.length} registros
        </span>
      </div>

      {/* Tab 1: Clientes */}
      {activeTab === 'clientes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topClientes.map((c, index) => {
            const pct = Math.round((c.total / maxClienteTotal) * 100);
            return (
              <div
                key={c.nome}
                className="p-3.5 rounded-2xl bg-[#0b1329]/90 border border-slate-800/90 hover:border-cyan-500/50 transition flex flex-col justify-between shadow-xl"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs border ${getMedalColor(index)}`}>
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-white">
                        {c.nome}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {c.cidade} - {c.uf} {c.documento ? `• DOC: ${c.documento}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm text-emerald-300">
                      {formatCurrency(c.total)}
                    </div>
                    <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-500/30">
                      {c.count} {c.count === 1 ? 'Nota' : 'Notas'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Produtos */}
      {activeTab === 'produtos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topProdutos.map((p, index) => {
            const pct = Math.round((p.qtd / maxProdutoQtd) * 100);
            return (
              <div
                key={p.codigo}
                className="p-3.5 rounded-2xl bg-[#0b1329]/90 border border-slate-800/90 hover:border-cyan-500/50 transition flex flex-col justify-between shadow-xl"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs border ${getMedalColor(index)}`}>
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-white">
                        {p.descricao}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        SKU: <span className="text-cyan-400 font-bold">{p.codigo}</span> • Cor: {p.cor}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm text-purple-300">
                      {p.qtd} un
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatCurrency(p.total)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Cidades */}
      {activeTab === 'cidades' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topCidades.map((c, index) => {
            const pct = Math.round((c.total / maxCidadeTotal) * 100);
            return (
              <div
                key={`${c.cidade}-${c.uf}`}
                onClick={() => onSelectCity?.(c.cidade)}
                className="p-3.5 rounded-2xl bg-[#0b1329]/90 border border-slate-800/90 hover:border-cyan-500/50 transition flex flex-col justify-between shadow-xl cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs border ${getMedalColor(index)}`}>
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-cyan-300 transition flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {c.cidade} - {c.uf}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {c.count} {c.count === 1 ? 'venda registrada' : 'vendas registradas'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm text-emerald-300">
                      {formatCurrency(c.total)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Média: {formatCurrency(c.total / c.count)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Marketplaces */}
      {activeTab === 'marketplaces' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topMarketplaces.map((m, index) => (
            <div
              key={m.name}
              className="p-4 rounded-2xl bg-[#0b1329]/90 border border-slate-800 shadow-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-sm border ${getMedalColor(index)}`}>
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-white">{m.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">{m.count} pedidos faturados</p>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-extrabold text-base text-emerald-400">
                  {formatCurrency(m.total)}
                </div>
                <span className="text-xs text-slate-400">
                  Ticket Médio: {formatCurrency(m.total / m.count)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

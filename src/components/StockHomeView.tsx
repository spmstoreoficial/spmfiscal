import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  PlusCircle, 
  SlidersHorizontal, 
  RotateCw, 
  Download, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Layers, 
  Boxes, 
  ShieldCheck, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Info, 
  Sparkles,
  ShoppingBag,
  Edit3,
  Archive,
  Truck,
  FileSpreadsheet,
  AlertOctagon,
  ChevronRight,
  ExternalLink,
  Tag
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  StockItem, 
  StockMovement, 
  StockStats, 
  StockStatusLevel, 
  NewStockMovementPayload, 
  Invoice 
} from '../types';
import { api } from '../lib/api';
import { playAttendanceChime, playUrgentAlert } from '../utils/audioAlert';

interface StockHomeViewProps {
  invoices: Invoice[];
  onOpenInvoicesTab?: () => void;
  userRole?: string;
}

export const StockHomeView: React.FC<StockHomeViewProps> = ({
  invoices,
  onOpenInvoicesTab,
  userRole
}) => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState<StockStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'movements' | 'analytics'>('inventory');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [corFilter, setCorFilter] = useState('TODAS');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [movementTypeFilter, setMovementTypeFilter] = useState('TODOS');

  // Modais
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<StockItem | null>(null);

  // Form State Entrada
  const [entryForm, setEntryForm] = useState<{
    productId: string;
    quantidade: number;
    precoCusto: number;
    documentoRef: string;
    fornecedor: string;
    motivo: string;
  }>({
    productId: '',
    quantidade: 100,
    precoCusto: 12.50,
    documentoRef: '',
    fornecedor: 'Fornecedor Principal SPM',
    motivo: 'Entrada de compra / Lote de reposição'
  });

  // Form State Ajuste
  const [adjustForm, setAdjustForm] = useState<{
    productId: string;
    tipo: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'PERDA_AVARIA';
    quantidade: number;
    motivo: string;
  }>({
    productId: '',
    tipo: 'AJUSTE_POSITIVO',
    quantidade: 10,
    motivo: 'Contagem e conferência física de inventário'
  });

  // Carregar dados de estoque
  const fetchStockData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [itemsData, movData, statsData] = await Promise.all([
        api.getStockItems(),
        api.getStockMovements({ limit: '100' }),
        api.getStockStats()
      ]);
      setItems(itemsData || []);
      setMovements(movData || []);
      setStats(statsData || null);
    } catch (err) {
      console.error('Erro ao carregar dados de estoque:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  // Recalcular Estoque Geral
  const handleRecalculate = async () => {
    if (!confirm('Deseja recalcular todos os saldos de estoque a partir do histórico de todas as notas fiscais?')) {
      return;
    }
    setIsRecalculating(true);
    try {
      const res = await api.recalculateStock();
      await fetchStockData();
      playAttendanceChime();
      alert(`✅ ${res.message}\nTotal de notas: ${res.result?.totalNotasProcessadas || 0}\nSaídas baixadas: ${res.result?.totalUnidadesBaixadas || 0}`);
    } catch (err: any) {
      playUrgentAlert();
      alert('Erro ao recalcular: ' + err.message);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Submeter Entrada de Estoque
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryForm.productId || entryForm.quantidade <= 0) {
      alert('Selecione um produto e informe uma quantidade válida.');
      return;
    }
    try {
      await api.addStockMovement({
        productId: entryForm.productId,
        tipo: 'ENTRADA_COMPRA',
        quantidade: Number(entryForm.quantidade),
        documentoRef: entryForm.documentoRef || 'Compra de Lote',
        origemCanal: entryForm.fornecedor || 'Fornecedor',
        motivo: entryForm.motivo || 'Entrada de compra / reposição',
        valorUnitario: Number(entryForm.precoCusto)
      });
      playAttendanceChime();
      setIsEntryModalOpen(false);
      await fetchStockData();
    } catch (err: any) {
      playUrgentAlert();
      alert('Erro ao registrar entrada: ' + err.message);
    }
  };

  // Submeter Ajuste de Inventário
  const handleSubmitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.productId || adjustForm.quantidade <= 0) {
      alert('Selecione um produto e informe uma quantidade válida.');
      return;
    }
    try {
      await api.addStockMovement({
        productId: adjustForm.productId,
        tipo: adjustForm.tipo,
        quantidade: Number(adjustForm.quantidade),
        documentoRef: 'Ajuste Manual',
        origemCanal: 'Auditoria Física',
        motivo: adjustForm.motivo || 'Ajuste de inventário'
      });
      playAttendanceChime();
      setIsAdjustModalOpen(false);
      await fetchStockData();
    } catch (err: any) {
      playUrgentAlert();
      alert('Erro ao realizar ajuste: ' + err.message);
    }
  };

  // Submeter Edição de Item
  const handleSubmitEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForEdit) return;
    try {
      await api.updateStockItem(selectedItemForEdit);
      playAttendanceChime();
      setIsEditItemModalOpen(false);
      await fetchStockData();
    } catch (err: any) {
      playUrgentAlert();
      alert('Erro ao salvar item: ' + err.message);
    }
  };

  // Filtrar itens
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      if (corFilter !== 'TODAS' && it.cor !== corFilter) return false;
      if (statusFilter !== 'TODOS' && it.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          it.nome.toLowerCase().includes(term) ||
          it.sku.toLowerCase().includes(term) ||
          it.categoria.toLowerCase().includes(term) ||
          it.localizacao.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [items, corFilter, statusFilter, searchTerm]);

  // Filtrar movimentações
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (movementTypeFilter !== 'TODOS' && m.tipo !== movementTypeFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          m.sku.toLowerCase().includes(term) ||
          (m.documentoRef && m.documentoRef.toLowerCase().includes(term)) ||
          (m.origemCanal && m.origemCanal.toLowerCase().includes(term)) ||
          (m.motivo && m.motivo.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [movements, movementTypeFilter, searchTerm]);

  // Cores personalizadas para gráficos
  const COLOR_PALETTE: Record<string, string> = {
    'Preto': '#3b82f6',
    'Marrom': '#d97706',
    'Incolor': '#06b6d4',
    'Kit Completo': '#a855f7',
    'Amarela/Preta': '#eab308',
    'Laranja/Azul': '#f97316',
    'Variada': '#64748b'
  };

  const getStatusBadge = (status: StockStatusLevel) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Em Estoque
          </span>
        );
      case 'BAIXO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Estoque Baixo
          </span>
        );
      case 'CRITICO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 animate-pulse shadow-sm">
            <AlertTriangle className="w-3 h-3" />
            Crítico / Reposição
          </span>
        );
      case 'ZERADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <AlertOctagon className="w-3 h-3 text-rose-500" />
            Esgotado
          </span>
        );
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('pt-BR').format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HERO BANNER DE CONTROLE DE ESTOQUE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/80 to-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold font-mono tracking-wider flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                CENTRAL DE ESTOQUE & INVENTÁRIO
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                ● Baixa Automática Ativada
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Controle Geral de Estoque <span className="text-cyan-400">SPM Store</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Monitoramento em tempo real do armazém físico. Cada pedido emitido (DANFE, Shopee, Mercado Livre, TikTok, WhatsApp) dá baixa imediata no saldo do respectivo produto.
            </p>
          </div>

          {/* Botões de Ações de Topo */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (items.length > 0) setEntryForm(prev => ({ ...prev, productId: items[0].id }));
                setIsEntryModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nova Entrada de Lote</span>
            </button>

            <button
              onClick={() => {
                if (items.length > 0) setAdjustForm(prev => ({ ...prev, productId: items[0].id }));
                setIsAdjustModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all flex items-center gap-2 hover:border-slate-600"
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Ajuste de Inventário</span>
            </button>

            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              title="Recalcular todas as saídas de estoque a partir de todas as notas fiscais do banco de dados"
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all flex items-center gap-1.5 hover:text-cyan-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRecalculating ? 'Recalculando...' : 'Sincronizar Vendas'}</span>
            </button>

            <a
              href="/api/stock/export-excel"
              download
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all flex items-center gap-1.5 hover:text-emerald-300"
              title="Baixar planilha Excel oficial de posição e histórico de estoque"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Exportar Excel</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. TOP KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total em Unidades */}
        <div className="bg-[#0f172a]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Estoque Físico</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatNumber(stats?.totalUnidadesEstoque || 0)} <span className="text-xs font-medium text-slate-400">un</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 mt-1 font-medium">
              <span>{stats?.totalItensCadastrados || 7} SKUs gerenciados</span>
            </div>
          </div>
        </div>

        {/* Card 2: Valor Patrimonial Custo */}
        <div className="bg-[#0f172a]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Patrimônio (Custo)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-400 font-mono tracking-tight">
              {formatCurrency(stats?.valorPatrimonialCusto || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
              <span>Investido em insumos/estoque</span>
            </div>
          </div>
        </div>

        {/* Card 3: Valor Potencial de Venda */}
        <div className="bg-[#0f172a]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Potencial Venda</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatCurrency(stats?.valorPotencialVenda || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400/90 mt-1 font-semibold">
              <span>Margem est.: ~{stats?.margemLucroBrutaEstimada || 58}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Giro Saídas 30 Dias */}
        <div className="bg-[#0f172a]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Giro 30 Dias (NFs)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-400 font-mono tracking-tight">
              {formatNumber(stats?.totalSaidas30Dias || 0)} <span className="text-xs font-medium text-slate-400">un</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-purple-300 mt-1">
              <span>~{stats?.giroDiarioMedio || 0} un/dia vendidas</span>
            </div>
          </div>
        </div>

        {/* Card 5: Alertas de Ruptura */}
        <div className={`bg-[#0f172a]/95 backdrop-blur-md p-4 rounded-2xl border shadow-lg relative overflow-hidden transition-all ${
          (stats?.itensStatus.critico || 0) > 0 || (stats?.itensStatus.baixo || 0) > 0
            ? 'border-amber-500/40 bg-gradient-to-br from-[#0f172a] to-amber-950/20'
            : 'border-slate-800/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Alertas Ruptura</span>
            <div className={`p-2 rounded-xl ${
              (stats?.itensStatus.critico || 0) > 0
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
              <span className={(stats?.itensStatus.critico || 0) > 0 ? 'text-rose-400' : 'text-slate-200'}>
                {(stats?.itensStatus.critico || 0) + (stats?.itensStatus.baixo || 0)}
              </span>
              <span className="text-xs font-normal text-slate-400">em alerta</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Autonomia geral: ~{stats?.diasCoberturaGeral || 90} dias</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. NAVEGAÇÃO INTERNA: ESTOQUE vs MOVIMENTAÇÕES vs ANÁLISE */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'inventory'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Inventário de Produtos & Saldos</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
              {filteredItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('movements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'movements'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Extrato de Movimentações (Ledger)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
              {movements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'analytics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Inteligência & Previsão de Demanda</span>
          </button>
        </div>

        {/* Barra de Busca e Filtros Rápidos */}
        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar SKU, produto, NF..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#020617] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
          </div>

          {activeSubTab === 'inventory' && (
            <select
              value={corFilter}
              onChange={e => setCorFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#020617] border border-slate-800 text-xs text-slate-300 font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="TODAS">Todas as Cores</option>
              <option value="Preto">Preto</option>
              <option value="Marrom">Marrom</option>
              <option value="Incolor">Incolor</option>
              <option value="Kit Completo">Kits</option>
            </select>
          )}

          {activeSubTab === 'inventory' && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#020617] border border-slate-800 text-xs text-slate-300 font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="NORMAL">Em Estoque</option>
              <option value="BAIXO">Estoque Baixo</option>
              <option value="CRITICO">Crítico</option>
              <option value="ZERADO">Esgotado</option>
            </select>
          )}

          {activeSubTab === 'movements' && (
            <select
              value={movementTypeFilter}
              onChange={e => setMovementTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#020617] border border-slate-800 text-xs text-slate-300 font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="SAIDA_VENDA">Saídas por Venda (NFs)</option>
              <option value="ENTRADA_COMPRA">Entradas de Compra</option>
              <option value="AJUSTE_POSITIVO">Ajuste Positivo (+)</option>
              <option value="AJUSTE_NEGATIVO">Ajuste Negativo (-)</option>
              <option value="PERDA_AVARIA">Perdas e Avarias</option>
            </select>
          )}
        </div>
      </div>

      {/* 4. VISÃO 1: TABELA DE PRODUTOS & INVENTÁRIO */}
      {activeSubTab === 'inventory' && (
        <div className="bg-[#0f172a]/95 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#020617] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Produto & SKU</th>
                  <th className="py-3.5 px-3">Variação / Cor</th>
                  <th className="py-3.5 px-4 text-center">Nível de Estoque</th>
                  <th className="py-3.5 px-3 text-right">Saldo Atual</th>
                  <th className="py-3.5 px-3 text-right">Mínimo</th>
                  <th className="py-3.5 px-3 text-right">Preço Venda</th>
                  <th className="py-3.5 px-3 text-right">Patrimônio</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-center">Dias Restantes</th>
                  <th className="py-3.5 px-4 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 font-mono text-xs">
                      Nenhum produto de estoque encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const percentLevel = item.estoqueInicial > 0 
                      ? Math.min(100, Math.round((item.estoqueAtual / item.estoqueInicial) * 100))
                      : 100;

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                        {/* SKU & Nome */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700 group-hover:border-cyan-500/50 transition-all shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">{item.nome}</div>
                              <div className="font-mono text-[10px] text-cyan-400/90 mt-0.5 flex items-center gap-1.5">
                                <span>{item.sku}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">{item.localizacao}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cor / Categoria */}
                        <td className="py-3.5 px-3">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium text-[11px]">
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: COLOR_PALETTE[item.cor] || '#64748b' }}
                            />
                            <span>{item.cor}</span>
                          </div>
                        </td>

                        {/* Barra Visual de Nível */}
                        <td className="py-3.5 px-4 w-44">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span>{percentLevel}% da capacidade</span>
                              <span>{item.totalSaidas} saídas</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  item.status === 'NORMAL' ? 'bg-gradient-to-r from-cyan-500 to-emerald-400' :
                                  item.status === 'BAIXO' ? 'bg-amber-400' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.max(5, percentLevel)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Saldo Atual */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-sm text-white">
                          {formatNumber(item.estoqueAtual)} <span className="text-[10px] text-slate-400 font-normal">{item.unidade}</span>
                        </td>

                        {/* Estoque Mínimo */}
                        <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                          {item.estoqueMinimo} un
                        </td>

                        {/* Preço de Venda */}
                        <td className="py-3.5 px-3 text-right font-mono text-slate-300 font-medium">
                          {formatCurrency(item.precoVenda)}
                        </td>

                        {/* Valor Patrimonial */}
                        <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-bold">
                          {formatCurrency(item.valorTotalEstoqueCusto)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          {getStatusBadge(item.status)}
                        </td>

                        {/* Dias Restantes */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="font-mono text-xs font-semibold text-slate-200">
                            ~{item.diasCobertura} dias
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {item.previsaoEsgotamento}
                          </div>
                        </td>

                        {/* Ações Rápidas */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEntryForm(prev => ({ ...prev, productId: item.id }));
                                setIsEntryModalOpen(true);
                              }}
                              title="Adicionar entrada rápida para este item"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all text-xs font-bold"
                            >
                              + Entrada
                            </button>

                            <button
                              onClick={() => {
                                setAdjustForm(prev => ({ ...prev, productId: item.id }));
                                setIsAdjustModalOpen(true);
                              }}
                              title="Ajuste manual de inventário"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-xs"
                            >
                              Ajuste
                            </button>

                            <button
                              onClick={() => {
                                setSelectedItemForEdit({ ...item });
                                setIsEditItemModalOpen(true);
                              }}
                              title="Editar configurações do produto (Preços, Mínimos, Local)"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. VISÃO 2: EXTRATO COMPLETO DE MOVIMENTAÇÕES (LEDGER) */}
      {activeSubTab === 'movements' && (
        <div className="bg-[#0f172a]/95 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-white text-sm">Livro-Razão & Histórico de Movimentações</h3>
              <p className="text-slate-400 text-xs mt-0.5">Todas as baixas de vendas das notas fiscais e entradas manuais registradas</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold bg-[#020617] px-3 py-1 rounded-xl border border-slate-800">
              Total: {filteredMovements.length} eventos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#020617] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Data e Hora</th>
                  <th className="py-3 px-3">Tipo Movimento</th>
                  <th className="py-3 px-3">SKU / Produto</th>
                  <th className="py-3 px-3 text-right">Qtd</th>
                  <th className="py-3 px-3 text-right">Saldo Anterior</th>
                  <th className="py-3 px-3 text-right">Saldo Posterior</th>
                  <th className="py-3 px-3">Documento / NF</th>
                  <th className="py-3 px-3">Origem / Canal</th>
                  <th className="py-3 px-4">Detalhes / Motivo</th>
                  <th className="py-3 px-3">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-500 text-xs">
                      Nenhuma movimentação registrada com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.slice(0, 100).map(mov => {
                    const isSaida = mov.tipo === 'SAIDA_VENDA' || mov.tipo === 'AJUSTE_NEGATIVO' || mov.tipo === 'PERDA_AVARIA';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Data */}
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap text-[11px]">
                          {new Date(mov.dataMovimentacao).toLocaleString('pt-BR')}
                        </td>

                        {/* Tipo */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {mov.tipo === 'SAIDA_VENDA' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <ArrowDownRight className="w-3 h-3" /> Saída (Venda NF)
                            </span>
                          )}
                          {mov.tipo === 'ENTRADA_COMPRA' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <ArrowUpRight className="w-3 h-3" /> Entrada Compra
                            </span>
                          )}
                          {mov.tipo === 'AJUSTE_POSITIVO' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                              <PlusCircle className="w-3 h-3" /> Ajuste (+)
                            </span>
                          )}
                          {mov.tipo === 'AJUSTE_NEGATIVO' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <TrendingDown className="w-3 h-3" /> Ajuste (-)
                            </span>
                          )}
                          {mov.tipo === 'PERDA_AVARIA' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
                              <AlertTriangle className="w-3 h-3" /> Perda / Avaria
                            </span>
                          )}
                          {mov.tipo === 'ESTORNO' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              <RotateCw className="w-3 h-3" /> Estorno
                            </span>
                          )}
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3 font-bold text-slate-200">
                          {mov.sku}
                        </td>

                        {/* Quantidade */}
                        <td className={`py-3 px-3 text-right font-bold text-xs ${isSaida ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isSaida ? `-${mov.quantidade}` : `+${mov.quantidade}`}
                        </td>

                        {/* Saldos */}
                        <td className="py-3 px-3 text-right text-slate-400">
                          {mov.saldoAnterior}
                        </td>
                        <td className="py-3 px-3 text-right text-white font-bold">
                          {mov.saldoPosterior}
                        </td>

                        {/* Documento */}
                        <td className="py-3 px-3 text-cyan-400">
                          {mov.documentoRef || 'N/A'}
                        </td>

                        {/* Origem / Canal */}
                        <td className="py-3 px-3 text-slate-300">
                          {mov.origemCanal || 'Balcão / Geral'}
                        </td>

                        {/* Detalhes */}
                        <td className="py-3 px-4 font-sans text-slate-300 text-[11px] max-w-xs truncate" title={mov.motivo}>
                          {mov.motivo || '-'}
                        </td>

                        {/* Responsável */}
                        <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                          {mov.usuarioNome}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. VISÃO 3: INTELIGÊNCIA & GRÁFICOS ANALÍTICOS DE ESTOQUE */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gráfico 1: Evolução Diária de Saídas */}
            <div className="bg-[#0f172a]/95 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    Consumo & Saídas Recentes (Unidades Baixadas)
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Volume de unidades deduzidas por dia de venda</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#020617] text-cyan-400 border border-slate-800 text-[11px] font-mono font-bold">
                  Últimos Dias
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.evolucaoSaidas || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStockSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <XAxis dataKey="data" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any) => [`${val} unidades`, 'Total Baixado']}
                    />
                    <Area type="monotone" dataKey="quantidade" stroke="#f43f5e" strokeWidth={2.5} fill="url(#colorStockSaidas)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Distribuição do Estoque por Cor */}
            <div className="bg-[#0f172a]/95 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-cyan-400" />
                    Distribuição do Estoque Físico por Variação
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Saldo disponível em galpão por cor e categoria</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <XAxis dataKey="sku" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any) => [`${val} un`, 'Estoque Atual']}
                    />
                    <Bar dataKey="estoqueAtual" radius={[6, 6, 0, 0]}>
                      {items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLOR_PALETTE[entry.cor] || '#06b6d4'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Ranking Top Produtos Mais Vendidos */}
          <div className="bg-[#0f172a]/95 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-extrabold text-white text-sm mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              Ranking de Saídas & Faturamento por SKU
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats?.topVendidos.map((prod, idx) => (
                <div key={prod.sku} className="p-4 rounded-xl bg-[#020617] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                      #{idx + 1} {prod.sku}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 font-mono">
                      {formatCurrency(prod.faturamento)}
                    </span>
                  </div>
                  <div className="font-semibold text-white text-xs truncate" title={prod.nome}>
                    {prod.nome}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                    <span>{formatNumber(prod.totalVendido)} unidades baixadas</span>
                    <span>{prod.participacaoPercent}% share</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: NOVA ENTRADA DE LOTE / COMPRA */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Nova Entrada de Estoque</h3>
                  <p className="text-xs text-slate-400">Registrar lote de compra ou produção física</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEntryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Produto / SKU</label>
                <select
                  value={entryForm.productId}
                  onChange={e => {
                    const found = items.find(it => it.id === e.target.value);
                    setEntryForm(prev => ({
                      ...prev,
                      productId: e.target.value,
                      precoCusto: found ? found.precoCusto : prev.precoCusto
                    }));
                  }}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {items.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.sku} - {it.nome} (Atual: {it.estoqueAtual} un)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quantidade de Entrada (un)</label>
                  <input
                    type="number"
                    min="1"
                    value={entryForm.quantidade}
                    onChange={e => setEntryForm(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={entryForm.precoCusto}
                    onChange={e => setEntryForm(prev => ({ ...prev, precoCusto: Number(e.target.value) }))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fornecedor / Origem</label>
                  <input
                    type="text"
                    value={entryForm.fornecedor}
                    onChange={e => setEntryForm(prev => ({ ...prev, fornecedor: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Documento / Nota Fornecedor</label>
                  <input
                    type="text"
                    placeholder="Ex: NF 123456"
                    value={entryForm.documentoRef}
                    onChange={e => setEntryForm(prev => ({ ...prev, documentoRef: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Motivo / Observação</label>
                <input
                  type="text"
                  value={entryForm.motivo}
                  onChange={e => setEntryForm(prev => ({ ...prev, motivo: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  Salvar Entrada de Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: AJUSTE DE INVENTÁRIO */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Ajuste de Inventário</h3>
                  <p className="text-xs text-slate-400">Correção física ou registro de perdas</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdjust} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Produto / SKU</label>
                <select
                  value={adjustForm.productId}
                  onChange={e => setAdjustForm(prev => ({ ...prev, productId: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {items.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.sku} - {it.nome} (Atual: {it.estoqueAtual} un)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Ajuste</label>
                <select
                  value={adjustForm.tipo}
                  onChange={e => setAdjustForm(prev => ({ ...prev, tipo: e.target.value as any }))}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="AJUSTE_POSITIVO">Ajuste Positivo (+) Adicionar Saldo</option>
                  <option value="AJUSTE_NEGATIVO">Ajuste Negativo (-) Subtrair Saldo</option>
                  <option value="PERDA_AVARIA">Perda / Avaria de Frasco (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={adjustForm.quantidade}
                  onChange={e => setAdjustForm(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Motivo / Justificativa</label>
                <input
                  type="text"
                  placeholder="Ex: Contagem física quinzenal"
                  value={adjustForm.motivo}
                  onChange={e => setAdjustForm(prev => ({ ...prev, motivo: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: EDIÇÃO DE CONFIGURAÇÕES DE PRODUTO */}
      {isEditItemModalOpen && selectedItemForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Editar Parâmetros do SKU</h3>
                <p className="text-xs text-cyan-400 font-mono">{selectedItemForEdit.sku}</p>
              </div>
              <button 
                onClick={() => setIsEditItemModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEditItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome de Exibição</label>
                <input
                  type="text"
                  value={selectedItemForEdit.nome}
                  onChange={e => setSelectedItemForEdit({ ...selectedItemForEdit, nome: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estoque Mínimo (Alerta)</label>
                  <input
                    type="number"
                    value={selectedItemForEdit.estoqueMinimo}
                    onChange={e => setSelectedItemForEdit({ ...selectedItemForEdit, estoqueMinimo: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estoque de Segurança (Crítico)</label>
                  <input
                    type="number"
                    value={selectedItemForEdit.estoqueSeguranca}
                    onChange={e => setSelectedItemForEdit({ ...selectedItemForEdit, estoqueSeguranca: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedItemForEdit.precoCusto}
                    onChange={e => setSelectedItemForEdit({ ...selectedItemForEdit, precoCusto: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preço de Venda Padrão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedItemForEdit.precoVenda}
                    onChange={e => setSelectedItemForEdit({ ...selectedItemForEdit, precoVenda: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Localização no Armazém</label>
                <input
                  type="text"
                  value={selectedItemForEdit.localizacao}
                  onChange={e => setSelectedItemForEdit({ ...selectedItemForEdit, localizacao: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020617] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

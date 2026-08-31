import React, { useState, useRef, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square, 
  FileSpreadsheet, 
  X, 
  Plus, 
  AlertTriangle, 
  Check, 
  Filter, 
  Eye, 
  ShoppingBag, 
  Tag, 
  MapPin, 
  Sparkles, 
  DollarSign, 
  Download, 
  RotateCcw,
  UploadCloud,
  FileCheck,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  Barcode
} from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../lib/api';
import { playAttendanceChime, playUrgentAlert } from '../utils/audioAlert';

interface DatabaseViewProps {
  invoices: Invoice[];
  onRefreshData: () => void;
  userRole?: string;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ invoices, onRefreshData, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [origemFilter, setOrigemFilter] = useState('Todas');
  const [corFilter, setCorFilter] = useState('Todas');
  const [ufFilter, setUfFilter] = useState('Todos');
  const [skuFilter, setSkuFilter] = useState('Todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingDanfeInvoice, setViewingDanfeInvoice] = useState<Invoice | null>(null);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Bulk Edit State (Edição em Lote)
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkTargetIds, setBulkTargetIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);
  const [bulkEditForm, setBulkEditForm] = useState<{
    cor: string;
    origem: string;
    quantidade: string;
    codigo: string;
    descricao: string;
    status: string;
  }>({
    cor: 'MANTER',
    origem: 'MANTER',
    quantidade: 'MANTER',
    codigo: 'MANTER',
    descricao: 'MANTER',
    status: 'MANTER'
  });

  // Import Excel State
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    totalRows: number;
    updatedCount: number;
    insertedCount: number;
    message: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // New Invoice Form State (17 campos)
  const [newInv, setNewInv] = useState<Partial<Invoice>>({
    nome: '',
    documento: '',
    dataSaida: new Date().toLocaleDateString('pt-BR'),
    endereco: '',
    bairro: '',
    cep: '',
    municipio: 'São Paulo',
    uf: 'SP',
    fatura: '',
    valorProdutos: '0,00',
    valorNota: '0,00',
    desconto: '0,00',
    codigo: 'SPM-Shopee-Preto-1',
    quantidade: '1',
    descricao: '',
    cor: 'Preto',
    origem: 'Shopee',
    status: 'Processado'
  });

  // Lista dinâmica de SKUs únicos presentes nas notas
  const uniqueSkus = useMemo(() => {
    const skus = new Set<string>();
    invoices.forEach(inv => {
      if (inv.codigo && inv.codigo.trim()) {
        skus.add(inv.codigo.trim());
      }
    });
    return Array.from(skus).sort();
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (inv.nome || '').toLowerCase().includes(term) ||
        (inv.documento || '').includes(term) ||
        (inv.codigo || '').toLowerCase().includes(term) ||
        (inv.descricao || '').toLowerCase().includes(term) ||
        (inv.municipio || '').toLowerCase().includes(term) ||
        (inv.fatura || '').includes(term);
      
      const matchesOrigem = origemFilter === 'Todas' || inv.origem === origemFilter;
      const matchesCor = corFilter === 'Todas' || (inv.cor || '').toLowerCase() === corFilter.toLowerCase();
      const matchesUf = ufFilter === 'Todos' || inv.uf === ufFilter;
      const matchesSku = skuFilter === 'Todos' || (inv.codigo || '').trim().toLowerCase() === skuFilter.trim().toLowerCase();

      return matchesSearch && matchesOrigem && matchesCor && matchesUf && matchesSku;
    });
  }, [invoices, searchTerm, origemFilter, corFilter, ufFilter, skuFilter]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map(i => i.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta nota fiscal do Banco de Dados?')) {
      await api.deleteInvoice(id);
      onRefreshData();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} notas selecionadas?`)) {
      await api.bulkDeleteInvoices(selectedIds);
      setSelectedIds([]);
      onRefreshData();
    }
  };

  const handleOpenBulkEditSelected = () => {
    if (selectedIds.length === 0) return;
    setBulkTargetIds(selectedIds);
    setBulkEditForm({
      cor: 'MANTER',
      origem: 'MANTER',
      quantidade: 'MANTER',
      codigo: 'MANTER',
      descricao: 'MANTER',
      status: 'MANTER'
    });
    setIsBulkEditModalOpen(true);
  };

  const handleOpenBulkEditFiltered = () => {
    if (filteredInvoices.length === 0) return;
    setBulkTargetIds(filteredInvoices.map(i => i.id));
    setBulkEditForm({
      cor: 'MANTER',
      origem: 'MANTER',
      quantidade: 'MANTER',
      codigo: 'MANTER',
      descricao: 'MANTER',
      status: 'MANTER'
    });
    setIsBulkEditModalOpen(true);
  };

  const handleApplyBulkEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkTargetIds.length === 0) return;

    try {
      setIsBulkUpdating(true);
      const updates: Partial<Invoice> = {};

      if (bulkEditForm.cor !== 'MANTER') updates.cor = bulkEditForm.cor;
      if (bulkEditForm.origem !== 'MANTER') updates.origem = bulkEditForm.origem;
      if (bulkEditForm.quantidade !== 'MANTER') updates.quantidade = bulkEditForm.quantidade;
      if (bulkEditForm.codigo !== 'MANTER' && bulkEditForm.codigo.trim() !== '') updates.codigo = bulkEditForm.codigo.trim();
      if (bulkEditForm.descricao !== 'MANTER' && bulkEditForm.descricao.trim() !== '') updates.descricao = bulkEditForm.descricao.trim();
      if (bulkEditForm.status !== 'MANTER') updates.status = bulkEditForm.status;

      const res = await api.bulkUpdateInvoices(bulkTargetIds, updates);
      setIsBulkEditModalOpen(false);
      setBulkSuccessMsg(res.message || `${res.updatedCount} notas fiscais atualizadas em lote com sucesso!`);
      setTimeout(() => setBulkSuccessMsg(null), 6000);
      setSelectedIds([]);
      onRefreshData();
      playAttendanceChime();
    } catch (err: any) {
      alert(err.message || 'Erro ao aplicar edição em lote.');
      playUrgentAlert();
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleResetDatabase = async () => {
    try {
      setIsResetting(true);
      const res = await api.resetDatabase();
      setSelectedIds([]);
      setIsResetModalOpen(false);
      setResetSuccessMsg(`Banco de Dados zerado com sucesso! ${res.removedCount} registro(s) removidos.`);
      setTimeout(() => setResetSuccessMsg(null), 6000);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao zerar o banco de dados');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveEditedInvoice = async () => {
    if (!editingInvoice) return;
    await api.updateInvoice(editingInvoice.id, editingInvoice);
    setEditingInvoice(null);
    onRefreshData();
  };

  const handleCreateNewInvoice = async () => {
    if (!newInv.nome || !newInv.descricao) {
      alert('Por favor, informe ao menos o Nome/Razão Social e a Descrição do Item.');
      return;
    }
    await api.createInvoice(newInv);
    setIsNewInvoiceModalOpen(false);
    onRefreshData();
  };

  const handleImportExcelFile = async () => {
    if (!importFile) {
      alert('Por favor, selecione um arquivo de planilha Excel (.xlsx).');
      return;
    }
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await api.importExcelInvoices(importFile);
      setImportResult(res);
      playAttendanceChime();
      onRefreshData();
    } catch (err: any) {
      setImportError(err.message || 'Erro ao importar planilha Excel.');
      playUrgentAlert();
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3 h-3" /> MySQL SPM Fiscal
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
              17 Colunas Rigorosas
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Base de Dados & Registros Fiscais
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Persistência no banco <code className="text-cyan-400 font-mono">spm_fiscal</code> (XAMPP) com sincronização em <code className="text-cyan-400 font-mono">database_spm_fiscal.sql</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Exportar Excel */}
          <a
            href="/api/export/excel"
            download="Auditoria_Faturamento_SPM.xlsx"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 border border-emerald-400/30"
            title="Baixar planilha com todas as notas e colunas fiscais"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </a>

          {/* Botão Importar & Atualizar Excel */}
          {userRole !== 'AUDITOR' && (
            <button
              onClick={() => {
                setImportFile(null);
                setImportResult(null);
                setImportError(null);
                setIsImportExcelModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/20 border border-blue-400/30"
              title="Importar planilha Excel para atualizar cor, quantidade e dados em lote"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar & Atualizar Excel</span>
            </button>
          )}

          {userRole !== 'AUDITOR' && (
            <>
              <button
                onClick={() => setIsNewInvoiceModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/20 border border-cyan-400/30"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Nota</span>
              </button>

              <button
                onClick={() => setIsResetModalOpen(true)}
                disabled={invoices.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition disabled:opacity-50"
                title="Zerar todo o Banco de Dados"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Zerar Banco</span>
              </button>
            </>
          )}
        </div>
      </div>

      {resetSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{resetSuccessMsg}</span>
          </div>
          <button onClick={() => setResetSuccessMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {bulkSuccessMsg && (
        <div className="p-4 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold">{bulkSuccessMsg}</span>
          </div>
          <button onClick={() => setBulkSuccessMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, SKU, descrição, fatura..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Marketplace Filter */}
            <select
              value={origemFilter}
              onChange={e => setOrigemFilter(e.target.value)}
              className="bg-[#020617] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
            >
              <option value="Todas">Todos os Marketplaces</option>
              <option value="Shopee">Shopee</option>
              <option value="Mercado Livre">Mercado Livre</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="TikTok">TikTok</option>
              <option value="Outros">Outros</option>
            </select>

            {/* Cor Filter */}
            <select
              value={corFilter}
              onChange={e => setCorFilter(e.target.value)}
              className="bg-[#020617] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
            >
              <option value="Todas">Todas as Cores</option>
              <option value="Preto">Preto</option>
              <option value="Marrom">Marrom</option>
              <option value="Incolor">Incolor</option>
              <option value="Não identificada">Não identificada</option>
            </select>

            {/* UF Filter */}
            <select
              value={ufFilter}
              onChange={e => setUfFilter(e.target.value)}
              className="bg-[#020617] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
            >
              <option value="Todos">Todos UFs</option>
              {['SP', 'RJ', 'PR', 'MG', 'RS', 'SC', 'BA', 'PE', 'CE', 'DF', 'GO', 'ES', 'MT', 'MS'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* SKU Filter */}
            <div className="flex items-center gap-1 bg-[#020617] border border-slate-800 rounded-xl px-2 py-1 shadow-inner">
              <Barcode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={skuFilter}
                onChange={e => setSkuFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs outline-none focus:text-cyan-300 font-mono font-bold max-w-[170px] truncate cursor-pointer"
                title="Filtrar notas pelo Código SKU do produto"
              >
                <option value="Todos" className="bg-slate-900 text-slate-200">Todos os SKUs ({uniqueSkus.length})</option>
                {uniqueSkus.map(sku => (
                  <option key={sku} value={sku} className="bg-slate-900 text-slate-200">{sku}</option>
                ))}
              </select>
            </div>

            {/* Botão para Editar Todos os Filtrados */}
            {userRole !== 'AUDITOR' && filteredInvoices.length > 0 && (
              <button
                onClick={handleOpenBulkEditFiltered}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 text-xs font-bold transition shadow-sm"
                title={`Editar em lote todos os ${filteredInvoices.length} registros que atendem ao filtro atual`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                <span>Editar {filteredInvoices.length} Filtrados</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra Flutuante de Seleção Múltipla */}
        {selectedIds.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>{selectedIds.length} nota(s) selecionada(s) de {filteredInvoices.length} visíveis</span>
            </div>

            <div className="flex items-center gap-2">
              {userRole !== 'AUDITOR' && (
                <button
                  onClick={handleOpenBulkEditSelected}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-md shadow-cyan-600/25"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Editar Selecionados ({selectedIds.length})</span>
                </button>
              )}

              {userRole !== 'AUDITOR' && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-bold transition shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir ({selectedIds.length})</span>
                </button>
              )}

              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs transition border border-slate-700"
              >
                Desmarcar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Invoices Table (17 Campos) */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#020617] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-cyan-400">
                    {selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">NF / FATURA</th>
                <th className="p-3.5">NOME / CLIENTE</th>
                <th className="p-3.5">CPF / CNPJ</th>
                <th className="p-3.5">DATA NF-e</th>
                <th className="p-3.5">CIDADE / UF</th>
                <th className="p-3.5">CÓDIGO (SKU)</th>
                <th className="p-3.5 text-center">QTD</th>
                <th className="p-3.5">DESCRIÇÃO</th>
                <th className="p-3.5">COR</th>
                <th className="p-3.5">MARKETPLACE</th>
                <th className="p-3.5 text-right">PRODUTOS</th>
                <th className="p-3.5 text-right">DESCONTO</th>
                <th className="p-3.5 text-right">VALOR FINAL</th>
                <th className="p-3.5 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={18} className="p-10 text-center text-slate-500 font-mono text-xs">
                    Nenhuma nota fiscal encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSelected = selectedIds.includes(inv.id);
                  return (
                    <tr 
                      key={inv.id} 
                      className={`hover:bg-slate-800/40 transition ${isSelected ? 'bg-cyan-950/20' : ''}`}
                    >
                      <td className="p-3.5 text-center">
                        <button onClick={() => handleToggleSelect(inv.id)} className="text-slate-400 hover:text-cyan-400">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-cyan-400">
                        #{inv.fatura || inv.id}
                      </td>
                      <td className="p-3.5 font-bold text-white max-w-[180px] truncate">{inv.nome}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">{inv.documento}</td>
                      <td className="p-3.5 font-mono text-slate-400">{inv.dataSaida}</td>
                      <td className="p-3.5 text-slate-300 font-medium">{inv.municipio} - {inv.uf}</td>
                      
                      <td className="p-3.5 font-mono text-slate-300 font-semibold">{inv.codigo}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-white">{inv.quantidade}</td>
                      <td className="p-3.5 text-slate-300 max-w-[180px] truncate" title={inv.descricao}>{inv.descricao}</td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          inv.cor.toLowerCase() === 'preto' ? 'bg-slate-950 text-white border-slate-700' :
                          inv.cor.toLowerCase() === 'marrom' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                          inv.cor.toLowerCase() === 'incolor' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {inv.cor}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          {inv.origem}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-400">R$ {inv.valorProdutos}</td>
                      <td className="p-3.5 text-right font-mono text-rose-400">R$ {inv.desconto}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400">R$ {inv.valorNota}</td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingDanfeInvoice(inv)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition"
                            title="Ver Espelho DANFE"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {userRole !== 'AUDITOR' && (
                            <>
                              <button
                                onClick={() => setEditingInvoice(inv)}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
                                title="Editar Nota Fiscal"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                                title="Excluir Nota Fiscal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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

      {/* DANFE Mirror Modal */}
      {viewingDanfeInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-cyan-500/40 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Database className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-white text-base">Espelho DANFE NF #{viewingDanfeInvoice.fatura || viewingDanfeInvoice.id}</h3>
              </div>
              <button onClick={() => setViewingDanfeInvoice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#020617] p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block">Destinatário:</span>
                  <span className="font-bold text-white">{viewingDanfeInvoice.nome}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block">CPF / CNPJ:</span>
                  <span className="font-mono text-cyan-400">{viewingDanfeInvoice.documento}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block">Data Emissão:</span>
                  <span className="font-mono text-slate-300">{viewingDanfeInvoice.dataSaida}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-800">
                <div className="col-span-2">
                  <span className="text-slate-500 uppercase text-[10px] block">Endereço Completo:</span>
                  <span className="text-slate-200">{viewingDanfeInvoice.endereco} - {viewingDanfeInvoice.bairro}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block">CEP & Cidade:</span>
                  <span className="text-slate-200">{viewingDanfeInvoice.cep} | {viewingDanfeInvoice.municipio}/{viewingDanfeInvoice.uf}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block">SKU / Código:</span>
                  <span className="font-mono font-bold text-slate-200">{viewingDanfeInvoice.codigo}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block">Cor:</span>
                  <span className="font-bold text-amber-300">{viewingDanfeInvoice.cor}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block">Canal:</span>
                  <span className="font-bold text-cyan-300">{viewingDanfeInvoice.origem}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block">Valor Total:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">R$ {viewingDanfeInvoice.valorNota}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingDanfeInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal (17 campos) */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-cyan-500/40 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Editar Registro Fiscal #{editingInvoice.id}</h3>
              <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">NOME / Razão Social</label>
                <input
                  type="text"
                  value={editingInvoice.nome}
                  onChange={e => setEditingInvoice({ ...editingInvoice, nome: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  value={editingInvoice.documento}
                  onChange={e => setEditingInvoice({ ...editingInvoice, documento: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DATA NF-e</label>
                <input
                  type="text"
                  value={editingInvoice.dataSaida}
                  onChange={e => setEditingInvoice({ ...editingInvoice, dataSaida: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">FATURA</label>
                <input
                  type="text"
                  value={editingInvoice.fatura}
                  onChange={e => setEditingInvoice({ ...editingInvoice, fatura: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">MARKETPLACE</label>
                <select
                  value={editingInvoice.origem}
                  onChange={e => setEditingInvoice({ ...editingInvoice, origem: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Shopee">Shopee</option>
                  <option value="Mercado Livre">Mercado Livre</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">ENDEREÇO</label>
                <input
                  type="text"
                  value={editingInvoice.endereco}
                  onChange={e => setEditingInvoice({ ...editingInvoice, endereco: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">BAIRRO</label>
                <input
                  type="text"
                  value={editingInvoice.bairro}
                  onChange={e => setEditingInvoice({ ...editingInvoice, bairro: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CEP</label>
                <input
                  type="text"
                  value={editingInvoice.cep}
                  onChange={e => setEditingInvoice({ ...editingInvoice, cep: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CIDADE</label>
                <input
                  type="text"
                  value={editingInvoice.municipio}
                  onChange={e => setEditingInvoice({ ...editingInvoice, municipio: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">UF</label>
                <input
                  type="text"
                  value={editingInvoice.uf}
                  onChange={e => setEditingInvoice({ ...editingInvoice, uf: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CÓDIGO (SKU)</label>
                <input
                  type="text"
                  value={editingInvoice.codigo}
                  onChange={e => setEditingInvoice({ ...editingInvoice, codigo: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">QUANTIDADE</label>
                <input
                  type="text"
                  value={editingInvoice.quantidade}
                  onChange={e => setEditingInvoice({ ...editingInvoice, quantidade: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">COR</label>
                <select
                  value={editingInvoice.cor}
                  onChange={e => setEditingInvoice({ ...editingInvoice, cor: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Preto">Preto</option>
                  <option value="Marrom">Marrom</option>
                  <option value="Incolor">Incolor</option>
                  <option value="Não identificada">Não identificada</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-400 mb-1">DESCRIÇÃO DO PRODUTO</label>
                <input
                  type="text"
                  value={editingInvoice.descricao}
                  onChange={e => setEditingInvoice({ ...editingInvoice, descricao: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">VALOR PRODUTOS</label>
                <input
                  type="text"
                  value={editingInvoice.valorProdutos}
                  onChange={e => setEditingInvoice({ ...editingInvoice, valorProdutos: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DESCONTO</label>
                <input
                  type="text"
                  value={editingInvoice.desconto}
                  onChange={e => setEditingInvoice({ ...editingInvoice, desconto: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">VALOR FINAL</label>
                <input
                  type="text"
                  value={editingInvoice.valorNota}
                  onChange={e => setEditingInvoice({ ...editingInvoice, valorNota: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-emerald-400 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setEditingInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 border border-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedInvoice}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-600/30"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-cyan-500/40 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Cadastrar Nova Nota Fiscal (17 Campos)</h3>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">NOME / Razão Social</label>
                <input
                  type="text"
                  placeholder="Ex: Comercial Silva Ltda"
                  value={newInv.nome}
                  onChange={e => setNewInv({ ...newInv, nome: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={newInv.documento}
                  onChange={e => setNewInv({ ...newInv, documento: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DATA NF-e</label>
                <input
                  type="text"
                  value={newInv.dataSaida}
                  onChange={e => setNewInv({ ...newInv, dataSaida: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">FATURA</label>
                <input
                  type="text"
                  placeholder="Ex: 27821"
                  value={newInv.fatura}
                  onChange={e => setNewInv({ ...newInv, fatura: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">MARKETPLACE</label>
                <select
                  value={newInv.origem}
                  onChange={e => setNewInv({ ...newInv, origem: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Shopee">Shopee</option>
                  <option value="Mercado Livre">Mercado Livre</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">ENDEREÇO</label>
                <input
                  type="text"
                  placeholder="Ex: Rua das Palmeiras, 150"
                  value={newInv.endereco}
                  onChange={e => setNewInv({ ...newInv, endereco: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">BAIRRO</label>
                <input
                  type="text"
                  placeholder="Ex: Centro"
                  value={newInv.bairro}
                  onChange={e => setNewInv({ ...newInv, bairro: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CEP</label>
                <input
                  type="text"
                  placeholder="00000-000"
                  value={newInv.cep}
                  onChange={e => setNewInv({ ...newInv, cep: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CIDADE</label>
                <input
                  type="text"
                  value={newInv.municipio}
                  onChange={e => setNewInv({ ...newInv, municipio: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">UF</label>
                <input
                  type="text"
                  value={newInv.uf}
                  onChange={e => setNewInv({ ...newInv, uf: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CÓDIGO (SKU)</label>
                <input
                  type="text"
                  value={newInv.codigo}
                  onChange={e => setNewInv({ ...newInv, codigo: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">QUANTIDADE</label>
                <input
                  type="text"
                  value={newInv.quantidade}
                  onChange={e => setNewInv({ ...newInv, quantidade: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">COR</label>
                <select
                  value={newInv.cor}
                  onChange={e => setNewInv({ ...newInv, cor: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Preto">Preto</option>
                  <option value="Marrom">Marrom</option>
                  <option value="Incolor">Incolor</option>
                  <option value="Não identificada">Não identificada</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-400 mb-1">DESCRIÇÃO DO PRODUTO</label>
                <input
                  type="text"
                  placeholder="Ex: Verniz Especial Pro - Cor: Preto"
                  value={newInv.descricao}
                  onChange={e => setNewInv({ ...newInv, descricao: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">VALOR PRODUTOS</label>
                <input
                  type="text"
                  placeholder="289,80"
                  value={newInv.valorProdutos}
                  onChange={e => setNewInv({ ...newInv, valorProdutos: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DESCONTO</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={newInv.desconto}
                  onChange={e => setNewInv({ ...newInv, desconto: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">VALOR FINAL</label>
                <input
                  type="text"
                  placeholder="289,80"
                  value={newInv.valorNota}
                  onChange={e => setNewInv({ ...newInv, valorNota: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-emerald-400 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 border border-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewInvoice}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-600/30"
              >
                Cadastrar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Zerar Banco de Dados */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Zerar Banco de Dados</h3>
                  <p className="text-xs text-slate-400">Limpeza total de registros fiscais</p>
                </div>
              </div>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="font-medium text-slate-200">
                Tem certeza que deseja <strong className="text-rose-400">ZERAR totalmente o Banco de Dados MySQL</strong>?
              </p>
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>⚠️ Consequências desta ação:</span>
                </p>
                <p>• Todos os <strong>{invoices.length}</strong> registros de notas fiscais serão removidos do MySQL.</p>
                <p>• O arquivo de backup <code className="text-cyan-300 font-mono">database_spm_fiscal.sql</code> será resetado.</p>
                <p>• Os indicadores do Dashboard e Auditoria serão zerados.</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 border border-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isResetting ? 'Zerando Banco...' : 'Sim, Zerar Banco de Dados'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação e Atualização de Planilha Excel (.xlsx) */}
      {isImportExcelModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-blue-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Importar Planilha Excel (.xlsx)</h3>
                  <p className="text-xs text-slate-400">Atualização automática e em lote dos registros fiscais</p>
                </div>
              </div>
              <button 
                onClick={() => setIsImportExcelModalOpen(false)} 
                disabled={isImporting}
                className="text-slate-400 hover:text-white disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-1.5 text-blue-200 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 text-blue-300">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Como funciona a sincronização inteligente?</span>
                </p>
                <p>
                  • <strong>Itens já cadastrados:</strong> O sistema identifica a nota fiscal (pela Fatura, CPF/CNPJ ou SKU) e <strong>atualiza a Cor, Quantidade, Descrição, Valores e Endereço</strong> com as informações da planilha.
                </p>
                <p>
                  • <strong>Novos itens:</strong> Se a planilha contiver novas notas fiscais, elas serão adicionadas automaticamente ao banco de dados e ao mapa.
                </p>
              </div>

              {/* Upload Dropzone */}
              <input
                ref={excelFileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setImportFile(e.target.files[0]);
                    setImportResult(null);
                    setImportError(null);
                  }
                }}
              />

              <div
                onClick={() => excelFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  importFile
                    ? 'border-blue-500/60 bg-blue-500/10'
                    : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/40'
                }`}
              >
                {importFile ? (
                  <>
                    <div className="p-3 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-white text-sm mt-1">{importFile.name}</p>
                    <p className="text-slate-400 text-[11px]">
                      Tamanho: {(importFile.size / 1024).toFixed(1)} KB • Clique para trocar de arquivo
                    </p>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-slate-800 text-blue-400 rounded-full border border-slate-700">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-white text-sm mt-1">
                      Clique aqui para selecionar a planilha Excel (.xlsx)
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Formatos aceitos: .xlsx, .xls ou .csv exportados do sistema
                    </p>
                  </>
                )}
              </div>

              {/* Erro */}
              {importError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Resultado Sucesso */}
              {importResult && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{importResult.message}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Lidos</p>
                      <p className="text-base font-black text-white">{importResult.totalRows}</p>
                    </div>
                    <div className="bg-blue-950/40 p-2.5 rounded-lg border border-blue-500/30 text-center">
                      <p className="text-[10px] text-blue-300 font-bold uppercase">Atualizados</p>
                      <p className="text-base font-black text-blue-400">{importResult.updatedCount}</p>
                    </div>
                    <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 text-center">
                      <p className="text-[10px] text-emerald-300 font-bold uppercase">Novos Inseridos</p>
                      <p className="text-base font-black text-emerald-400">{importResult.insertedCount}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setIsImportExcelModalOpen(false)}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 border border-slate-700 disabled:opacity-50"
              >
                {importResult ? 'Concluir' : 'Cancelar'}
              </button>

              {!importResult && (
                <button
                  onClick={handleImportExcelFile}
                  disabled={!importFile || isImporting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                  <span>{isImporting ? 'Processando Planilha...' : 'Atualizar Base de Dados'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição em Lote (Bulk Edit) */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-white text-base sm:text-lg">
                    Edição em Lote de Notas Fiscais
                  </h3>
                  <p className="text-xs text-purple-300 font-mono mt-0.5">
                    {bulkTargetIds.length} nota(s) fiscal(is) selecionada(s) para atualização
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-xl text-purple-200 text-xs leading-relaxed">
              💡 <strong>Dica de uso:</strong> Apenas os campos alterados serão aplicados às <strong>{bulkTargetIds.length} notas selecionadas</strong>. Os campos deixados como <em>"Manter valor atual"</em> serão preservados.
            </div>

            <form onSubmit={handleApplyBulkEdit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Cor do Verniz */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cor do Verniz:</span>
                  </label>
                  <select
                    value={bulkEditForm.cor}
                    onChange={e => setBulkEditForm(prev => ({ ...prev, cor: e.target.value }))}
                    className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl p-2.5 text-xs outline-none focus:border-cyan-500 font-semibold"
                  >
                    <option value="MANTER">-- Manter cor atual das notas --</option>
                    <option value="Preto">🖤 Verniz Preto</option>
                    <option value="Marrom">🤎 Verniz Marrom</option>
                    <option value="Incolor">💎 Verniz Incolor</option>
                    <option value="Não identificada">⚠️ Não identificada</option>
                  </select>
                </div>

                {/* Marketplace / Origem */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Marketplace / Canal de Venda:</span>
                  </label>
                  <select
                    value={bulkEditForm.origem}
                    onChange={e => setBulkEditForm(prev => ({ ...prev, origem: e.target.value }))}
                    className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl p-2.5 text-xs outline-none focus:border-cyan-500 font-semibold"
                  >
                    <option value="MANTER">-- Manter marketplace atual --</option>
                    <option value="Shopee">🟠 Shopee</option>
                    <option value="Mercado Livre">🟡 Mercado Livre</option>
                    <option value="TikTok">💖 TikTok</option>
                    <option value="WhatsApp">🟢 WhatsApp</option>
                    <option value="Outros">🔵 Outros</option>
                  </select>
                </div>

                {/* Quantidade */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quantidade de Verniz:</span>
                  </label>
                  <select
                    value={bulkEditForm.quantidade}
                    onChange={e => setBulkEditForm(prev => ({ ...prev, quantidade: e.target.value }))}
                    className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl p-2.5 text-xs outline-none focus:border-cyan-500 font-semibold"
                  >
                    <option value="MANTER">-- Manter quantidade atual --</option>
                    <option value="1">1 unidade</option>
                    <option value="2">2 unidades</option>
                    <option value="3">3 unidades</option>
                    <option value="4">4 unidades</option>
                    <option value="5">5 unidades</option>
                    <option value="10">10 unidades</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Status do Registro:</span>
                  </label>
                  <select
                    value={bulkEditForm.status}
                    onChange={e => setBulkEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl p-2.5 text-xs outline-none focus:border-cyan-500 font-semibold"
                  >
                    <option value="MANTER">-- Manter status atual --</option>
                    <option value="Processado">✅ Processado</option>
                    <option value="Pendente">⏳ Pendente</option>
                    <option value="Erro">❌ Erro</option>
                  </select>
                </div>

                {/* Código SKU */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-400" />
                    <span>Código SKU (deixe em branco para não alterar):</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SPM-Shopee-Preto-1 (ou deixe vazio para manter atual)"
                    value={bulkEditForm.codigo === 'MANTER' ? '' : bulkEditForm.codigo}
                    onChange={e => setBulkEditForm(prev => ({ ...prev, codigo: e.target.value ? e.target.value : 'MANTER' }))}
                    className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl p-2.5 text-xs outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Descrição do Item (deixe em branco para não alterar):</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: VERNIZ ELITE SPM 500ML ALTO BRILHO (ou deixe vazio para manter atual)"
                    value={bulkEditForm.descricao === 'MANTER' ? '' : bulkEditForm.descricao}
                    onChange={e => setBulkEditForm(prev => ({ ...prev, descricao: e.target.value ? e.target.value : 'MANTER' }))}
                    className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl p-2.5 text-xs outline-none focus:border-cyan-500"
                  />
                </div>

              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(false)}
                  disabled={isBulkUpdating}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 border border-slate-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBulkUpdating}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-extrabold transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isBulkUpdating ? 'animate-spin' : ''}`} />
                  <span>{isBulkUpdating ? 'Salvando Alterações...' : `Aplicar em Lote (${bulkTargetIds.length} notas)`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

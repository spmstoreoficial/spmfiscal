import React, { useState } from 'react';
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
  FileText,
  Copy,
  Layers,
  Building2,
  Tag,
  Percent,
  DollarSign,
  Truck,
  CreditCard,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../lib/api';
import { CityAutocompleteIBGE } from './CityAutocompleteIBGE';
import { InvoiceDetailModal } from './InvoiceDetailModal';

interface DatabaseViewProps {
  invoices: Invoice[];
  onRefreshData: () => void;
  userRole?: string;
}

type ColumnViewCategory = 'all' | 'dest' | 'prod' | 'tax' | 'total' | 'transp' | 'pay' | 'sefaz' | 'standard';

export const DatabaseView: React.FC<DatabaseViewProps> = ({ invoices, onRefreshData, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [origemFilter, setOrigemFilter] = useState('Todas');
  const [corFilter, setCorFilter] = useState('Todas');
  const [ufFilter, setUfFilter] = useState('Todos');
  const [activeCategory, setActiveCategory] = useState<ColumnViewCategory>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [selectedDetailInvoice, setSelectedDetailInvoice] = useState<Invoice | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Invoice Form State
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

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    const xml = inv.xmlDetails || {};

    const matchesSearch = 
      (inv.nome || '').toLowerCase().includes(term) ||
      (inv.documento || '').includes(term) ||
      (inv.codigo || '').toLowerCase().includes(term) ||
      (inv.descricao || '').toLowerCase().includes(term) ||
      (inv.municipio || '').toLowerCase().includes(term) ||
      (inv.fatura || '').includes(term) ||
      (inv.chaveAcesso || xml.chaveAcesso || '').toLowerCase().includes(term) ||
      (inv.protocoloAutorizacao || xml.protocoloAutorizacao || '').toLowerCase().includes(term) ||
      (inv.transportadoraNome || xml.transportadoraNome || '').toLowerCase().includes(term) ||
      (inv.produtoNcm || xml.produtoNcm || '').includes(term);
    
    const matchesOrigem = origemFilter === 'Todas' || inv.origem === origemFilter;
    const matchesCor = corFilter === 'Todas' || (inv.cor || '').toLowerCase() === corFilter.toLowerCase();
    const matchesUf = ufFilter === 'Todos' || inv.uf === ufFilter;

    return matchesSearch && matchesOrigem && matchesCor && matchesUf;
  });

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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>Base de Dados Fiscal SPM Store (XML SEFAZ Completo)</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-50 text-cyan-700 border border-cyan-200">
              {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Nota Fiscal' : 'Notas Fiscais'}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Visualização analítica de todas as seções fiscais: Destinatário, Itens/SKU, Impostos, Totais, Transporte, Cobrança, Pagamento e Protocolo SEFAZ.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <a
            href="/api/export/excel"
            download="Auditoria_Completa_XML_SEFAZ_SPM.xlsx"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
            title="Exportar todas as colunas XML SEFAZ em Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel Completo</span>
          </a>

          {userRole !== 'AUDITOR' && (
            <>
              <button
                onClick={() => setIsNewInvoiceModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Nota</span>
              </button>

              <button
                onClick={() => setIsResetModalOpen(true)}
                disabled={invoices.length === 0}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition shadow-sm disabled:opacity-50"
                title="Zerar todo o Banco de Dados"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Zerar Banco</span>
              </button>
            </>
          )}
        </div>
      </div>

      {resetSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{resetSuccessMsg}</span>
          </div>
          <button onClick={() => setResetSuccessMsg(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category Views Bar (SELETOR DE SEÇÕES XML) */}
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2 overflow-x-auto shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase text-slate-400 px-2 flex items-center gap-1">
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            Visão de Colunas:
          </span>

          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🌟 Todas as Colunas XML</span>
          </button>

          <button
            onClick={() => setActiveCategory('dest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'dest'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Destinatário (&lt;dest&gt;)</span>
          </button>

          <button
            onClick={() => setActiveCategory('prod')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'prod'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Itens &amp; Estoque (&lt;det&gt;)</span>
          </button>

          <button
            onClick={() => setActiveCategory('tax')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'tax'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Impostos (&lt;imposto&gt;)</span>
          </button>

          <button
            onClick={() => setActiveCategory('total')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'total'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Totais (&lt;total&gt;)</span>
          </button>

          <button
            onClick={() => setActiveCategory('transp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'transp'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Transporte (&lt;transp&gt;)</span>
          </button>

          <button
            onClick={() => setActiveCategory('pay')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'pay'
                ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cobrança &amp; Pagamento</span>
          </button>

          <button
            onClick={() => setActiveCategory('sefaz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'sefaz'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Protocolo &amp; Chave</span>
          </button>

          <button
            onClick={() => setActiveCategory('standard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'standard'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>📋 17 Colunas Padrão</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar por Nome, CPF, Fatura, Chave 44 dígitos, SKU, Cidade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {/* Marketplace Filter */}
          <select
            value={origemFilter}
            onChange={e => setOrigemFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          >
            <option value="Todas">Todos os Marketplaces</option>
            <option value="Shopee">Shopee</option>
            <option value="Mercado Livre">Mercado Livre</option>
            <option value="Amazon">Amazon</option>
            <option value="Magalu">Magalu</option>
            <option value="TikTok Shop">TikTok Shop</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Outros">Outros</option>
          </select>

          {/* Cor Filter */}
          <select
            value={corFilter}
            onChange={e => setCorFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
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
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          >
            <option value="Todos">Todos UFs</option>
            {['SP', 'RJ', 'PR', 'MG', 'RS', 'SC', 'BA', 'PE', 'CE', 'DF', 'ES', 'GO', 'MT', 'MS', 'PA', 'PB', 'RN', 'AM', 'AL', 'SE', 'PI', 'MA', 'RO', 'TO', 'AC', 'AP', 'RR'].map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {selectedIds.length > 0 && userRole !== 'AUDITOR' && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Invoices Table (XML SEFAZ COMPLETO) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[72vh] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-3.5 w-10 text-center bg-slate-950 sticky left-0 z-30">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-white">
                    {selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* 1. GERAL & CONTROLE */}
                <th className="p-3.5 bg-slate-900 text-cyan-300">FATURA / NF-e</th>
                <th className="p-3.5 bg-slate-900 text-slate-300">MARKETPLACE</th>
                <th className="p-3.5 bg-slate-900 text-slate-300">DATA EMISSÃO</th>

                {/* 2. DESTINATÁRIO (<dest>, <enderDest>) */}
                {(activeCategory === 'all' || activeCategory === 'dest' || activeCategory === 'standard') && (
                  <>
                    <th className="p-3.5 bg-blue-950 text-blue-300 border-l border-blue-900">DESTINATÁRIO</th>
                    <th className="p-3.5 bg-blue-950 text-blue-300">CPF / CNPJ</th>
                    <th className="p-3.5 bg-blue-950 text-blue-300">CIDADE / UF</th>
                    <th className="p-3.5 bg-blue-950 text-blue-300">ENDEREÇO</th>
                    <th className="p-3.5 bg-blue-950 text-blue-300">BAIRRO</th>
                    <th className="p-3.5 bg-blue-950 text-blue-300">CEP</th>
                    {activeCategory !== 'standard' && (
                      <>
                        <th className="p-3.5 bg-blue-950 text-blue-300">IE DEST</th>
                        <th className="p-3.5 bg-blue-950 text-blue-300">E-MAIL</th>
                        <th className="p-3.5 bg-blue-950 text-blue-300">CÓD IBGE</th>
                      </>
                    )}
                  </>
                )}

                {/* 3. PRODUTOS & ITENS (<det>, <prod>) */}
                {(activeCategory === 'all' || activeCategory === 'prod' || activeCategory === 'standard') && (
                  <>
                    <th className="p-3.5 bg-purple-950 text-purple-300 border-l border-purple-900">SKU / CÓDIGO</th>
                    <th className="p-3.5 bg-purple-950 text-purple-300">DESCRIÇÃO DO PRODUTO</th>
                    <th className="p-3.5 bg-purple-950 text-purple-300">COR</th>
                    <th className="p-3.5 bg-purple-950 text-purple-300 text-center">QTD</th>
                    {activeCategory !== 'standard' && (
                      <>
                        <th className="p-3.5 bg-purple-950 text-purple-300">NCM</th>
                        <th className="p-3.5 bg-purple-950 text-purple-300">CFOP</th>
                        <th className="p-3.5 bg-purple-950 text-purple-300">UN</th>
                        <th className="p-3.5 bg-purple-950 text-purple-300 text-right">VALOR UNIT.</th>
                      </>
                    )}
                    <th className="p-3.5 bg-purple-950 text-purple-300 text-right">TOTAL PROD</th>
                    <th className="p-3.5 bg-purple-950 text-purple-300 text-right">DESCONTO</th>
                    <th className="p-3.5 bg-purple-950 text-purple-300 text-right font-black text-emerald-400">VALOR FINAL</th>
                  </>
                )}

                {/* 4. IMPOSTOS (<imposto>) */}
                {(activeCategory === 'all' || activeCategory === 'tax') && (
                  <>
                    <th className="p-3.5 bg-amber-950 text-amber-300 border-l border-amber-900">ICMS CST/CSOSN</th>
                    <th className="p-3.5 bg-amber-950 text-amber-300 text-right">BASE ICMS</th>
                    <th className="p-3.5 bg-amber-950 text-amber-300 text-right">VALOR ICMS</th>
                    <th className="p-3.5 bg-amber-950 text-amber-300">PIS CST</th>
                    <th className="p-3.5 bg-amber-950 text-amber-300 text-right">VALOR PIS</th>
                    <th className="p-3.5 bg-amber-950 text-amber-300">COFINS CST</th>
                    <th className="p-3.5 bg-amber-950 text-amber-300 text-right">VALOR COFINS</th>
                    <th className="p-3.5 bg-amber-950 text-amber-300 text-right">TRIB. APROX</th>
                  </>
                )}

                {/* 5. TOTAIS (<total>) */}
                {(activeCategory === 'all' || activeCategory === 'total') && (
                  <>
                    <th className="p-3.5 bg-emerald-950 text-emerald-300 border-l border-emerald-900 text-right">TOTAL PRODUTOS</th>
                    <th className="p-3.5 bg-emerald-950 text-emerald-300 text-right">FRETE</th>
                    <th className="p-3.5 bg-emerald-950 text-emerald-300 text-right">DESCONTO TOTAL</th>
                    <th className="p-3.5 bg-emerald-950 text-emerald-400 text-right font-black">VALOR NOTA (vNF)</th>
                  </>
                )}

                {/* 6. TRANSPORTE (<transp>) */}
                {(activeCategory === 'all' || activeCategory === 'transp') && (
                  <>
                    <th className="p-3.5 bg-indigo-950 text-indigo-300 border-l border-indigo-900">MODALIDADE FRETE</th>
                    <th className="p-3.5 bg-indigo-950 text-indigo-300">TRANSPORTADORA</th>
                    <th className="p-3.5 bg-indigo-950 text-indigo-300">CNPJ TRANSP</th>
                    <th className="p-3.5 bg-indigo-950 text-indigo-300 text-center">VOLUMES</th>
                    <th className="p-3.5 bg-indigo-950 text-indigo-300 text-right">PESO BRUTO (KG)</th>
                  </>
                )}

                {/* 7. COBRANÇA & PAGAMENTO (<cobr>, <pag>, <infIntermed>) */}
                {(activeCategory === 'all' || activeCategory === 'pay') && (
                  <>
                    <th className="p-3.5 bg-teal-950 text-teal-300 border-l border-teal-900">FORMA PAGAMENTO</th>
                    <th className="p-3.5 bg-teal-950 text-teal-300 text-right">VALOR PAGO</th>
                    <th className="p-3.5 bg-teal-950 text-teal-300">PARCELAS / VENC</th>
                    <th className="p-3.5 bg-teal-950 text-teal-300">CNPJ INTERMEDIADOR</th>
                  </>
                )}

                {/* 8. PROTOCOLO & SEFAZ (<infProt>, <ide>) */}
                {(activeCategory === 'all' || activeCategory === 'sefaz') && (
                  <>
                    <th className="p-3.5 bg-rose-950 text-rose-300 border-l border-rose-900">CHAVE DE ACESSO (44 DÍGITOS)</th>
                    <th className="p-3.5 bg-rose-950 text-rose-300">STATUS SEFAZ</th>
                    <th className="p-3.5 bg-rose-950 text-rose-300">Nº PROTOCOLO</th>
                  </>
                )}

                <th className="p-3.5 text-center bg-slate-950 sticky right-0 z-30">AÇÕES</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={40} className="p-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-slate-700">Nenhum registro fiscal encontrado.</p>
                      <p className="text-xs text-slate-400">Tente ajustar os termos de pesquisa ou os filtros de marketplace/cor/UF.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSelected = selectedIds.includes(inv.id);
                  const xml = inv.xmlDetails || {};
                  const chave = inv.chaveAcesso || xml.chaveAcesso;

                  return (
                    <tr 
                      key={inv.id} 
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-cyan-50/50' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center bg-white sticky left-0 z-10">
                        <button onClick={() => handleToggleSelect(inv.id)} className="text-slate-400 hover:text-slate-700">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* 1. GERAL */}
                      <td className="p-3.5 font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{inv.fatura || 'N/A'}</span>
                        {(inv.serie || xml.serie) && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                            S.{inv.serie || xml.serie}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {inv.origem || 'Outros'}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">{inv.dataSaida}</td>

                      {/* 2. DESTINATÁRIO */}
                      {(activeCategory === 'all' || activeCategory === 'dest' || activeCategory === 'standard') && (
                        <>
                          <td className="p-3.5 font-bold text-slate-900 border-l border-slate-100 max-w-[200px] truncate" title={inv.nome}>
                            {inv.nome}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-600">{inv.documento}</td>
                          <td className="p-3.5 text-slate-800 font-medium">{inv.municipio} - {inv.uf}</td>
                          <td className="p-3.5 text-slate-600 max-w-[180px] truncate" title={inv.endereco}>{inv.endereco}</td>
                          <td className="p-3.5 text-slate-600">{inv.bairro}</td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500">{inv.cep}</td>
                          {activeCategory !== 'standard' && (
                            <>
                              <td className="p-3.5 font-mono text-[11px] text-slate-500">{inv.destinatarioIe || xml.destinatarioIe || 'ISENTO'}</td>
                              <td className="p-3.5 font-mono text-[11px] text-slate-500 max-w-[150px] truncate">{inv.destinatarioEmail || xml.destinatarioEmail || '-'}</td>
                              <td className="p-3.5 font-mono text-[11px] text-slate-500">{inv.destinatarioCodigoMunicipio || xml.destinatarioCodigoMunicipio || '-'}</td>
                            </>
                          )}
                        </>
                      )}

                      {/* 3. PRODUTOS & ITENS */}
                      {(activeCategory === 'all' || activeCategory === 'prod' || activeCategory === 'standard') && (
                        <>
                          <td className="p-3.5 font-mono text-slate-900 font-bold border-l border-slate-100">{inv.codigo}</td>
                          <td className="p-3.5 text-slate-700 max-w-[220px] truncate font-medium" title={inv.descricao}>{inv.descricao}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              (inv.cor || '').toLowerCase() === 'preto' ? 'bg-slate-900 text-white border-slate-900' :
                              (inv.cor || '').toLowerCase() === 'marrom' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                              (inv.cor || '').toLowerCase() === 'incolor' ? 'bg-cyan-50 text-cyan-800 border-cyan-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {inv.cor || 'Não identificada'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-extrabold text-slate-900">{inv.quantidade}</td>
                          {activeCategory !== 'standard' && (
                            <>
                              <td className="p-3.5 font-mono text-[11px] text-slate-500">{inv.produtoNcm || xml.produtoNcm || '32089010'}</td>
                              <td className="p-3.5 font-mono text-[11px] text-slate-500">{inv.produtoCfop || xml.produtoCfop || '5102'}</td>
                              <td className="p-3.5 font-mono text-[11px] text-slate-500">{inv.produtoUnidade || xml.produtoUnidade || 'UN'}</td>
                              <td className="p-3.5 text-right font-mono text-slate-600">R$ {inv.produtoValorUnitario || xml.produtoValorUnitario || inv.valorProdutos}</td>
                            </>
                          )}
                          <td className="p-3.5 text-right font-mono text-slate-700">R$ {inv.valorProdutos}</td>
                          <td className="p-3.5 text-right font-mono text-rose-600">R$ {inv.desconto}</td>
                          <td className="p-3.5 text-right font-mono font-black text-emerald-600 text-xs">R$ {inv.valorNota}</td>
                        </>
                      )}

                      {/* 4. IMPOSTOS */}
                      {(activeCategory === 'all' || activeCategory === 'tax') && (
                        <>
                          <td className="p-3.5 font-mono text-slate-700 border-l border-slate-100">{inv.icmsCstCsosn || xml.icmsCstCsosn || '102'}</td>
                          <td className="p-3.5 text-right font-mono text-slate-600">R$ {inv.totalBaseIcms || xml.totalBaseIcms || inv.valorProdutos}</td>
                          <td className="p-3.5 text-right font-mono text-slate-600">R$ {inv.totalValorIcms || xml.totalValorIcms || '0,00'}</td>
                          <td className="p-3.5 font-mono text-slate-500">{inv.pisCst || xml.pisCst || '07'}</td>
                          <td className="p-3.5 text-right font-mono text-slate-600">R$ {inv.totalPis || xml.totalPis || '0,00'}</td>
                          <td className="p-3.5 font-mono text-slate-500">{inv.cofinsCst || xml.cofinsCst || '07'}</td>
                          <td className="p-3.5 text-right font-mono text-slate-600">R$ {inv.totalCofins || xml.totalCofins || '0,00'}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-amber-700">R$ {inv.totalTributosAprox || xml.totalTributosAprox || '0,00'}</td>
                        </>
                      )}

                      {/* 5. TOTAIS */}
                      {(activeCategory === 'all' || activeCategory === 'total') && (
                        <>
                          <td className="p-3.5 text-right font-mono text-slate-700 border-l border-slate-100">R$ {inv.totalProdutos || xml.totalProdutos || inv.valorProdutos}</td>
                          <td className="p-3.5 text-right font-mono text-slate-500">R$ {inv.totalFrete || xml.totalFrete || '0,00'}</td>
                          <td className="p-3.5 text-right font-mono text-rose-600">R$ {inv.desconto}</td>
                          <td className="p-3.5 text-right font-mono font-black text-emerald-600 text-xs">R$ {inv.valorNota}</td>
                        </>
                      )}

                      {/* 6. TRANSPORTE */}
                      {(activeCategory === 'all' || activeCategory === 'transp') && (
                        <>
                          <td className="p-3.5 text-slate-700 border-l border-slate-100 max-w-[140px] truncate" title={inv.transporteModalidadeFrete || xml.transporteModalidadeFrete}>
                            {inv.transporteModalidadeFrete || xml.transporteModalidadeFrete || '0 - CIF'}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800 max-w-[180px] truncate" title={inv.transportadoraNome || xml.transportadoraNome}>
                            {inv.transportadoraNome || xml.transportadoraNome || 'Correios / Mercado Envios'}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500">{inv.transportadoraCnpjDoc || xml.transportadoraCnpjDoc || '-'}</td>
                          <td className="p-3.5 text-center font-mono">{inv.transporteVolumeQuantidade || xml.transporteVolumeQuantidade || '1'}</td>
                          <td className="p-3.5 text-right font-mono text-slate-600">{inv.transporteVolumePesoBruto || xml.transporteVolumePesoBruto || '0,300'}</td>
                        </>
                      )}

                      {/* 7. COBRANÇA & PAGAMENTO */}
                      {(activeCategory === 'all' || activeCategory === 'pay') && (
                        <>
                          <td className="p-3.5 font-bold text-teal-800 border-l border-slate-100">
                            {inv.pagamentoForma || xml.pagamentoForma || '17 - PIX'}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">R$ {inv.valorNota}</td>
                          <td className="p-3.5 text-slate-600 text-[11px] max-w-[150px] truncate" title={inv.cobrancaDuplicatasResumo || xml.cobrancaDuplicatasResumo}>
                            {inv.cobrancaDuplicatasResumo || xml.cobrancaDuplicatasResumo || 'À Vista'}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500">{inv.intermediadorCnpj || xml.intermediadorCnpj || '-'}</td>
                        </>
                      )}

                      {/* 8. SEFAZ & CHAVE */}
                      {(activeCategory === 'all' || activeCategory === 'sefaz') && (
                        <>
                          <td className="p-3.5 font-mono text-[11px] text-slate-700 border-l border-slate-100 max-w-[200px] truncate">
                            {chave ? (
                              <div className="flex items-center gap-1.5">
                                <span className="truncate select-all" title={chave}>{chave}</span>
                                <button
                                  onClick={() => handleCopyText(chave, inv.id)}
                                  className="text-slate-400 hover:text-cyan-600 shrink-0"
                                  title="Copiar Chave de 44 Dígitos"
                                >
                                  {copiedKey === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-3.5 text-slate-700 text-[11px]">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              {inv.statusSefaz || xml.statusSefaz || '100 - Autorizado'}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500">{inv.protocoloAutorizacao || xml.protocoloAutorizacao || '-'}</td>
                        </>
                      )}

                      {/* Ações */}
                      <td className="p-3.5 text-center bg-white sticky right-0 z-10">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedDetailInvoice(inv)}
                            className="p-1.5 rounded hover:bg-cyan-50 text-slate-500 hover:text-cyan-600 transition"
                            title="Ver Detalhes Fiscais / XML SEFAZ"
                          >
                            <FileText className="w-3.5 h-3.5 text-cyan-600" />
                          </button>
                          {userRole !== 'AUDITOR' && (
                            <>
                              <button
                                onClick={() => setEditingInvoice(inv)}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition"
                                title="Editar Nota Fiscal"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition"
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

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Editar Registro Fiscal #{editingInvoice.id}</h3>
              <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-500 mb-1">NOME / Razão Social</label>
                <input
                  type="text"
                  value={editingInvoice.nome}
                  onChange={e => setEditingInvoice({ ...editingInvoice, nome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  value={editingInvoice.documento}
                  onChange={e => setEditingInvoice({ ...editingInvoice, documento: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">DATA NF-e</label>
                <input
                  type="text"
                  value={editingInvoice.dataSaida}
                  onChange={e => setEditingInvoice({ ...editingInvoice, dataSaida: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">FATURA</label>
                <input
                  type="text"
                  value={editingInvoice.fatura}
                  onChange={e => setEditingInvoice({ ...editingInvoice, fatura: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">MARKETPLACE</label>
                <select
                  value={editingInvoice.origem}
                  onChange={e => setEditingInvoice({ ...editingInvoice, origem: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Shopee">Shopee</option>
                  <option value="Mercado Livre">Mercado Livre</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Magalu">Magalu</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-500 mb-1">ENDEREÇO</label>
                <input
                  type="text"
                  value={editingInvoice.endereco}
                  onChange={e => setEditingInvoice({ ...editingInvoice, endereco: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">BAIRRO</label>
                <input
                  type="text"
                  value={editingInvoice.bairro}
                  onChange={e => setEditingInvoice({ ...editingInvoice, bairro: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">CEP</label>
                <input
                  type="text"
                  value={editingInvoice.cep}
                  onChange={e => setEditingInvoice({ ...editingInvoice, cep: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">MUNICÍPIO (IBGE)</label>
                <CityAutocompleteIBGE
                  value={editingInvoice.municipio}
                  ufValue={editingInvoice.uf}
                  onSelect={(city, uf, ibgeCode) => {
                    setEditingInvoice({
                      ...editingInvoice,
                      municipio: city,
                      uf: uf,
                      destinatarioCodigoMunicipio: ibgeCode
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">UF</label>
                <input
                  type="text"
                  value={editingInvoice.uf}
                  onChange={e => setEditingInvoice({ ...editingInvoice, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">CÓDIGO SKU</label>
                <input
                  type="text"
                  value={editingInvoice.codigo}
                  onChange={e => setEditingInvoice({ ...editingInvoice, codigo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">QUANTIDADE</label>
                <input
                  type="text"
                  value={editingInvoice.quantidade}
                  onChange={e => setEditingInvoice({ ...editingInvoice, quantidade: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">COR / VARIANTE</label>
                <select
                  value={editingInvoice.cor}
                  onChange={e => setEditingInvoice({ ...editingInvoice, cor: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Preto">Preto</option>
                  <option value="Marrom">Marrom</option>
                  <option value="Incolor">Incolor</option>
                  <option value="Kit 1">Kit 1</option>
                  <option value="Não identificada">Não identificada</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-500 mb-1">DESCRIÇÃO DO PRODUTO</label>
                <input
                  type="text"
                  value={editingInvoice.descricao}
                  onChange={e => setEditingInvoice({ ...editingInvoice, descricao: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">VALOR PRODUTOS (R$)</label>
                <input
                  type="text"
                  value={editingInvoice.valorProdutos}
                  onChange={e => setEditingInvoice({ ...editingInvoice, valorProdutos: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">DESCONTO (R$)</label>
                <input
                  type="text"
                  value={editingInvoice.desconto}
                  onChange={e => setEditingInvoice({ ...editingInvoice, desconto: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">VALOR FINAL DA NOTA (R$)</label>
                <input
                  type="text"
                  value={editingInvoice.valorNota}
                  onChange={e => setEditingInvoice({ ...editingInvoice, valorNota: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                onClick={() => setEditingInvoice(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedInvoice}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Adicionar Novo Registro Fiscal</h3>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-500 mb-1">NOME / Razão Social *</label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={newInv.nome || ''}
                  onChange={e => setNewInv({ ...newInv, nome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={newInv.documento || ''}
                  onChange={e => setNewInv({ ...newInv, documento: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">DATA NF-e</label>
                <input
                  type="text"
                  value={newInv.dataSaida || ''}
                  onChange={e => setNewInv({ ...newInv, dataSaida: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">FATURA</label>
                <input
                  type="text"
                  placeholder="001234"
                  value={newInv.fatura || ''}
                  onChange={e => setNewInv({ ...newInv, fatura: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">MARKETPLACE</label>
                <select
                  value={newInv.origem || 'Shopee'}
                  onChange={e => setNewInv({ ...newInv, origem: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Shopee">Shopee</option>
                  <option value="Mercado Livre">Mercado Livre</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Magalu">Magalu</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-500 mb-1">ENDEREÇO</label>
                <input
                  type="text"
                  placeholder="Rua, Número, Complemento"
                  value={newInv.endereco || ''}
                  onChange={e => setNewInv({ ...newInv, endereco: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">BAIRRO</label>
                <input
                  type="text"
                  placeholder="Bairro"
                  value={newInv.bairro || ''}
                  onChange={e => setNewInv({ ...newInv, bairro: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">CEP</label>
                <input
                  type="text"
                  placeholder="00000-000"
                  value={newInv.cep || ''}
                  onChange={e => setNewInv({ ...newInv, cep: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">MUNICÍPIO (IBGE)</label>
                <CityAutocompleteIBGE
                  value={newInv.municipio || ''}
                  ufValue={newInv.uf || ''}
                  onSelect={(city, uf, ibgeCode) => {
                    setNewInv({
                      ...newInv,
                      municipio: city,
                      uf: uf,
                      destinatarioCodigoMunicipio: ibgeCode
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">UF</label>
                <input
                  type="text"
                  placeholder="SP"
                  value={newInv.uf || 'SP'}
                  onChange={e => setNewInv({ ...newInv, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">CÓDIGO SKU</label>
                <input
                  type="text"
                  value={newInv.codigo || ''}
                  onChange={e => setNewInv({ ...newInv, codigo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">QUANTIDADE</label>
                <input
                  type="text"
                  value={newInv.quantidade || '1'}
                  onChange={e => setNewInv({ ...newInv, quantidade: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">COR / VARIANTE</label>
                <select
                  value={newInv.cor || 'Preto'}
                  onChange={e => setNewInv({ ...newInv, cor: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Preto">Preto</option>
                  <option value="Marrom">Marrom</option>
                  <option value="Incolor">Incolor</option>
                  <option value="Kit 1">Kit 1</option>
                  <option value="Não identificada">Não identificada</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-500 mb-1">DESCRIÇÃO DO PRODUTO *</label>
                <input
                  type="text"
                  placeholder="Descrição do produto vendido"
                  value={newInv.descricao || ''}
                  onChange={e => setNewInv({ ...newInv, descricao: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">VALOR PRODUTOS (R$)</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={newInv.valorProdutos || '0,00'}
                  onChange={e => setNewInv({ ...newInv, valorProdutos: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">DESCONTO (R$)</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={newInv.desconto || '0,00'}
                  onChange={e => setNewInv({ ...newInv, desconto: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">VALOR FINAL NOTA (R$)</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={newInv.valorNota || '0,00'}
                  onChange={e => setNewInv({ ...newInv, valorNota: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewInvoice}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
              >
                Cadastrar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Zerar Banco de Dados?</h3>
                <p className="text-xs text-slate-500">Esta ação é irreversível.</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-rose-50/50 p-3.5 rounded-xl border border-rose-100">
              <p className="font-semibold text-rose-800 flex items-center space-x-1">
                <span>⚠️ Consequências desta ação:</span>
              </p>
              <p>• Todos os <strong>{invoices.length}</strong> registros de notas fiscais serão removidos.</p>
              <p>• Os indicadores do Dashboard e Auditoria serão zerados.</p>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isResetting ? 'Zerando Banco...' : 'Sim, Zerar Banco de Dados'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes Fiscais Completos SEFAZ XML */}
      {selectedDetailInvoice && (
        <InvoiceDetailModal
          invoice={selectedDetailInvoice}
          onClose={() => setSelectedDetailInvoice(null)}
        />
      )}

    </div>
  );
};

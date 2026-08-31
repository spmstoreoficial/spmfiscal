import React, { useState } from 'react';
import { 
  FileCheck, 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Printer, 
  CheckCircle2, 
  Building2,
  DollarSign,
  Tag,
  Percent,
  Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, DashboardStats } from '../types';

interface ReportsViewProps {
  invoices: Invoice[];
  stats: DashboardStats | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ invoices, stats }) => {
  const [selectedMarketplace, setSelectedMarketplace] = useState('Todas');
  const [selectedCor, setSelectedCor] = useState('Todas');
  const [selectedUf, setSelectedUf] = useState('Todos');
  const [reportTitle, setReportTitle] = useState('Relatório de Faturamento & Auditoria de Notas Fiscais SPM Store');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const filteredInvoices = invoices.filter(inv => {
    const matchesMkt = selectedMarketplace === 'Todas' || inv.origem === selectedMarketplace;
    const matchesCor = selectedCor === 'Todas' || inv.cor.toLowerCase() === selectedCor.toLowerCase();
    const matchesUf = selectedUf === 'Todos' || inv.uf === selectedUf;
    return matchesMkt && matchesCor && matchesUf;
  });

  const parseNum = (val: string) => {
    if (!val) return 0;
    const n = parseFloat(val.replace(/\./g, '').replace(',', '.').trim());
    return isNaN(n) ? 0 : n;
  };

  const totalFaturado = filteredInvoices.reduce((a, b) => a + parseNum(b.valorNota), 0);
  const totalDescontos = filteredInvoices.reduce((a, b) => a + parseNum(b.desconto), 0);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(15, 23, 42); // Dark slate
      doc.rect(0, 0, 297, 24, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(6, 182, 212); // Cyan
      doc.text('SPM STORE', 14, 15);
      doc.setTextColor(255, 255, 255);
      doc.text(' - RELATÓRIO OFICIAL DE NOTAS FISCAIS & DANFE', 50, 15);

      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 220, 15);

      // Executive Summary Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 30, 269, 28, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, 30, 269, 28, 'S');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.text(reportTitle, 18, 38);

      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Total de Notas: ${filteredInvoices.length}`, 18, 46);
      doc.text(`Faturamento Final: ${formatBRL(totalFaturado)}`, 100, 46);
      doc.text(`Total Descontos: ${formatBRL(totalDescontos)}`, 190, 46);

      doc.text(`Marketplace: ${selectedMarketplace} | Cor: ${selectedCor} | UF: ${selectedUf}`, 18, 52);

      // Table Data
      const tableData = filteredInvoices.map(inv => [
        inv.origem,
        inv.nome,
        inv.documento,
        inv.dataSaida,
        inv.uf,
        inv.fatura,
        inv.codigo,
        inv.quantidade,
        inv.cor,
        `R$ ${inv.valorNota}`
      ]);

      autoTable(doc, {
        startY: 64,
        head: [['Marketplace', 'Nome / Razão Social', 'CPF/CNPJ', 'Data', 'UF', 'Fatura', 'Código SKU', 'Qtd', 'Cor', 'Valor Final']],
        body: tableData,
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 14, right: 14 }
      });

      doc.save('Relatorio_SPM_Store_Notas_Fiscais.pdf');
    } catch (err) {
      console.error('PDF Report Generation Error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <FileCheck className="w-3 h-3 text-cyan-400" /> Exportação Executiva
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Gerador de Relatórios Fiscais Oficiais
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Exportação em lote de relatórios em formato PDF e planilhas Excel (.xlsx) com todos os campos das notas fiscais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/excel"
            download="Auditoria_Faturamento_SPM.xlsx"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20 border border-emerald-400/30"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </a>

          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-600/20 border border-cyan-400/30 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Gerando...' : 'Exportar PDF'}</span>
          </button>
        </div>
      </div>

      {/* Filters & Config */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Filter className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white text-sm">Parâmetros do Relatório</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Marketplace</label>
            <select
              value={selectedMarketplace}
              onChange={e => setSelectedMarketplace(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="Todas">Todos os Marketplaces</option>
              <option value="Shopee">Shopee</option>
              <option value="Mercado Livre">Mercado Livre</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="TikTok">TikTok</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Cor</label>
            <select
              value={selectedCor}
              onChange={e => setSelectedCor(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="Todas">Todas as Cores</option>
              <option value="Preto">Preto</option>
              <option value="Marrom">Marrom</option>
              <option value="Incolor">Incolor</option>
              <option value="Não identificada">Não identificada</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Estado (UF)</label>
            <select
              value={selectedUf}
              onChange={e => setSelectedUf(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
            >
              <option value="Todos">Todos os Estados</option>
              {['SP', 'RJ', 'PR', 'MG', 'RS', 'SC', 'BA', 'PE', 'CE', 'DF', 'GO', 'ES', 'MT', 'MS'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Título do Documento</label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f172a]/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Faturamento Filtrado</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{formatBRL(totalFaturado)}</p>
          <p className="text-slate-400 text-[11px] mt-1">{filteredInvoices.length} notas selecionadas</p>
        </div>

        <div className="bg-[#0f172a]/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total de Descontos</span>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1">{formatBRL(totalDescontos)}</p>
          <p className="text-slate-400 text-[11px] mt-1">Concedidos nas notas</p>
        </div>

        <div className="bg-[#0f172a]/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Ticket Médio</span>
          <p className="text-2xl font-black text-purple-300 font-mono mt-1">
            {formatBRL(filteredInvoices.length > 0 ? totalFaturado / filteredInvoices.length : 0)}
          </p>
          <p className="text-slate-400 text-[11px] mt-1">Por nota fiscal</p>
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { 
  FileCheck, 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Printer, 
  CheckCircle2, 
  Building2 
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

      // Title & Branding
      doc.setFillColor(30, 41, 59); // Slate navy
      doc.rect(0, 0, 297, 24, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('SPM STORE - RELATÓRIO DE NOTAS FISCAIS', 14, 15);

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 220, 15);

      // Executive Summary Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 30, 269, 28, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, 30, 269, 28, 'S');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.text(reportTitle, 18, 38);

      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Total de Notas: ${filteredInvoices.length}`, 18, 46);
      doc.text(`Faturamento Final: ${formatBRL(totalFaturado)}`, 100, 46);
      doc.text(`Total Descontos: ${formatBRL(totalDescontos)}`, 190, 46);

      doc.text(`Marketplace: ${selectedMarketplace} | Cor: ${selectedCor} | UF: ${selectedUf}`, 18, 52);

      // Table Data (17 campos mapeados em colunas chave)
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
          fillColor: [30, 41, 59],
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
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span>Gerador de Relatórios Oficiais SPM Store</span>
            </h2>
            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">
              PDF & Excel
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Geração de relatórios com os 17 campos oficiais mapeados pelo script JavaScript.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/api/export/excel"
            download="Auditoria_Faturamento_SPM.xlsx"
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </a>

          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Gerando...' : 'Exportar PDF'}</span>
          </button>
        </div>
      </div>

      {/* Filters & Config */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-600" />
          <span>Filtros do Relatório</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Marketplace</label>
            <select
              value={selectedMarketplace}
              onChange={e => setSelectedMarketplace(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
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
            <label className="block text-slate-500 mb-1 font-semibold">Cor</label>
            <select
              value={selectedCor}
              onChange={e => setSelectedCor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Todas">Todas as Cores</option>
              <option value="Preto">Preto</option>
              <option value="Marrom">Marrom</option>
              <option value="Incolor">Incolor</option>
              <option value="Não identificada">Não identificada</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Estado (UF)</label>
            <select
              value={selectedUf}
              onChange={e => setSelectedUf(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Todos">Todos os Estados</option>
              {['SP', 'RJ', 'PR', 'MG', 'RS', 'SC', 'BA', 'PE', 'CE', 'DF'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Título do Documento</label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Faturamento Filtrado</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{formatBRL(totalFaturado)}</p>
          <p className="text-slate-400 text-[11px] mt-1">{filteredInvoices.length} notas selecionadas</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Total de Descontos</span>
          <p className="text-2xl font-black text-rose-600 font-mono mt-1">{formatBRL(totalDescontos)}</p>
          <p className="text-slate-400 text-[11px] mt-1">Concedidos nas notas</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Ticket Médio</span>
          <p className="text-2xl font-black text-blue-600 font-mono mt-1">
            {formatBRL(filteredInvoices.length > 0 ? totalFaturado / filteredInvoices.length : 0)}
          </p>
          <p className="text-slate-400 text-[11px] mt-1">Por nota fiscal</p>
        </div>
      </div>

    </div>
  );
};

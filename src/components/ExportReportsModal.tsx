import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle2,
  FileCheck,
  Calendar,
  Filter,
  ShieldCheck,
  Building2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../types';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
}

export const ExportReportsModal: React.FC<ExportReportsModalProps> = ({
  isOpen,
  onClose,
  invoices
}) => {
  const [reportTitle, setReportTitle] = useState('Relatório Oficial de Faturamento & Auditoria Fiscal SPM Store');
  const [selectedMarketplace, setSelectedMarketplace] = useState('Todas');
  const [selectedUf, setSelectedUf] = useState('Todos');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const filteredInvoices = invoices.filter(inv => {
    const matchesMkt = selectedMarketplace === 'Todas' || inv.origem === selectedMarketplace;
    const matchesUf = selectedUf === 'Todos' || (inv.uf || '').toUpperCase() === selectedUf.toUpperCase();
    return matchesMkt && matchesUf;
  });

  const parseNum = (val: string | number | undefined): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const clean = val.replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  const totalFaturado = filteredInvoices.reduce((a, b) => a + parseNum(b.valorNota), 0);
  const totalDescontos = filteredInvoices.reduce((a, b) => a + parseNum(b.desconto), 0);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(11, 19, 41);
      doc.rect(0, 0, 297, 24, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('SPM STORE - RELATÓRIO DE AUDITORIA FISCAL & NFs', 14, 15);

      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 220, 15);

      // Summary Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 30, 269, 26, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, 30, 269, 26, 'S');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.text(reportTitle, 18, 37);

      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Total de Notas: ${filteredInvoices.length}`, 18, 45);
      doc.text(`Faturamento: ${formatBRL(totalFaturado)}`, 90, 45);
      doc.text(`Descontos: ${formatBRL(totalDescontos)}`, 180, 45);
      doc.text(`Marketplace: ${selectedMarketplace} | Estado: ${selectedUf}`, 18, 51);

      // Table Data
      const tableData = filteredInvoices.map(inv => [
        inv.origem || 'SPM',
        inv.nome || 'Consumidor Final',
        inv.documento || '-',
        inv.dataSaida || '-',
        inv.uf || 'SP',
        inv.fatura || '-',
        inv.codigo || '-',
        inv.quantidade || '1',
        inv.cor || '-',
        `R$ ${inv.valorNota}`
      ]);

      autoTable(doc, {
        startY: 60,
        head: [['Canal', 'Destinatário', 'CPF/CNPJ', 'Data', 'UF', 'Fatura', 'SKU', 'Qtd', 'Cor', 'Valor Final']],
        body: tableData,
        headStyles: {
          fillColor: [11, 19, 41],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [15, 23, 42]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 14, right: 14 }
      });

      doc.save(`Relatorio_Fiscal_SPM_Store_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Origem',
      'Nome',
      'Documento',
      'DataSaida',
      'Endereco',
      'Bairro',
      'CEP',
      'Municipio',
      'UF',
      'Fatura',
      'ValorProdutos',
      'ValorNota',
      'Desconto',
      'Codigo',
      'Quantidade',
      'Descricao',
      'Cor'
    ];

    const rows = filteredInvoices.map(inv => [
      inv.origem,
      `"${(inv.nome || '').replace(/"/g, '""')}"`,
      `"${inv.documento}"`,
      `"${inv.dataSaida}"`,
      `"${(inv.endereco || '').replace(/"/g, '""')}"`,
      `"${inv.bairro}"`,
      `"${inv.cep}"`,
      `"${inv.municipio}"`,
      `"${inv.uf}"`,
      `"${inv.fatura}"`,
      `"${inv.valorProdutos}"`,
      `"${inv.valorNota}"`,
      `"${inv.desconto}"`,
      `"${inv.codigo}"`,
      `"${inv.quantidade}"`,
      `"${(inv.descricao || '').replace(/"/g, '""')}"`,
      `"${inv.cor}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Auditoria_SPM_Fiscal_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Exportar Relatórios Fiscais
              </h3>
              <p className="text-xs text-slate-400">
                Geração em PDF, Planilha Excel (.xlsx) e CSV com os 17 campos oficiais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Título do Documento
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-500 shadow-inner"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Marketplace</label>
              <select
                value={selectedMarketplace}
                onChange={e => setSelectedMarketplace(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500"
              >
                <option value="Todas">Todos os Canais</option>
                <option value="Shopee">Shopee</option>
                <option value="Mercado Livre">Mercado Livre</option>
                <option value="TikTok">TikTok Shop</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Estado (UF)</label>
              <select
                value={selectedUf}
                onChange={e => setSelectedUf(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500"
              >
                <option value="Todos">Todos os Estados</option>
                {['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'BA', 'GO', 'DF', 'PE', 'CE'].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Metrics Preview */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Notas</span>
              <div className="text-sm font-extrabold text-cyan-400 font-mono mt-0.5">
                {filteredInvoices.length}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Faturamento</span>
              <div className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">
                {formatBRL(totalFaturado)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Descontos</span>
              <div className="text-sm font-extrabold text-rose-400 font-mono mt-0.5">
                {formatBRL(totalDescontos)}
              </div>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {isGeneratingPdf ? 'Gerando...' : 'PDF Executivo'}
            </button>

            <a
              href="/api/export/excel"
              download={`Auditoria_SPM_${Date.now()}.xlsx`}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition text-center"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel (.xlsx)
            </a>

            <button
              onClick={handleExportCsv}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold text-xs border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-purple-400" />
              CSV (.csv)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

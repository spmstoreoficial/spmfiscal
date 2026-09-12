import React, { useState } from 'react';
import {
  X,
  FileText,
  Building2,
  MapPin,
  Tag,
  DollarSign,
  Calendar,
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  Receipt,
  Percent,
  Info
} from 'lucide-react';
import { Invoice } from '../types';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoice, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!invoice) return null;

  const xml = invoice.xmlDetails || {};

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const chaveAcesso = invoice.chaveAcesso || xml.chaveAcesso;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-white tracking-wide">
                  DANFE / NF-e SEFAZ Detalhada
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {invoice.origem || 'SPM Store'}
                </span>
                {invoice.cor && invoice.cor !== 'Não identificada' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30">
                    Cor: {invoice.cor}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                NF-e Nº {invoice.fatura || 'N/A'} • Série {invoice.serie || xml.serie || '1'} • Status: {invoice.statusSefaz || xml.statusSefaz || invoice.status || '100 - Autorizado'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Top Banner with Value & Key */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Valor Total da Nota Fiscal</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                R$ {invoice.valorNota}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Data de Saída / Emissão</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">
                {invoice.dataSaida || 'N/A'}
              </span>
              {(invoice.dataHoraAutorizacao || xml.dataHoraAutorizacao) && (
                <span className="text-[10px] text-slate-500 block font-mono">
                  Aut: {invoice.dataHoraAutorizacao || xml.dataHoraAutorizacao}
                </span>
              )}
            </div>
          </div>

          {/* Chave de Acesso Bar */}
          {chaveAcesso && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-400">Chave:</span>
                <span className="font-mono text-xs text-slate-200 truncate select-all">{chaveAcesso}</span>
              </div>
              <button
                onClick={() => handleCopy(chaveAcesso, 'chave')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold flex items-center gap-1 shrink-0 transition"
              >
                <Copy className="w-3 h-3" />
                {copiedKey === 'chave' ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          )}

          {/* Grid 2 Columns: Destinatário & Produto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* 1. Destinatário & Endereço */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-extrabold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  1. Destinatário / Comprador
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {invoice.destinatarioIndIe || xml.destinatarioIndIe ? `Ind IE: ${invoice.destinatarioIndIe || xml.destinatarioIndIe}` : 'Consumidor'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block text-[10px]">Nome / Razão Social:</span>
                  <span className="font-bold text-white text-xs">{invoice.nome || 'Consumidor Final'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CPF / CNPJ:</span>
                  <span className="font-mono text-white text-xs flex items-center gap-1">
                    {invoice.documento || '-'}
                    {invoice.documento && (
                      <button
                        onClick={() => handleCopy(invoice.documento, 'doc')}
                        className="text-slate-500 hover:text-cyan-400"
                        title="Copiar Documento"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Inscrição Estadual (IE):</span>
                  <span className="font-mono text-slate-300 text-xs">
                    {invoice.destinatarioIe || xml.destinatarioIe || 'ISENTO'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block text-[10px]">Endereço Completo:</span>
                  <span className="text-slate-200">
                    {invoice.endereco || ''} {invoice.bairro ? `- ${invoice.bairro}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Município - UF:</span>
                  <span className="text-cyan-300 font-bold">
                    {invoice.municipio} - {invoice.uf}
                  </span>
                  {(invoice.destinatarioCodigoMunicipio || xml.destinatarioCodigoMunicipio) && (
                    <span className="text-[10px] text-slate-500 block font-mono">
                      IBGE: {invoice.destinatarioCodigoMunicipio || xml.destinatarioCodigoMunicipio}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CEP:</span>
                  <span className="font-mono text-slate-300">{invoice.cep || '-'}</span>
                </div>
                {(invoice.destinatarioEmail || xml.destinatarioEmail) && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[10px]">E-mail / Contato:</span>
                    <span className="text-slate-300 font-mono">{invoice.destinatarioEmail || xml.destinatarioEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Itens, Produtos & SKU */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-extrabold text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  2. Produto / Item ({invoice.itemNumero || xml.itemNumero || '1'})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  NCM: {invoice.produtoNcm || xml.produtoNcm || '32089010'} • CFOP: {invoice.produtoCfop || xml.produtoCfop || '5102'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Código SKU:</span>
                  <span className="font-mono font-bold text-white">{invoice.codigo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Cor / Variante:</span>
                  <span className="font-bold text-purple-300">{invoice.cor || 'Não identificada'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Quantidade:</span>
                  <span className="font-mono font-bold text-white">
                    {invoice.quantidade || '1'} {invoice.produtoUnidade || xml.produtoUnidade || 'UN'}
                  </span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-slate-500 block text-[10px]">Descrição do Item:</span>
                  <span className="text-slate-200 font-medium">{invoice.descricao || 'Produto SPM'}</span>
                </div>
                {(invoice.produtoEan || xml.produtoEan) && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">GTIN / EAN:</span>
                    <span className="font-mono text-slate-300">{invoice.produtoEan || xml.produtoEan}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block text-[10px]">Valor Unitário:</span>
                  <span className="font-mono text-slate-200">
                    R$ {invoice.produtoValorUnitario || xml.produtoValorUnitario || invoice.valorProdutos}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Subtotal Item:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    R$ {invoice.valorProdutos}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Grid 3 Columns: Impostos, Transporte, Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* 3. Impostos */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Percent className="w-3 h-3 text-amber-400" />
                3. Impostos (SEFAZ)
              </span>
              <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">ICMS CST/CSOSN:</span>
                  <span>{invoice.icmsCstCsosn || xml.icmsCstCsosn || '102'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base ICMS:</span>
                  <span>R$ {invoice.totalBaseIcms || xml.totalBaseIcms || invoice.valorProdutos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor ICMS:</span>
                  <span>R$ {invoice.totalValorIcms || xml.totalValorIcms || '0,00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PIS / COFINS:</span>
                  <span>R$ {invoice.totalPis || xml.totalPis || '0,00'} / R$ {invoice.totalCofins || xml.totalCofins || '0,00'}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1">
                  <span className="text-slate-500">Trib. Aprox:</span>
                  <span className="text-amber-300 font-bold">R$ {invoice.totalTributosAprox || xml.totalTributosAprox || '0,00'}</span>
                </div>
              </div>
            </div>

            {/* 4. Transporte */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="font-extrabold text-blue-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Truck className="w-3 h-3 text-blue-400" />
                4. Transporte & Frete
              </span>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Modalidade:</span>
                  <span className="truncate block font-medium">
                    {invoice.transporteModalidadeFrete || xml.transporteModalidadeFrete || '0 - Frete CIF (Remetente)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Transportadora:</span>
                  <span className="font-bold text-slate-200">
                    {invoice.transportadoraNome || xml.transportadoraNome || 'Correios / Mercado Envios'}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>Volumes: {invoice.transporteVolumeQuantidade || xml.transporteVolumeQuantidade || '1'}</span>
                  <span>Peso: {invoice.transporteVolumePesoBruto || xml.transporteVolumePesoBruto || '0,300'} kg</span>
                </div>
              </div>
            </div>

            {/* 5. Pagamento & Cobrança */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="font-extrabold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-emerald-400" />
                5. Cobrança & Pagamento
              </span>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Forma de Pagamento:</span>
                  <span className="font-bold text-emerald-300">
                    {invoice.pagamentoForma || xml.pagamentoForma || '17 - PIX'}
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Valor Pago:</span>
                  <span className="font-bold text-white">R$ {invoice.valorNota}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Condição: {invoice.cobrancaDuplicatasResumo || xml.cobrancaDuplicatasResumo || 'À Vista'}
                </div>
              </div>
            </div>

          </div>

          {/* Informações Complementares (infCpl) */}
          {(invoice.informacoesComplementares || xml.informacoesComplementares) && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                Informações Complementares da NF-e (infCpl)
              </span>
              <p className="text-[11px] text-slate-300 font-mono bg-black/40 p-2 rounded-lg border border-slate-800 select-all">
                {invoice.informacoesComplementares || xml.informacoesComplementares}
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 font-mono truncate max-w-xs">
            Arquivo: {invoice.origemArquivo || 'XML_SEFAZ.xml'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

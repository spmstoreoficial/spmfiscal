import React, { useState } from 'react';
import {
  BarChart3,
  Copy,
  Check,
  Sparkles,
  Clock,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Database,
  Code
} from 'lucide-react';
import { PowerBiConfig } from '../types';

interface PowerBiViewProps {
  invoicesCount: number;
}

export const PowerBiView: React.FC<PowerBiViewProps> = ({ invoicesCount }) => {
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Origin URL for Power BI Feed
  const feedUrl = `${window.location.origin}/api/powerbi/feed`;

  const powerQueryMCode = `let
    Source = Json.Document(Web.Contents("${feedUrl}")),
    data = Source[data],
    #"Converted to Table" = Table.FromList(data, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column" = Table.ExpandRecordColumn(#"Converted to Table", "Column1", {
        "id", "nome", "documento", "dataSaida", "endereco", 
        "bairro", "cep", "municipio", "uf", "fatura", 
        "valorProdutos", "valorNota", "desconto", "codigo", 
        "quantidade", "descricao", "cor", "origem"
    })
in
    #"Expanded Column"`;

  const handleCopyFeed = () => {
    navigator.clipboard.writeText(feedUrl);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2000);
  };

  const handleCopyMCode = () => {
    navigator.clipboard.writeText(powerQueryMCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <span>Conexão & Atualização Power BI (17 Campos SPM Store)</span>
            </h2>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
              JSON REST API Feed
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Conecte o Power BI diretamente ao seu banco de dados para relatórios visuais automatizados e atualizações agendadas.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={feedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-sm"
          >
            <span>Testar Feed JSON</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Endpoint & Connection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Endpoint Box */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>URL do Feed em Tempo Real para Power BI</span>
            </h3>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono font-bold">
              {invoicesCount} registros disponíveis
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Cole esta URL no Power BI Desktop &gt; Obter Dados &gt; Da Web:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 font-mono text-xs outline-none select-all"
              />
              <button
                onClick={handleCopyFeed}
                className="px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shrink-0 flex items-center space-x-1"
              >
                {copiedFeed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFeed ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1">
            <p className="font-bold flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Configuração da Atualização Agendada:</span>
            </p>
            <p>1. No Power BI Service na Nuvem, acesse o conjunto de dados (Dataset).</p>
            <p>2. Configure a frequência de atualização para <strong>A cada 15 ou 30 minutos</strong>.</p>
          </div>
        </div>

        {/* Power Query M Code Box */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Code className="w-4 h-4 text-blue-600" />
              <span>Código Power Query (Editor Avançado)</span>
            </h3>
            <button
              onClick={handleCopyMCode}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar M Code</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-[#0F172A] p-3 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 border border-slate-800">
            <pre>{powerQueryMCode}</pre>
          </div>
        </div>

      </div>

    </div>
  );
};

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
  Code,
  Layers
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
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" /> Microsoft Power BI REST API
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Integração com Microsoft Power BI Desktop & Web
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Alimente seus relatórios e dashboards analíticos em tempo real via endpoint JSON com atualização incremental.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#020617] border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Feed Ativo ({invoicesCount} registros)</span>
          </span>
        </div>
      </div>

      {/* Connection Endpoint Box */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span>URL do Feed OData / REST JSON</span>
        </h3>
        <p className="text-xs text-slate-400">
          No Power BI Desktop, selecione <strong>Obter Dados &gt; Da Web</strong> e cole a URL abaixo:
        </p>

        <div className="flex items-center gap-2 bg-[#020617] border border-slate-800 rounded-xl p-2.5">
          <input
            type="text"
            readOnly
            value={feedUrl}
            className="w-full bg-transparent text-xs font-mono text-cyan-400 outline-none select-all"
          />
          <button
            onClick={handleCopyFeed}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shrink-0"
          >
            {copiedFeed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFeed ? 'Copiado!' : 'Copiar URL'}</span>
          </button>
        </div>
      </div>

      {/* Power Query M Code */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Code className="w-4 h-4 text-cyan-400" />
            <span>Script Power Query (Linguagem M)</span>
          </h3>
          <button
            onClick={handleCopyMCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Código Copiado!' : 'Copiar Script M'}</span>
          </button>
        </div>

        <pre className="bg-[#020617] border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
          {powerQueryMCode}
        </pre>
      </div>

    </div>
  );
};

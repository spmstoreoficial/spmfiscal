import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Save, 
  Send, 
  Workflow, 
  FolderSync, 
  MessageSquare, 
  FileSpreadsheet, 
  ShieldAlert, 
  Radio, 
  ExternalLink,
  Code2,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';
import { N8nConfig, Invoice } from '../types';
import { api } from '../lib/api';

interface N8nViewProps {
  invoicesCount: number;
  invoices?: Invoice[];
}

export const N8nView: React.FC<N8nViewProps> = ({ invoicesCount, invoices = [] }) => {
  const [config, setConfig] = useState<N8nConfig>({
    webhookUrl: 'https://seu-n8n.com/webhook/spm-fiscal-events',
    active: true,
    events: {
      newInvoices: true,
      duplicateDetected: true,
      mapCitySale: true,
      dailySummary: false
    },
    lastStatus: 'IDLE'
  });

  const [activeTab, setActiveTab] = useState<'config' | 'workflows' | 'payload' | 'guide'>('config');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; durationMs?: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedWfIndex, setCopiedWfIndex] = useState<number | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    api.getN8nConfig().then(cfg => {
      if (cfg) setConfig(cfg);
    }).catch(err => console.error('Erro ao carregar configurações do n8n:', err));
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      const updated = await api.updateN8nConfig(config);
      setConfig(updated);
      setSuccessMessage('Configurações do n8n salvas com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar n8n config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!config.webhookUrl) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testN8nWebhook(config.webhookUrl);
      setTestResult({
        success: res.success,
        message: res.response || `Conexão validada! Latência: ${res.durationMs}ms`,
        durationMs: res.durationMs
      });
      setConfig(prev => ({ ...prev, lastStatus: res.success ? 'SUCCESS' : 'ERROR', lastTrigger: new Date().toISOString() }));
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Falha ao conectar com o Webhook do n8n.'
      });
      setConfig(prev => ({ ...prev, lastStatus: 'ERROR' }));
    } finally {
      setIsTesting(false);
    }
  };

  // Modelos de Workflows Oficiais n8n
  const workflows = [
    {
      title: '1. Ingestão Automática do Google Drive -> SPM Fiscal',
      description: 'Monitora pasta do Google Drive a cada 1 min, baixa PDFs novos, envia para o SPM Fiscal e move para pasta Processadas.',
      icon: FolderSync,
      color: 'text-amber-500',
      badge: 'Entrada de Dados (Drive)',
      json: JSON.stringify({
        name: "SPM Fiscal - 1. Google Drive Auto Ingestion",
        nodes: [
          {
            parameters: {
              pollTimes: { item: [{ mode: "everyMinute" }] },
              triggerOn: "folder",
              folderToWatch: "1cqhLdzayHMwzLxdi60rucCEqvK0tfHOz",
              event: "fileCreated"
            },
            id: "drive-trigger",
            name: "Google Drive Trigger",
            type: "n8n-nodes-base.googleDriveTrigger",
            typeVersion: 1,
            position: [250, 300]
          },
          {
            parameters: { operation: "download", fileId: "={{ $json.id }}" },
            id: "drive-download",
            name: "Download PDF",
            type: "n8n-nodes-base.googleDrive",
            typeVersion: 3,
            position: [480, 300]
          },
          {
            parameters: {
              method: "POST",
              url: "https://gentle-rooms-send.loca.lt/api/drive/sync-pdf",
              sendHeaders: true,
              headerParameters: {
                parameters: [
                  { name: "Content-Type", value: "application/json" },
                  { name: "bypass-tunnel-reminder", value: "true" }
                ]
              },
              sendBody: true,
              specifyBody: "json",
              jsonBody: "={\n  \"filename\": \"{{ $('Google Drive Trigger').item.json.name }}\",\n  \"fileId\": \"{{ $('Google Drive Trigger').item.json.id }}\",\n  \"base64Pdf\": \"{{ $binary.data.data }}\",\n  \"timestamp\": \"{{ $now.toISO() }}\"\n}"
            },
            id: "http-spm-fiscal",
            name: "Enviar para SPM Fiscal",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.2,
            position: [720, 300]
          }
        ],
        connections: {
          "Google Drive Trigger": { main: [[{ node: "Download PDF", type: "main", index: 0 }]] },
          "Download PDF": { main: [[{ node: "Enviar para SPM Fiscal", type: "main", index: 0 }]] }
        }
      }, null, 2)
    },
    {
      title: '2. Notificações de Vendas no WhatsApp (Evolution API)',
      description: 'Recebe novas notas fiscais do SPM Fiscal e envia mensagem no WhatsApp com Cidade, Cliente, Valor e Itens.',
      icon: MessageSquare,
      color: 'text-emerald-500',
      badge: 'WhatsApp Notifier',
      json: JSON.stringify({
        name: "SPM Fiscal - 2. WhatsApp Notification",
        nodes: [
          {
            parameters: {
              httpMethod: "POST",
              path: "spm-fiscal-events",
              responseMode: "onReceived",
              options: {}
            },
            id: "webhook-input",
            name: "Webhook SPM Fiscal",
            type: "n8n-nodes-base.webhook",
            typeVersion: 1.1,
            position: [250, 300]
          },
          {
            parameters: {
              conditions: {
                string: [
                  { value1: "={{ $json.body.event }}", value2: "new_invoices" }
                ]
              }
            },
            id: "filter-new-invoices",
            name: "Filtrar Novas Notas",
            type: "n8n-nodes-base.if",
            typeVersion: 1,
            position: [480, 300]
          },
          {
            parameters: {
              method: "POST",
              url: "http://localhost:8080/message/sendText/SPM_STORE",
              sendHeaders: true,
              headerParameters: {
                parameters: [{ name: "apikey", value: "SUA_APIKEY_EVOLUTION" }]
              },
              sendBody: true,
              specifyBody: "json",
              jsonBody: "={\n  \"number\": \"5511999999999\",\n  \"text\": \"🚀 *NOVA NOTA FISCAL PROCESSADA - SPM STORE*\\n\\n👤 *Cliente:* {{ $json.body.data.invoices[0].nome }}\\n📍 *Cidade:* {{ $json.body.data.invoices[0].municipio }} / {{ $json.body.data.invoices[0].uf }}\\n💰 *Valor:* R$ {{ $json.body.data.invoices[0].valorNota }}\\n📦 *Item:* {{ $json.body.data.invoices[0].descricao }}\\n🛒 *Origem:* {{ $json.body.data.invoices[0].origem }}\"\n}"
            },
            id: "send-whatsapp",
            name: "Disparar WhatsApp",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.2,
            position: [720, 280]
          }
        ],
        connections: {
          "Webhook SPM Fiscal": { main: [[{ node: "Filtrar Novas Notas", type: "main", index: 0 }]] },
          "Filtrar Novas Notas": { main: [[{ node: "Disparar WhatsApp", type: "main", index: 0 }]] }
        }
      }, null, 2)
    },
    {
      title: '3. Sincronização Contínua com Google Sheets',
      description: 'Recebe cada nota fiscal do SPM Fiscal e insere diretamente nas 17 colunas da sua planilha do Google.',
      icon: FileSpreadsheet,
      color: 'text-blue-500',
      badge: 'Google Sheets Feed',
      json: JSON.stringify({
        name: "SPM Fiscal - 3. Google Sheets Realtime Sync",
        nodes: [
          {
            parameters: {
              httpMethod: "POST",
              path: "spm-fiscal-events",
              options: {}
            },
            id: "webhook-gsheets",
            name: "Webhook SPM Fiscal",
            type: "n8n-nodes-base.webhook",
            typeVersion: 1.1,
            position: [250, 300]
          },
          {
            parameters: {
              operation: "append",
              sheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
              range: "Notas_Fiscais_SPM!A:Q",
              options: {}
            },
            id: "append-sheets",
            name: "Google Sheets Append",
            type: "n8n-nodes-base.googleSheets",
            typeVersion: 4,
            position: [500, 300]
          }
        ],
        connections: {
          "Webhook SPM Fiscal": { main: [[{ node: "Google Sheets Append", type: "main", index: 0 }]] }
        }
      }, null, 2)
    },
    {
      title: '4. Alerta de Notas Duplicadas no Telegram / Discord',
      description: 'Detecta notas fiscais duplicadas e envia alerta com os dados do cliente e fatura repetida para prevenção de fraudes.',
      icon: ShieldAlert,
      color: 'text-rose-500',
      badge: 'Anti-Fraude & Auditoria',
      json: JSON.stringify({
        name: "SPM Fiscal - 4. Alerta Anti-Duplicidade Telegram",
        nodes: [
          {
            parameters: {
              httpMethod: "POST",
              path: "spm-fiscal-events",
              options: {}
            },
            id: "webhook-duplicates",
            name: "Webhook SPM Fiscal",
            type: "n8n-nodes-base.webhook",
            typeVersion: 1.1,
            position: [250, 300]
          },
          {
            parameters: {
              conditions: {
                string: [{ value1: "={{ $json.body.event }}", value2: "duplicate_detected" }]
              }
            },
            id: "if-duplicates",
            name: "Filtrar Duplicatas",
            type: "n8n-nodes-base.if",
            typeVersion: 1,
            position: [480, 300]
          },
          {
            parameters: {
              chatId: "-1001234567890",
              text: "⚠️ *ALERTA FISCAL: NOTA DUPLICADA IDENTIFICADA*\\n\\n📄 *Fatura:* {{ $json.body.data.duplicates[0].fatura }}\\n👤 *Cliente:* {{ $json.body.data.duplicates[0].nome }}\\n🆔 *CPF/CNPJ:* {{ $json.body.data.duplicates[0].documento }}\\n❌ *Motivo:* {{ $json.body.data.duplicates[0].motivo }}\\n\\n_O registro foi bloqueado automaticamente pelo SPM Fiscal._",
              additionalFields: { parse_mode: "Markdown" }
            },
            id: "send-telegram",
            name: "Enviar Alerta Telegram",
            type: "n8n-nodes-base.telegram",
            typeVersion: 1.1,
            position: [720, 280]
          }
        ],
        connections: {
          "Webhook SPM Fiscal": { main: [[{ node: "Filtrar Duplicatas", type: "main", index: 0 }]] },
          "Filtrar Duplicatas": { main: [[{ node: "Enviar Alerta Telegram", type: "main", index: 0 }]] }
        }
      }, null, 2)
    }
  ];

  const handleCopyWorkflow = (json: string, index: number) => {
    navigator.clipboard.writeText(json);
    setCopiedWfIndex(index);
    setTimeout(() => setCopiedWfIndex(null), 2500);
  };

  const samplePayloadJson = JSON.stringify({
    event: "new_invoices",
    timestamp: new Date().toISOString(),
    source: "SPM_STORE_FISCAL_SYSTEM",
    data: {
      source: "GOOGLE_DRIVE_FOLDER",
      filename: "DANFE_SPM_99212.pdf",
      count: 1,
      invoices: [
        {
          nome: "RICARDO OLIVEIRA SANTOS",
          documento: "123.456.789-00",
          dataSaida: "24/08/2026",
          endereco: "AV PAULISTA 1000",
          bairro: "BELA VISTA",
          cep: "01310-100",
          municipio: "São Paulo",
          uf: "SP",
          fatura: "99212",
          valorProdutos: "189,90",
          valorNota: "189,90",
          desconto: "0,00",
          codigo: "SPM-VERNIZ-BLACK",
          quantidade: "1",
          descricao: "VERNIZ AUTOMOTIVO PREMIUM PRETO",
          cor: "Preto",
          origem: "Shopee"
        }
      ]
    }
  }, null, 2);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1E1B4B] to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Workflow className="w-6 h-6 text-orange-400" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Central de Automação n8n & Webhooks
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${
                config.lastStatus === 'SUCCESS' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span>{config.lastStatus === 'SUCCESS' ? 'Conectado ao n8n' : 'Pronto para Integração'}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Integração completa via n8n: receba PDFs do Google Drive, sincronize com Google Sheets, dispare mensagens no WhatsApp e envie alertas de duplicidade em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestWebhook}
              disabled={isTesting || !config.webhookUrl}
              className="px-3.5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-orange-900/30 cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testando Conexão...' : 'Testar Webhook no n8n'}</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-4 text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'config' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Configurações & Gatilhos</span>
          </button>

          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'workflows' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Workflows Prontos para o n8n ({workflows.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payload')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'payload' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Estrutura do Payload (JSON)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'guide' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Guia Passo a Passo</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Tab: Config & Triggers */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-orange-600" />
                <span>Configuração do Webhook n8n (Saída)</span>
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                config.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {config.active ? 'Ativo' : 'Pausado'}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">URL do Webhook Receptor no n8n</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={config.webhookUrl}
                    onChange={e => setConfig({ ...config, webhookUrl: e.target.value })}
                    placeholder="https://seu-n8n.com/webhook/spm-fiscal-events"
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none font-mono text-xs focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleTestWebhook}
                    disabled={isTesting || !config.webhookUrl}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? 'Testando...' : 'Testar'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cole aqui a URL do nó <strong>Webhook</strong> criado no seu n8n.
                </p>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2.5 ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span className="truncate">{testResult.message}</span>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-2">
                  Eventos que Disparam o Webhook para o n8n:
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.events.newInvoices}
                      onChange={e => setConfig({
                        ...config,
                        events: { ...config.events, newInvoices: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-800">⚡ Novas Notas Fiscais Processadas</span>
                      <p className="text-[10px] text-slate-500">Envia os 17 campos de cada nova nota do PDF, Google Drive ou Excel</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.events.duplicateDetected}
                      onChange={e => setConfig({
                        ...config,
                        events: { ...config.events, duplicateDetected: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-800">⚠️ Alerta de Notas Duplicadas</span>
                      <p className="text-[10px] text-slate-500">Notifica quando uma fatura repetida é identificada e bloqueada</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.events.mapCitySale}
                      onChange={e => setConfig({
                        ...config,
                        events: { ...config.events, mapCitySale: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-800">🗺️ Vendas Geográficas no Mapa do Brasil</span>
                      <p className="text-[10px] text-slate-500">Dispara evento com Cidade, UF e coordenadas de cada venda</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Último disparo: {config.lastTrigger ? new Date(config.lastTrigger).toLocaleString('pt-BR') : 'Nenhum'}
                </span>

                <button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Parâmetros'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Resumo e Status dos Endpoints */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Endpoints Disponíveis para o n8n</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 font-mono">POST /api/drive/sync-pdf</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Entrada (Drive)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    O n8n envia os PDFs do Google Drive em Base64 para o SPM Fiscal extrair e salvar no MySQL.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700 font-mono">POST (Seu Webhook n8n)</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Saída (Eventos)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    O SPM Fiscal envia eventos de novas notas, duplicidades e faturamento para o n8n distribuir.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700 font-mono">GET /api/invoices</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Consulta API</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    O n8n pode consultar qualquer nota fiscal ou faturamento com filtros por data, marketplace e UF.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('workflows')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                <Layers className="w-4 h-4 text-orange-400" />
                <span>Ver Workflows Prontos para Copiar & Colar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Ready-to-import Workflows */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((wf, idx) => {
              const IconComp = wf.icon;
              return (
                <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-xl bg-slate-100 ${wf.color}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{wf.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{wf.badge}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {wf.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">Formato n8n JSON (Ctrl+V)</span>
                    <button
                      onClick={() => handleCopyWorkflow(wf.json, idx)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      {copiedWfIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Workflow JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Payload Structure */}
      {activeTab === 'payload' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-orange-600" />
                <span>Exemplo do Payload JSON enviado pelo SPM Fiscal ao n8n</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Estrutura exata dos dados recebidos no nó Webhook do seu workflow
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(samplePayloadJson);
                setCopiedPayload(true);
                setTimeout(() => setCopiedPayload(false), 2000);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPayload ? 'Copiado!' : 'Copiar Payload'}</span>
            </button>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[420px] border border-slate-800 leading-relaxed">
            <pre>{samplePayloadJson}</pre>
          </div>
        </div>
      )}

      {/* Tab: Guide */}
      {activeTab === 'guide' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-orange-600" />
              <span>Como Importar e Ativar os Fluxos no n8n (3 Passos)</span>
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Você pode importar qualquer um dos 4 fluxos diretamente para a tela do seu n8n
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">1</span>
                <span>Copiar o Workflow JSON</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Na aba <strong>"Workflows Prontos"</strong> acima, clique em <strong>"Copiar Workflow JSON"</strong> no fluxo que deseja utilizar.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">2</span>
                <span>Colar no n8n (Ctrl + V)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Abra seu painel do n8n, crie um novo Workflow em branco, clique no canvas e pressione <strong>Ctrl + V</strong>. Todos os nós e conexões aparecerão montados na hora!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">3</span>
                <span>Ativar o Fluxo</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Conecte suas credenciais do Google Drive ou WhatsApp no n8n e mude a chave para <strong>Active (Ativo)</strong> no topo do n8n.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

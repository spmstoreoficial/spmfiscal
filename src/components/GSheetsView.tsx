import React, { useState, useEffect } from 'react';
import { 
  Table, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Code, 
  Settings2, 
  Save, 
  FileCode, 
  Download, 
  ClipboardCheck, 
  Send, 
  Zap, 
  HelpCircle, 
  FolderSync, 
  FolderArchive,
  CloudLightning,
  FileSpreadsheet,
  Cpu
} from 'lucide-react';
import { GSheetsConfig, Invoice } from '../types';
import { api } from '../lib/api';

interface GSheetsViewProps {
  invoicesCount: number;
  invoices?: Invoice[];
}

export const GSheetsView: React.FC<GSheetsViewProps> = ({ invoicesCount, invoices = [] }) => {
  const [config, setConfig] = useState<GSheetsConfig>({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    sheetName: 'Notas_Fiscais_SPM',
    autoSync: true,
    lastSync: new Date().toISOString(),
    status: 'CONNECTED',
    webhookUrl: 'https://script.google.com/macros/s/AKfycbw-spm-fiscal-sync/exec'
  });

  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'script' | 'drive' | 'tutorial'>('config');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<{ success: boolean; message: string; durationMs?: number } | null>(null);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedDriveScript, setCopiedDriveScript] = useState(false);
  const [copiedTable, setCopiedTable] = useState(false);
  
  // Google Drive Folder config
  const [driveFolderId, setDriveFolderId] = useState('1cqhLdzayHMwzLxdi60rucCEqvK0tfHOz');
  const [driveServerUrl, setDriveServerUrl] = useState('https://gentle-rooms-send.loca.lt/api/drive/sync-pdf');

  useEffect(() => {
    api.getGSheetsConfig().then(cfg => {
      if (cfg) setConfig(cfg);
    }).catch(err => console.error('Error loading gsheets config:', err));
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMessage(null);
    setTestWebhookResult(null);
    try {
      const res = await api.syncGSheets();
      setConfig(prev => ({ ...prev, lastSync: res.lastSync, status: 'CONNECTED' }));
      setSyncSuccessMessage(`✅ Sincronização concluída! ${res.syncedCount} notas fiscais enviadas para o Google Sheets.`);
    } catch (err: any) {
      console.error('GSheets Sync Error:', err);
      setConfig(prev => ({ ...prev, status: 'ERROR' }));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!config.webhookUrl) return;
    setIsTestingWebhook(true);
    setTestWebhookResult(null);
    try {
      const res = await api.testGSheetsWebhook(config.webhookUrl);
      setTestWebhookResult({
        success: res.success,
        message: res.response || `Conexão bem-sucedida! Latência: ${res.durationMs}ms`,
        durationMs: res.durationMs
      });
    } catch (err: any) {
      setTestWebhookResult({
        success: false,
        message: err.message || 'Falha ao conectar com o Webhook do Google Apps Script.'
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSaveConfig = async () => {
    await api.updateGSheetsConfig(config);
    setSyncSuccessMessage('Configurações do Google Sheets salvas com sucesso.');
  };

  // 1-Click Copy formatado para Google Sheets (Tab-Separated Values)
  const handleCopyTableToClipboard = () => {
    const headers = [
      'NOME', 'CPF/CNPJ', 'DATA NF-e', 'ENDEREÇO', 'BAIRRO', 'CEP', 
      'CIDADE', 'UF', 'FATURAS', 'VALOR TOTAL', 'VALOR FINAL', 'DESCONTO', 
      'CÓDIGO', 'QUANTIDADE', 'DESCRIÇÃO', 'COR', 'MARKETPLACE'
    ];

    const rows = invoices.map(inv => [
      inv.nome || '',
      inv.documento || '',
      inv.dataSaida || '',
      inv.endereco || '',
      inv.bairro || '',
      inv.cep || '',
      inv.municipio || '',
      inv.uf || '',
      inv.fatura || '',
      inv.valorProdutos || '0,00',
      inv.valorNota || '0,00',
      inv.desconto || '0,00',
      inv.codigo || '',
      inv.quantidade || '1',
      inv.descricao || '',
      inv.cor || 'Não identificada',
      inv.origem || 'Outros'
    ]);

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.map(cell => String(cell).replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(tsvContent);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 3000);
  };

  // Baixar arquivo TSV para importar diretamente no Google Sheets
  const handleDownloadTsv = () => {
    const headers = [
      'NOME', 'CPF/CNPJ', 'DATA NF-e', 'ENDEREÇO', 'BAIRRO', 'CEP', 
      'CIDADE', 'UF', 'FATURAS', 'VALOR TOTAL', 'VALOR FINAL', 'DESCONTO', 
      'CÓDIGO', 'QUANTIDADE', 'DESCRIÇÃO', 'COR', 'MARKETPLACE'
    ];

    const rows = invoices.map(inv => [
      inv.nome || '',
      inv.documento || '',
      inv.dataSaida || '',
      inv.endereco || '',
      inv.bairro || '',
      inv.cep || '',
      inv.municipio || '',
      inv.uf || '',
      inv.fatura || '',
      inv.valorProdutos || '0,00',
      inv.valorNota || '0,00',
      inv.desconto || '0,00',
      inv.codigo || '',
      inv.quantidade || '1',
      inv.descricao || '',
      inv.cor || 'Não identificada',
      inv.origem || 'Outros'
    ]);

    const tsvContent = '\uFEFF' + [
      headers.join('\t'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join('\t'))
    ].join('\n');

    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GoogleSheets_SPM_Fiscal_${new Date().toISOString().slice(0, 10)}.tsv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Código Apps Script Oficial para Google Sheets (doPost)
  const userGoogleAppsScriptCode = `/**
 * ==========================================================
 * SPM STORE - SISTEMA FISCAL & AUDITORIA DE NOTAS FISCAIS
 * Script Oficial para Google Sheets com Webhook em Tempo Real
 * ==========================================================
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('SPM Store - Notas Fiscais')
      .addItem('Sincronizar com Servidor', 'forcarSincronizacao')
      .addItem('Formatar Cabeçalho Oficial (17 Colunas)', 'criarCabecalhoOficial')
      .addToUi();
}

/**
 * Endpoint Webhook Receptor (doPost):
 * Recebe os dados em tempo real da aplicação SPM Fiscal (Node/MySQL)
 */
function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "";
    var payload = {};
    try {
      payload = JSON.parse(rawData);
    } catch(errJson) {
      payload = { action: 'ping' };
    }
    
    if (payload.action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'online',
        message: 'Conexão com Google Sheets validada com sucesso!',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = payload.sheetName || 'Notas_Fiscais_SPM';
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      criarCabecalhoOficial(sheet);
    }
    
    var invoices = payload.invoices || [];
    if (invoices.length > 0) {
      // Limpa dados anteriores a partir da linha 2
      var ultimaLinha = sheet.getLastRow();
      if (ultimaLinha > 1) {
        sheet.getRange(2, 1, ultimaLinha - 1, 17).clearContent();
      }
      
      var rows = [];
      for (var i = 0; i < invoices.length; i++) {
        var inv = invoices[i];
        rows.push([
          inv.nome || '',
          inv.documento || '',
          inv.dataSaida || '',
          inv.endereco || '',
          inv.bairro || '',
          inv.cep || '',
          inv.municipio || '',
          inv.uf || '',
          inv.fatura || '',
          inv.valorProdutos || '0,00',
          inv.valorNota || '0,00',
          inv.desconto || '0,00',
          inv.codigo || '',
          inv.quantidade || '1',
          inv.descricao || '',
          inv.cor || 'Não identificada',
          inv.origem || 'Outros'
        ]);
      }
      
      // Inserção em bloco de alta performance
      sheet.getRange(2, 1, rows.length, 17).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      syncedRows: invoices.length,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    system: 'SPM Store Fiscal Webhook API',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function criarCabecalhoOficial(targetSheet) {
  var sheet = targetSheet || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = [
    'NOME', 'CPF/CNPJ', 'DATA NF-e', 'ENDEREÇO', 'BAIRRO', 'CEP',
    'CIDADE', 'UF', 'FATURAS', 'VALOR TOTAL', 'VALOR FINAL', 'DESCONTO',
    'CÓDIGO', 'QUANTIDADE', 'DESCRIÇÃO', 'COR', 'MARKETPLACE'
  ];
  
  sheet.getRange(1, 1, 1, 17).setValues([headers]);
  var headerRange = sheet.getRange(1, 1, 1, 17);
  headerRange.setBackground('#1E293B');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
}

function forcarSincronizacao() {
  SpreadsheetApp.getUi().alert('Aviso', 'A sincronização é acionada automaticamente pelo SPM Fiscal via Webhook.', SpreadsheetApp.getUi().ButtonSet.OK);
}`;

  // Código Apps Script Monitor Automático do Google Drive
  const googleDriveWatcherScript = `/**
 * ==========================================================
 * SPM STORE - ROBÔ DE MONITORAMENTO DA PASTA GOOGLE DRIVE
 * Extrai automaticamente qualquer PDF colocado na pasta do Drive
 * e envia diretamente para o SPM Fiscal (MySQL / Mapa / SQL)
 * ==========================================================
 */

// 1. CONFIGURE AQUI O ID DA SUA PASTA DO GOOGLE DRIVE E A URL DO SISTEMA:
var CONFIG_DRIVE = {
  PASTA_ID: '${driveFolderId}', // ID extraído da URL da sua pasta do Google Drive
  SERVIDOR_URL: '${driveServerUrl}', // Endpoint do seu SPM Fiscal
  MOVER_PROCESSADOS: true, // Se true, move arquivos finalizados para a subpasta "Processadas"
  NOME_SUBPASTA_PROCESSADOS: 'Processadas'
};

/**
 * Função executada automaticamente a cada X minutos
 */
function monitorarPastaGoogleDrive() {
  if (!CONFIG_DRIVE.PASTA_ID || CONFIG_DRIVE.PASTA_ID.indexOf('SEU_ID') !== -1) {
    Logger.log('Atenção: Configure o ID da Pasta do Google Drive na variável CONFIG_DRIVE.PASTA_ID');
    return;
  }

  try {
    var pasta = DriveApp.getFolderById(CONFIG_DRIVE.PASTA_ID);
    var arquivos = pasta.getFilesByType(MimeType.PDF);
    var pastaProcessados = null;

    if (CONFIG_DRIVE.MOVER_PROCESSADOS) {
      var subpastas = pasta.getFoldersByName(CONFIG_DRIVE.NOME_SUBPASTA_PROCESSADOS);
      if (subpastas.hasNext()) {
        pastaProcessados = subpastas.next();
      } else {
        pastaProcessados = pasta.createFolder(CONFIG_DRIVE.NOME_SUBPASTA_PROCESSADOS);
      }
    }

    var totalProcessados = 0;

    while (arquivos.hasNext()) {
      var arquivo = arquivos.next();
      var nomeArquivo = arquivo.getName();

      // Pular arquivos já marcados
      if (nomeArquivo.indexOf('[PROCESSADO]') === 0) continue;

      Logger.log('Processando arquivo PDF: ' + nomeArquivo);

      // Obter conteúdo em Base64 para envio ao servidor
      var blob = arquivo.getBlob();
      var base64Data = Utilities.base64Encode(blob.getBytes());

      var payload = {
        filename: nomeArquivo,
        fileId: arquivo.getId(),
        base64Pdf: base64Data,
        driveFolderId: CONFIG_DRIVE.PASTA_ID,
        timestamp: new Date().toISOString()
      };

      var options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'bypass-tunnel-reminder': 'true',
          'User-Agent': 'GoogleAppsScript-SPM'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      var response = UrlFetchApp.fetch(CONFIG_DRIVE.SERVIDOR_URL, options);
      var responseCode = response.getResponseCode();
      var responseText = response.getContentText();

      Logger.log('Resposta do SPM Fiscal (' + responseCode + '): ' + responseText);

      if (responseCode >= 200 && responseCode < 300) {
        totalProcessados++;
        if (CONFIG_DRIVE.MOVER_PROCESSADOS && pastaProcessados) {
          arquivo.moveTo(pastaProcessados);
        } else {
          arquivo.setName('[PROCESSADO] ' + nomeArquivo);
        }
      }
    }

    Logger.log('Monitoramento concluído: ' + totalProcessados + ' arquivo(s) PDF sincronizado(s) no sistema!');

  } catch (err) {
    Logger.log('Erro no monitoramento do Google Drive: ' + err.message);
  }
}

/**
 * Agendar para rodar automaticamente de 5 em 5 minutos (24 horas por dia)
 */
function configurarMonitorAutomatico() {
  // Limpar gatilhos anteriores para não duplicar
  var gatilhos = ScriptApp.getProjectTriggers();
  for (var i = 0; i < gatilhos.length; i++) {
    if (gatilhos[i].getHandlerFunction() === 'monitorarPastaGoogleDrive') {
      ScriptApp.deleteTrigger(gatilhos[i]);
    }
  }

  // Criar novo gatilho a cada 5 minutos
  ScriptApp.newTrigger('monitorarPastaGoogleDrive')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Monitor Automático ativado com sucesso! O Google Drive verificará novos PDFs a cada 5 minutos.');
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(userGoogleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyDriveScript = () => {
    navigator.clipboard.writeText(googleDriveWatcherScript);
    setCopiedDriveScript(true);
    setTimeout(() => setCopiedDriveScript(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Table className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Sincronização com Google Sheets & Google Drive
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Webhook & Drive Watcher</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Integração completa: Sincronize dados com o Google Sheets e configure o monitor automático para ler qualquer PDF colocado em sua pasta do Google Drive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyTableToClipboard}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-blue-900/30 cursor-pointer"
              title="Copia todos os dados tabulados. Basta dar Ctrl+V na célula A1 do Google Sheets"
            >
              {copiedTable ? <Check className="w-4 h-4 text-emerald-300" /> : <ClipboardCheck className="w-4 h-4" />}
              <span>{copiedTable ? 'Copiado para Área de Transferência!' : 'Copiar para Google Sheets (Ctrl+V)'}</span>
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar via Webhook'}</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-4 text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'config' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Configurações & Webhook</span>
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'drive' ? 'bg-amber-500 text-slate-900' : 'text-amber-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>📁 Monitor Automático Google Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'preview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Pré-Visualização ({invoicesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'script' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Script Google Sheets (doPost)</span>
          </button>

          <button
            onClick={() => setActiveTab('tutorial')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'tutorial' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Passo a Passo</span>
          </button>
        </div>
      </div>

      {syncSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{syncSuccessMessage}</span>
        </div>
      )}

      {/* Tab: Google Drive Auto-Sync Watcher */}
      {activeTab === 'drive' && (
        <div className="space-y-6">
          
          {/* Google Drive para Desktop (100% Offline) Card */}
          <div className="bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#020617] border-2 border-emerald-500/50 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Monitoramento em Tempo Real (100% Offline)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
                    Unidade I:\
                  </span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Google Drive para Desktop Instalado
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl">
                  Ao salvar qualquer nota fiscal em PDF na pasta espelhada do Google Drive no seu computador, o SPM Fiscal faz a extração dos 17 campos e a inserção no MySQL automaticamente em segundo plano.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    try {
                      const res = await api.scanGDriveDesktop();
                      setSyncSuccessMessage(`✅ Google Drive Desktop (I:\\) sincronizado! ${res.count} novo(s) registro(s) salvo(s) no MySQL.`);
                    } catch (e: any) {
                      setSyncSuccessMessage(`ℹ️ Erro na sincronização: ${e.message}`);
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 border border-emerald-400/40 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Google Drive Agora'}</span>
                </button>
              </div>
            </div>

            {/* Path Box */}
            <div className="bg-[#020617] p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <FolderSync className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-mono text-cyan-400 font-bold truncate select-all">
                  I:\Meu Drive\SPM Store\SPM Verniz Elite\SPM Verniz\Verniz Elite SPM Pedidos\Notas_Fiscais
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('I:\\Meu Drive\\SPM Store\\SPM Verniz Elite\\SPM Verniz\\Verniz Elite SPM Pedidos\\Notas_Fiscais');
                  setCopiedDriveScript(true);
                  setTimeout(() => setCopiedDriveScript(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 border border-slate-700 shrink-0"
              >
                {copiedDriveScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDriveScript ? 'Copiado!' : 'Copiar Caminho'}</span>
              </button>
            </div>
          </div>

          {/* Apps Script Cloud Option (Optional) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0f172a]/95 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4 text-white">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <FolderSync className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Opção Nuvem: Google Apps Script Webhook</h3>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p className="text-slate-400 leading-relaxed">
                  Se você também desejar que a nuvem do Google Drive envie os arquivos para o servidor quando você não estiver usando o Google Drive para Desktop:
                </p>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">ID da Pasta do Google Drive (Nuvem)</label>
                  <input
                    type="text"
                    value={driveFolderId}
                    onChange={e => setDriveFolderId(e.target.value)}
                    placeholder="Ex: 1cqhLdzayHMwzLxdi60rucCEqvK0tfHOz"
                    className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none font-mono text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">URL do Endpoint no Servidor</label>
                  <input
                    type="text"
                    value={driveServerUrl}
                    onChange={e => setDriveServerUrl(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none font-mono text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Código do Monitor Automático do Drive */}
            <div className="bg-[#0f172a]/95 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">Script Google Apps Script (Drive Watcher)</h3>
                </div>

                <button
                  onClick={handleCopyDriveScript}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {copiedDriveScript ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Script Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#020617] p-3.5 rounded-xl text-xs font-mono text-amber-300 overflow-x-auto max-h-64 border border-slate-800 leading-relaxed">
                <pre>{googleDriveWatcherScript}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Settings & Webhook */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Settings2 className="w-4 h-4 text-blue-600" />
                <span>Parâmetros de Conexão com Google Sheets</span>
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                config.status === 'CONNECTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
              }`}>
                {config.status === 'CONNECTED' ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">URL do Webhook (Google Apps Script App da Web)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={config.webhookUrl || ''}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    onChange={e => setConfig({ ...config, webhookUrl: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none font-mono text-xs focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook || !config.webhookUrl}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingWebhook ? 'Testando...' : 'Testar Conexão'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  URL gerada ao publicar o script no Google Sheets como "Aplicativo da Web".
                </p>
              </div>

              {testWebhookResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2.5 ${
                  testWebhookResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testWebhookResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span className="truncate">{testWebhookResult.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">ID da Planilha Google Sheets</label>
                  <input
                    type="text"
                    value={config.spreadsheetId}
                    onChange={e => setConfig({ ...config, spreadsheetId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none font-mono text-xs focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-bold">Nome da Aba (Sheet Name)</label>
                  <input
                    type="text"
                    value={config.sheetName}
                    onChange={e => setConfig({ ...config, sheetName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none text-xs focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSyncCheck"
                    checked={config.autoSync}
                    onChange={e => setConfig({ ...config, autoSync: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <label htmlFor="autoSyncCheck" className="text-xs text-slate-800 font-bold cursor-pointer">
                    Sincronização Automática em Tempo Real
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight pl-6">
                  Ao extrair novos PDFs ou importar planilhas, os dados são transmitidos automaticamente para a planilha Google Sheets sem intervenção.
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Última sincronização: {config.lastSync ? new Date(config.lastSync).toLocaleString('pt-BR') : 'Nunca'}
                </span>

                <button
                  onClick={handleSaveConfig}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Parâmetros</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions & 1-Click Paste Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Modo Rápido: 1-Click Copiar & Colar no Google Sheets</span>
              </h3>

              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <p className="leading-relaxed">
                  Não quer configurar Webhook agora? Você pode exportar ou copiar todos os <strong>{invoicesCount} registros</strong> com os 17 cabeçalhos oficiais com um único clique.
                </p>

                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-blue-900">
                  <div className="font-bold flex items-center space-x-1.5">
                    <span>Instruções Rápidas:</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-blue-800">
                    <li>Clique no botão <strong>"Copiar para Google Sheets"</strong> abaixo.</li>
                    <li>Abra uma planilha em branco no Google Sheets.</li>
                    <li>Selecione a <strong>célula A1</strong> e pressione <strong>Ctrl + V</strong>.</li>
                    <li>Todas as 17 colunas e linhas serão coladas instantaneamente formatadas!</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleCopyTableToClipboard}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                {copiedTable ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTable ? 'Copiado com Sucesso!' : 'Copiar Dados Tabulados (Ctrl+V)'}</span>
              </button>

              <button
                onClick={handleDownloadTsv}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Arquivo TSV / CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Preview Data */}
      {activeTab === 'preview' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Visualização dos Dados Formatados para o Google Sheets</h3>
              <p className="text-slate-500 text-xs">Exibindo os 17 campos oficiais que são transmitidos para a planilha</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyTableToClipboard}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Tabela</span>
              </button>
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold text-xs">
                {invoices.length} Registros
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider sticky top-0 font-bold">
                <tr>
                  <th className="p-2.5">1. NOME</th>
                  <th className="p-2.5">2. CPF/CNPJ</th>
                  <th className="p-2.5">3. DATA NF-e</th>
                  <th className="p-2.5">4. ENDEREÇO</th>
                  <th className="p-2.5">5. BAIRRO</th>
                  <th className="p-2.5">6. CEP</th>
                  <th className="p-2.5">7. CIDADE</th>
                  <th className="p-2.5">8. UF</th>
                  <th className="p-2.5">9. FATURAS</th>
                  <th className="p-2.5">10. VALOR TOTAL</th>
                  <th className="p-2.5">11. VALOR FINAL</th>
                  <th className="p-2.5">12. DESCONTO</th>
                  <th className="p-2.5">13. CÓDIGO</th>
                  <th className="p-2.5">14. QUANTIDADE</th>
                  <th className="p-2.5">15. DESCRIÇÃO</th>
                  <th className="p-2.5">16. COR</th>
                  <th className="p-2.5">17. MARKETPLACE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id || idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{inv.nome}</td>
                    <td className="p-2.5 font-mono text-slate-600">{inv.documento}</td>
                    <td className="p-2.5 text-slate-600">{inv.dataSaida}</td>
                    <td className="p-2.5 text-slate-600 truncate max-w-xs">{inv.endereco}</td>
                    <td className="p-2.5 text-slate-600">{inv.bairro}</td>
                    <td className="p-2.5 font-mono text-slate-600">{inv.cep}</td>
                    <td className="p-2.5 text-slate-600">{inv.municipio}</td>
                    <td className="p-2.5 font-bold text-slate-800">{inv.uf}</td>
                    <td className="p-2.5 font-mono text-slate-700">{inv.fatura}</td>
                    <td className="p-2.5 font-mono">R$ {inv.valorProdutos}</td>
                    <td className="p-2.5 font-mono font-bold text-emerald-600">R$ {inv.valorNota}</td>
                    <td className="p-2.5 font-mono text-rose-600">R$ {inv.desconto}</td>
                    <td className="p-2.5 font-mono text-slate-800">{inv.codigo}</td>
                    <td className="p-2.5 text-center font-bold">{inv.quantidade}</td>
                    <td className="p-2.5 truncate max-w-xs">{inv.descricao}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border">
                        {inv.cor}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                        {inv.origem}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Google Apps Script Code */}
      {activeTab === 'script' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <span>Script do Google Apps Script com Receptor doPost em Tempo Real</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Cole este código no editor do Apps Script da sua planilha no Google Sheets
              </p>
            </div>
            
            <button
              onClick={handleCopyScript}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              {copiedScript ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Todo o Código</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[480px] border border-slate-800 leading-relaxed">
            <pre>{userGoogleAppsScriptCode}</pre>
          </div>
        </div>
      )}

      {/* Tab: Step-by-Step Tutorial */}
      {activeTab === 'tutorial' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span>Como Configurar o Webhook no Google Sheets (Passo a Passo)</span>
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Siga os 4 passos simples para habilitar a sincronização automática em tempo real com a sua planilha
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                <span>Abrir o Editor de Scripts</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Abra a sua planilha no Google Sheets, clique no menu superior em <strong>Extensões</strong> &gt; <strong>Apps Script</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                <span>Colar o Código</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Apague qualquer código existente no arquivo <code className="bg-slate-200 px-1 rounded">Código.gs</code>, copie o código da aba <strong>"Script Google Sheets"</strong> e cole no editor. Em seguida, clique em <strong>Salvar (Ícone de disquete)</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                <span>Implantar como App da Web</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                No canto superior direito, clique em <strong>Implantar</strong> &gt; <strong>Nova implantação</strong>. Selecione o tipo <strong>Aplicativo da Web</strong>. Em <em>"Quem pode acessar"</em>, selecione <strong>Qualquer pessoa</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">4</span>
                <span>Colar a URL no SPM Fiscal</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Copie a <strong>URL do aplicativo da Web</strong> fornecida pelo Google e cole no campo <strong>"URL do Webhook"</strong> nesta aba. Clique em <strong>Salvar Parâmetros</strong> e depois em <strong>Testar Conexão</strong>!
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

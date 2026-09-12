import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Zap,
  Send,
  Database,
  Layers
} from 'lucide-react';
import { GSheetsConfig, Invoice } from '../types';
import { api } from '../lib/api';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoicesCount: number;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  invoicesCount
}) => {
  const [config, setConfig] = useState<GSheetsConfig>({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    sheetName: 'Notas_Fiscais_SPM',
    autoSync: true,
    lastSync: new Date().toISOString(),
    status: 'CONNECTED',
    webhookUrl: 'https://script.google.com/macros/s/AKfycbw-spm-fiscal-sync/exec'
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getGSheetsConfig().then(cfg => {
        if (cfg) setConfig(cfg);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await api.syncGSheets();
      setConfig(prev => ({ ...prev, lastSync: res.lastSync, status: 'CONNECTED' }));
      setSuccessMsg(`✅ Sincronizado com sucesso! ${res.syncedCount || invoicesCount} registros enviados.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao sincronizar com Google Sheets');
      setConfig(prev => ({ ...prev, status: 'ERROR' }));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await api.updateGSheetsConfig(config);
      setSuccessMsg('Configurações salvas no MySQL & LocalStorage.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Integração Google Sheets & Banco de Dados
              </h3>
              <p className="text-xs text-slate-400">
                Sincronização em tempo real das notas fiscais e dados operacionais
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
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Status Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-white">Status da Conexão:</span>
              <span className="text-emerald-400 font-extrabold font-mono">CONECTADO</span>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </button>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                ID da Planilha Google Sheets
              </label>
              <input
                type="text"
                value={config.spreadsheetId}
                onChange={e => setConfig({ ...config, spreadsheetId: e.target.value })}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Nome da Aba / Página
              </label>
              <input
                type="text"
                value={config.sheetName}
                onChange={e => setConfig({ ...config, sheetName: e.target.value })}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Webhook URL (Google Apps Script / n8n)
              </label>
              <input
                type="text"
                value={config.webhookUrl || ''}
                onChange={e => setConfig({ ...config, webhookUrl: e.target.value })}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none focus:border-cyan-500"
                placeholder="https://script.google.com/macros/s/.../exec"
              />
            </div>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Fechar
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  Mail, 
  Smartphone, 
  Plus, 
  Trash2, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  X,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { AlertRule, SystemSettings } from '../types';
import { api } from '../lib/api';

export const AlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('josegaldino@hotmail.com.br');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isNewAlertModalOpen, setIsNewAlertModalOpen] = useState(false);

  // New alert form
  const [newAlert, setNewAlert] = useState<Partial<AlertRule>>({
    name: 'Alerta de Inconsistência de Impostos',
    type: 'HIGH_TAX',
    threshold: 18,
    emailNotify: true,
    pushNotify: true,
    active: true
  });

  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data || []);
    } catch (err) {
      console.error('Error loading alerts:', err);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleToggleAlert = async (id: string, active: boolean) => {
    await api.updateAlert(id, { active: !active });
    loadAlerts();
  };

  const handleDeleteAlert = async (id: string) => {
    await api.deleteAlert(id);
    loadAlerts();
  };

  const handleCreateAlert = async () => {
    await api.createAlert(newAlert);
    setIsNewAlertModalOpen(false);
    loadAlerts();
  };

  const handleTestEmail = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await api.sendTestEmail(recipientEmail);
      setTestResult(`✅ E-mail enviado com sucesso para ${recipientEmail}!`);
    } catch (err: any) {
      setTestResult(`❌ Erro no envio de e-mail: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleTestPush = async () => {
    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('SISTEMA FISCAL - ALERTA EM TEMPO REAL', {
            body: 'Processamento de notas fiscais concluído com sucesso. DANFEs inseridos no MySQL.',
            icon: '/favicon.ico'
          });
        }
      }
      await api.sendTestPush();
      setTestResult('✅ Notificação Push disparada para os dispositivos móveis conectados!');
    } catch (err: any) {
      setTestResult(`❌ Erro na notificação push: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" /> Auditoria Fiscal Contínua
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Regras de Alertas & Notificações em Tempo Real
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Disparo automático de e-mail e push notifications ao identificar notas de alto valor, erros de extração ou anomalias fiscais.
          </p>
        </div>

        <button
          onClick={() => setIsNewAlertModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/20 border border-rose-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Regra de Alerta</span>
        </button>
      </div>

      {testResult && (
        <div className="p-4 rounded-xl bg-[#020617] border border-slate-800 text-slate-200 text-xs flex items-center justify-between shadow-lg">
          <span className="font-medium">{testResult}</span>
          <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Alert Rules + Test Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Alert Rules List */}
        <div className="lg:col-span-2 bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-white text-sm">Regras de Alerta Ativas ({alerts.length})</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Tempo Real</span>
          </div>

          <div className="space-y-3">
            {alerts.map((alt) => (
              <div 
                key={alt.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  alt.active 
                    ? 'bg-[#020617] border-slate-800 hover:border-slate-700' 
                    : 'bg-[#020617]/50 border-slate-900 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-xs">{alt.name}</h4>
                    {alt.threshold && (
                      <span className="bg-slate-800 text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-slate-700">
                        Limite: {alt.threshold}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-cyan-400" />
                      <span>E-mail: {alt.emailNotify ? 'Ativo' : 'Desativado'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-emerald-400" />
                      <span>Push Móvel: {alt.pushNotify ? 'Ativo' : 'Desativado'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAlert(alt.id, alt.active)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    {alt.active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(alt.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Console */}
        <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Send className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">Console de Disparo de Testes</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">E-mail de Destino</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none font-mono focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <button
              onClick={handleTestEmail}
              disabled={isSendingTest}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-lg shadow-cyan-600/20 disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              <span>{isSendingTest ? 'Disparando...' : 'Enviar E-mail de Teste'}</span>
            </button>

            <button
              onClick={handleTestPush}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20"
            >
              <Smartphone className="w-4 h-4" />
              <span>Disparar Notificação Push</span>
            </button>
          </div>
        </div>

      </div>

      {/* New Alert Modal */}
      {isNewAlertModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Nova Regra de Alerta</h3>
              <button onClick={() => setIsNewAlertModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nome da Regra</label>
                <input
                  type="text"
                  value={newAlert.name}
                  onChange={e => setNewAlert({ ...newAlert, name: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Tipo de Evento</label>
                <select
                  value={newAlert.type}
                  onChange={e => setNewAlert({ ...newAlert, type: e.target.value as any })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="HIGH_VALUE">Nota Fiscal de Alto Valor</option>
                  <option value="HIGH_TAX">Alíquota Tributária Elevada</option>
                  <option value="BATCH_COMPLETE">Conclusão de Lote de PDFs</option>
                  <option value="EXTRACTION_ERROR">Erro de Leitura/Extração</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Valor Limite (Threshold R$ / %)</label>
                <input
                  type="number"
                  value={newAlert.threshold || 0}
                  onChange={e => setNewAlert({ ...newAlert, threshold: Number(e.target.value) })}
                  className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setIsNewAlertModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 border border-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAlert}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 shadow-lg shadow-rose-600/30"
              >
                Salvar Alerta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

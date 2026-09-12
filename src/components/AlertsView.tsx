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
  ToggleRight
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
            body: 'Processamento de notas fiscais concluído com sucesso. 7 novos DANFEs inseridos.',
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
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <BellRing className="w-5 h-5 text-rose-600" />
              <span>Sistema de Alertas & Notificações em Tempo Real</span>
            </h2>
            <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-bold">
              E-mail & Push Dispositivos Móveis
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Notificações automáticas ao concluir extrações, identificar notas de alto valor ou divergências tributárias.
          </p>
        </div>

        <button
          onClick={() => setIsNewAlertModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Regra de Alerta</span>
        </button>
      </div>

      {testResult && (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center justify-between shadow-sm">
          <span className="font-medium">{testResult}</span>
          <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Alert Rules + Test Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Alert Rules List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
            <BellRing className="w-4 h-4 text-rose-600" />
            <span>Regras de Alerta Configuradas ({alerts.length})</span>
          </h3>

          <div className="space-y-3">
            {alerts.map((alt) => (
              <div 
                key={alt.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  alt.active 
                    ? 'bg-slate-50 border-slate-200' 
                    : 'bg-slate-50/50 border-slate-100 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-900 text-xs">{alt.name}</h4>
                    {alt.threshold && (
                      <span className="bg-slate-200 text-slate-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                        Limite: {alt.threshold}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1 font-medium">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-blue-600" />
                      <span>E-mail: {alt.emailNotify ? 'Ativo' : 'Desativado'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Smartphone className="w-3 h-3 text-emerald-600" />
                      <span>Push Móvel: {alt.pushNotify ? 'Ativo' : 'Desativado'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleAlert(alt.id, alt.active)}
                    className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    {alt.active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(alt.id)}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Console */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Send className="w-4 h-4 text-blue-600" />
            <span>Console de Testes de Disparo</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">E-mail de Destino para Teste</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none font-mono focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <button
              onClick={handleTestEmail}
              disabled={isSendingTest}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Enviar E-mail de Teste</span>
            </button>

            <button
              onClick={handleTestPush}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              <span>Disparar Notificação Push Móvel</span>
            </button>
          </div>
        </div>

      </div>

      {/* New Alert Modal */}
      {isNewAlertModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Nova Regra de Alerta</h3>
              <button onClick={() => setIsNewAlertModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Nome da Regra</label>
                <input
                  type="text"
                  value={newAlert.name}
                  onChange={e => setNewAlert({ ...newAlert, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tipo de Evento</label>
                <select
                  value={newAlert.type}
                  onChange={e => setNewAlert({ ...newAlert, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="HIGH_VALUE">Nota Fiscal de Alto Valor</option>
                  <option value="HIGH_TAX">Aliquota de Imposto Elevada</option>
                  <option value="BATCH_COMPLETE">Conclusão de Lote de PDFs</option>
                  <option value="EXTRACTION_ERROR">Erro de Leitura/Extração</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Valor Limite (Threshold R$ / %)</label>
                <input
                  type="number"
                  value={newAlert.threshold || 0}
                  onChange={e => setNewAlert({ ...newAlert, threshold: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                onClick={() => setIsNewAlertModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAlert}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 shadow-sm"
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

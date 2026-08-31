import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  Server, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenSyncModal: () => void;
  onOpenLoginModal: () => void;
  syncStatus: string;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenSyncModal,
  onOpenLoginModal,
  syncStatus,
  isSyncing,
  onTriggerSync
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    MANAGER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    AUDITOR: 'bg-amber-100 text-amber-800 border-amber-200'
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente Fiscal',
    AUDITOR: 'Auditor'
  };

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & System Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-9 px-1.5 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm text-white font-bold text-sm tracking-tight">
            SPM
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                SPM Store Sistema Fiscal & Auditoria NFs
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                Sincronizado
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Extração Automática PDF • Google Sheets • Power BI
            </p>
          </div>
        </div>

        {/* Sync Badges & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Realtime Sync Button */}
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            title="Sincronizar dados em tempo real com Excel e Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Sheets</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Power BI Status Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Power BI Ativo</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 relative transition border border-slate-200"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-slate-800 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 font-bold flex justify-between items-center text-slate-900">
                  <span>Central de Alertas em Tempo Real</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                    3 Recentes
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition">
                    <p className="font-semibold text-emerald-600">✅ Sincronização Google Sheets Concluída</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Planilha 'Notas Fiscais' atualizada em tempo real.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Há 5 minutos</span>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition">
                    <p className="font-semibold text-blue-600">📄 Lote de PDFs Extraído com Sucesso</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">7 arquivos processados via motor universal DANFE.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Há 12 minutos</span>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition">
                    <p className="font-semibold text-amber-600">⚠️ Alerta de Nota Fiscal Elevada</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">NF MLB-990182 no valor de R$ 2.400,00 detectada.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Há 1 hora</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Auth */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-semibold ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
            >
              Entrar
            </button>
          )}

        </div>

      </div>
    </header>
  );
};

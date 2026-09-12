import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Sliders,
  Volume2,
  VolumeX,
  Tv,
  CheckCircle2,
  AlertCircle,
  Shield,
  Radio,
  Sparkles,
  BarChart3,
  Download,
  MoreVertical,
  Trophy,
  X,
  LogOut,
  Users,
  MapPin,
  Database,
  Layers,
  Package
} from 'lucide-react';
import { User } from '../types';

export type MainViewType = 'mapa' | 'graficos_integracao' | 'rankings' | 'stock' | 'database';

interface TVDashboardHeaderProps {
  activeView: MainViewType;
  onChangeView: (view: MainViewType) => void;
  onRefreshData: () => void;
  isSyncing: boolean;
  onOpenUploadModal: () => void;
  onOpenGSheetsModal: () => void;
  onOpenExportModal: () => void;
  onOpenUserManagement?: () => void;
  onOpenSettings?: () => void;
  totalInvoicesCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const TVDashboardHeader: React.FC<TVDashboardHeaderProps> = ({
  activeView,
  onChangeView,
  onRefreshData,
  isSyncing,
  onOpenUploadModal,
  onOpenGSheetsModal,
  onOpenExportModal,
  onOpenUserManagement,
  onOpenSettings,
  totalInvoicesCount,
  soundEnabled,
  onToggleSound,
  currentUser,
  onLogout
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Real-time clock with seconds
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const dateStr = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="bg-[#0b1329] border-b border-cyan-500/30 text-white px-2.5 sm:px-4 py-2 shadow-2xl relative z-30 w-full shrink-0">
      <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
        
        {/* Left: Branding & Status Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-wide bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                  SPM STORE
                </span>
                <span className="hidden sm:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/30">
                  Fiscal & NFs
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Centro de Comando & Auditoria de Notas Fiscais
              </p>
            </div>
          </div>

          {/* Sync / Connection Indicator */}
          <button
            onClick={onOpenGSheetsModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/60 transition text-xs group"
            title="Sincronização Ativa com MySQL e Google Sheets"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-emerald-400 hidden md:inline">
              ONLINE
            </span>
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
          </button>
        </div>

        {/* Center: View Switcher Tabs (Desktop) */}
        <div className="hidden lg:flex items-center bg-[#020617] p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onChangeView('mapa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'mapa'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Mapa Operacional
          </button>

          <button
            onClick={() => onChangeView('graficos_integracao')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'graficos_integracao'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Gráficos & BI
          </button>

          <button
            onClick={() => onChangeView('rankings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'rankings'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Rankings
          </button>

          <button
            onClick={() => onChangeView('stock')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'stock'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Controle de Estoque
          </button>

          <button
            onClick={() => onChangeView('database')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'database'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Base Fiscal
          </button>
        </div>

        {/* Right: Clock & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Live Clock with seconds */}
          <div className="hidden xl:flex flex-col items-end pr-2 border-r border-slate-800">
            <div className="flex items-center gap-1.5 font-mono text-sm font-extrabold text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {currentTime}
            </div>
            <span className="text-[10px] text-slate-400 capitalize">
              {currentDate}
            </span>
          </div>

          {/* New Invoice / Upload Button */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(16,185,129,0.35)] transition transform active:scale-95"
            title="Importar DANFE / PDF com OCR IA"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Importar DANFE</span>
          </button>

          {/* Refresh Data */}
          <button
            onClick={onRefreshData}
            disabled={isSyncing}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Atualizar</span>
          </button>

          {/* Export Reports */}
          <button
            onClick={onOpenExportModal}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs"
            title="Exportar Relatórios PDF e Excel"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Relatórios</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg border transition ${
              soundEnabled
                ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 hover:bg-slate-800'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Alertas Sonoros Ativos' : 'Alertas Sonoros Silenciados'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen TV Mode */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo TV / Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* User Management (if ADMIN/MANAGER) */}
          {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') && (
            <button
              onClick={onOpenUserManagement}
              className="hidden sm:flex p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition"
              title="Gerenciar Usuários"
            >
              <Users className="w-4 h-4 text-purple-400" />
            </button>
          )}

          {/* User / Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
              <span className="hidden xl:inline text-xs font-semibold text-slate-300 max-w-[120px] truncate">
                {currentUser.name}
              </span>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/60 text-rose-300 transition"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-2 pt-2 border-t border-slate-800 flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              onClick={() => { onChangeView('mapa'); setIsMobileMenuOpen(false); }}
              className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                activeView === 'mapa' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" /> Mapa
            </button>
            <button
              onClick={() => { onChangeView('graficos_integracao'); setIsMobileMenuOpen(false); }}
              className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                activeView === 'graficos_integracao' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Gráficos
            </button>
            <button
              onClick={() => { onChangeView('rankings'); setIsMobileMenuOpen(false); }}
              className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                activeView === 'rankings' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Rankings
            </button>
            <button
              onClick={() => { onChangeView('stock'); setIsMobileMenuOpen(false); }}
              className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                activeView === 'stock' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Estoque
            </button>
            <button
              onClick={() => { onChangeView('database'); setIsMobileMenuOpen(false); }}
              className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                activeView === 'database' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" /> Base Fiscal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

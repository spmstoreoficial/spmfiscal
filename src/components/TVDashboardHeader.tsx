import React, { useState, useEffect } from 'react';
import { ActiveTab } from './Sidebar';
import { User, TVModeConfig } from '../types';
import {
  Activity,
  Calendar,
  Clock,
  Maximize2,
  Minimize2,
  RefreshCw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Tv,
  FileText,
  Upload,
  Database,
  MapPin,
  ShieldAlert,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Users,
  Shield,
  Radio,
  Sparkles,
  Layers,
  LogOut,
  LogIn,
  CheckCircle2
} from 'lucide-react';

interface TVDashboardHeaderProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  tvConfig: TVModeConfig;
  onUpdateTVConfig: (cfg: Partial<TVModeConfig>) => void;
  onRefreshData: () => void;
  onTriggerSync: () => void;
  isSyncing: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  invoicesCount: number;
  totalFaturamento: number;
  cidadesCount: number;
  alertsCount: number;
}

export const TVDashboardHeader: React.FC<TVDashboardHeaderProps> = ({
  currentUser,
  activeTab,
  onChangeTab,
  tvConfig,
  onUpdateTVConfig,
  onRefreshData,
  onTriggerSync,
  isSyncing,
  onOpenLogin,
  onLogout,
  invoicesCount,
  totalFaturamento,
  cidadesCount,
  alertsCount
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Digital clock with seconds
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
      const dateStr = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => document.removeEventListener('fullscreenchange', handleFullscreen);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formattedFaturamento = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(totalFaturamento);

  const navTabs: { id: ActiveTab; label: string; icon: React.FC<any>; badge?: number | string; role?: string }[] = [
    { id: 'dashboard', label: 'Dashboard & Gráficos', icon: BarChart3 },
    { id: 'upload', label: 'Extração & DANFE', icon: Upload, badge: 'IA' },
    { id: 'database', label: 'Base de Dados NFs', icon: Database, badge: invoicesCount },
    { id: 'map', label: 'Mapa de Vendas Brasil', icon: MapPin, badge: cidadesCount > 0 ? `${cidadesCount} Cidades` : undefined },
    { id: 'alerts', label: 'Auditoria & Alertas', icon: ShieldAlert, badge: alertsCount > 0 ? alertsCount : undefined },
    { id: 'gsheets', label: 'Google Sheets', icon: FileSpreadsheet },
    { id: 'powerbi', label: 'Power BI', icon: Layers },
    { id: 'n8n', label: 'n8n Webhook', icon: Radio },
    { id: 'reports', label: 'Relatórios Fiscais', icon: FileText },
    { id: 'users', label: 'Usuários', icon: Users, role: 'ADMIN' },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <header className="bg-[#0f172a]/95 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 shadow-2xl transition-all">
      {/* Top Banner: Clock, Live Status, TV controls */}
      <div className="px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
        
        {/* Brand & System Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <span className="text-white font-extrabold text-sm tracking-wider font-mono">SPM</span>
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                SPM STORE <span className="text-cyan-400 font-medium">|</span> <span className="text-slate-200 text-sm font-semibold">Central de Comando Fiscal</span>
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> Live Monitor
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" /> MySQL Conectado (3306)
              </span>
              <span className="text-slate-600">•</span>
              <span className="hidden md:inline text-slate-400">DANFE 4.0 / Shopee / ML / TikTok</span>
            </div>
          </div>
        </div>

        {/* Live Counters in Header */}
        <div className="hidden xl:flex items-center gap-2 text-xs">
          <div className="bg-[#020617]/90 px-3 py-1.5 rounded-xl border border-slate-800/80 flex items-center gap-2 shadow-inner">
            <span className="text-slate-400 font-medium">Faturamento:</span>
            <span className="font-mono font-bold text-emerald-400">{formattedFaturamento}</span>
          </div>
          <div className="bg-[#020617]/90 px-3 py-1.5 rounded-xl border border-slate-800/80 flex items-center gap-2 shadow-inner">
            <span className="text-slate-400 font-medium">Notas:</span>
            <span className="font-mono font-bold text-cyan-400">{invoicesCount}</span>
          </div>
          <div className="bg-[#020617]/90 px-3 py-1.5 rounded-xl border border-slate-800/80 flex items-center gap-2 shadow-inner">
            <span className="text-slate-400 font-medium">Cidades:</span>
            <span className="font-mono font-bold text-purple-400">{cidadesCount}</span>
          </div>
        </div>

        {/* Clock & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          
          {/* Digital Clock */}
          <div className="hidden sm:flex flex-col items-end px-3 py-1 rounded-xl bg-[#020617] border border-slate-800 text-right">
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold text-sm tracking-widest">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium capitalize flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5 text-slate-500" />
              <span>{currentDate}</span>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            title="Sincronizar com Google Sheets e MySQL"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-semibold hover:border-cyan-500/50 hover:text-cyan-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden md:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => onUpdateTVConfig({ soundEnabled: !tvConfig.soundEnabled })}
            title={tvConfig.soundEnabled ? 'Silenciar avisos sonoros' : 'Ativar avisos sonoros'}
            className={`p-2 rounded-xl border transition-all text-xs font-medium ${
              tvConfig.soundEnabled
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-700'
            }`}
          >
            {tvConfig.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* TV Auto-Rotate Mode Toggle */}
          <button
            onClick={() => onUpdateTVConfig({ autoRotate: !tvConfig.autoRotate })}
            title={tvConfig.autoRotate ? 'Desativar rotação automática de telas (Modo TV)' : 'Ativar rotação automática de telas (Modo TV)'}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
              tvConfig.autoRotate
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="hidden lg:inline">{tvConfig.autoRotate ? 'TV Ativo' : 'Modo TV'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia (F11)'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* User Auth */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-white">{currentUser.name}</span>
                <span className="text-[10px] text-cyan-400 uppercase font-mono">{currentUser.role}</span>
              </div>
              <button
                onClick={onLogout}
                title="Sair da conta"
                className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Sleek Navigation Bar with Tab Pills */}
      <nav className="px-3 sm:px-6 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 sm:gap-2">
        {navTabs
          .filter(tab => !tab.role || currentUser?.role === tab.role)
          .map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>
    </header>
  );
};

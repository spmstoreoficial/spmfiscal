import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TVDashboardHeader } from './components/TVDashboardHeader';
import { LiveTicker } from './components/LiveTicker';
import { StatCards } from './components/StatCards';
import { FilterBar } from './components/FilterBar';
import { DashboardView } from './components/DashboardView';
import { BrazilSalesMapView } from './components/BrazilSalesMapView';
import { UploadView } from './components/UploadView';
import { DatabaseView } from './components/DatabaseView';
import { PowerBiView } from './components/PowerBiView';
import { GSheetsView } from './components/GSheetsView';
import { N8nView } from './components/N8nView';
import { ReportsView } from './components/ReportsView';
import { UserManagementView } from './components/UserManagementView';
import { AuditLogsView } from './components/AuditLogsView';
import { AlertsView } from './components/AlertsView';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';
import { ActiveTab } from './components/Sidebar';
import { User, Invoice, DashboardStats, DashboardFilter, TVModeConfig } from './types';
import { api, getStoredToken, removeStoredToken } from './lib/api';
import { playAttendanceChime, playUrgentAlert } from './utils/audioAlert';

const STORAGE_KEYS = {
  TV_CONFIG: 'spm_fiscal_tv_config_v2'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [latestExtracted, setLatestExtracted] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // TV Mode Configuration
  const [tvConfig, setTvConfig] = useState<TVModeConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TV_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      enabled: true,
      autoRotate: false,
      rotateIntervalSec: 15,
      soundEnabled: true,
      showTicker: true,
      theme: 'dark-tv'
    };
  });

  const handleUpdateTVConfig = (cfg: Partial<TVModeConfig>) => {
    setTvConfig(prev => {
      const next = { ...prev, ...cfg };
      localStorage.setItem(STORAGE_KEYS.TV_CONFIG, JSON.stringify(next));
      return next;
    });
  };

  // Filters state
  const [filters, setFilters] = useState<DashboardFilter>({
    datePreset: 'todos',
    origem: 'Todas',
    cor: 'Todas',
    uf: 'Todos',
    search: '',
    status: 'Todos'
  });

  const handleUpdateFilters = (newFilters: Partial<DashboardFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      datePreset: 'todos',
      origem: 'Todas',
      cor: 'Todas',
      uf: 'Todos',
      search: '',
      status: 'Todos'
    });
  };

  // Load user session on mount
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api.getCurrentUser()
        .then(u => setCurrentUser(u))
        .catch(() => removeStoredToken());
    } else {
      api.getCurrentUser().then(u => setCurrentUser(u)).catch(() => {});
    }
  }, []);

  // Fetch invoices and stats
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeFilters: Record<string, string> = {};
      if (filters.origem && filters.origem !== 'Todas' && filters.origem !== 'Todos') activeFilters.origem = filters.origem;
      if (filters.cor && filters.cor !== 'Todas' && filters.cor !== 'Todos') activeFilters.cor = filters.cor;
      if (filters.uf && filters.uf !== 'Todos') activeFilters.uf = filters.uf;
      if (filters.search) activeFilters.search = filters.search;
      if (filters.status && filters.status !== 'Todos') activeFilters.status = filters.status;

      const [invData, statsData] = await Promise.all([
        api.getInvoices(activeFilters),
        api.getStats(activeFilters)
      ]);

      setInvoices(invData.invoices || []);
      setStats(statsData || null);
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // TV Auto-Rotate Interval Handler
  useEffect(() => {
    if (!tvConfig.autoRotate) return;
    const rotateTabs: ActiveTab[] = ['dashboard', 'map', 'database', 'upload'];
    const timer = setInterval(() => {
      setActiveTab(current => {
        const nextIdx = (rotateTabs.indexOf(current) + 1) % rotateTabs.length;
        return rotateTabs[nextIdx];
      });
    }, (tvConfig.rotateIntervalSec || 15) * 1000);

    return () => clearInterval(timer);
  }, [tvConfig.autoRotate, tvConfig.rotateIntervalSec]);

  // Real-time sync trigger
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await api.syncGSheets();
      await fetchData();
      if (tvConfig.soundEnabled) playAttendanceChime();
    } catch (err) {
      console.error('Sync error:', err);
      if (tvConfig.soundEnabled) playUrgentAlert();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    removeStoredToken();
    setCurrentUser(null);
  };

  const handleNewInvoicesExtracted = (newItems: Invoice[]) => {
    setLatestExtracted(newItems);
    if (tvConfig.soundEnabled) playAttendanceChime();
  };

  // Unique cities count
  const cidadesCount = useMemo(() => {
    return new Set(invoices.map(i => i.municipio).filter(Boolean)).size;
  }, [invoices]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-cyan-600 selection:text-white sleek-dot-grid">
      
      {/* 1. TV Command Center Header */}
      <TVDashboardHeader
        currentUser={currentUser}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        tvConfig={tvConfig}
        onUpdateTVConfig={handleUpdateTVConfig}
        onRefreshData={fetchData}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        invoicesCount={invoices.length}
        totalFaturamento={stats?.totalFaturamento || 0}
        cidadesCount={cidadesCount}
        alertsCount={0}
      />

      {/* 2. Live Marquee Ticker */}
      {tvConfig.showTicker && (
        <LiveTicker
          invoices={invoices}
          onSelectInvoice={(inv) => {
            setActiveTab('database');
            setFilters(prev => ({ ...prev, search: inv.fatura || inv.nome }));
          }}
        />
      )}

      {/* 3. Main Content View Area */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Global KPI Stat Cards on top for high-impact visual */}
        <StatCards
          stats={stats}
          invoices={invoices}
          activeMarketplaceFilter={filters.origem}
          onSelectMarketplaceFilter={(mkt) => handleUpdateFilters({ origem: mkt })}
        />

        {/* Global Filter Bar (displayed on Dashboard, Database, Reports, Map) */}
        {(activeTab === 'dashboard' || activeTab === 'database' || activeTab === 'reports' || activeTab === 'map') && (
          <FilterBar
            filters={filters}
            onUpdateFilters={handleUpdateFilters}
            onResetFilters={handleResetFilters}
            totalFiltered={invoices.length}
            totalAll={stats?.totalNotas || invoices.length}
          />
        )}

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            invoices={invoices}
            onSelectTab={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}

        {activeTab === 'map' && (
          <BrazilSalesMapView
            invoices={invoices}
            latestExtractedInvoices={latestExtracted}
          />
        )}

        {activeTab === 'upload' && (
          <UploadView
            onRefreshData={fetchData}
            onOpenGSheets={() => setActiveTab('gsheets')}
            onOpenMap={() => setActiveTab('map')}
            onNewExtracted={handleNewInvoicesExtracted}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseView
            invoices={invoices}
            onRefreshData={fetchData}
            userRole={currentUser?.role}
          />
        )}

        {activeTab === 'powerbi' && (
          <PowerBiView invoicesCount={invoices.length} />
        )}

        {activeTab === 'gsheets' && (
          <GSheetsView invoicesCount={invoices.length} invoices={invoices} />
        )}

        {activeTab === 'n8n' && (
          <N8nView invoicesCount={invoices.length} invoices={invoices} />
        )}

        {activeTab === 'reports' && (
          <ReportsView invoices={invoices} stats={stats} />
        )}

        {activeTab === 'alerts' && (
          <AlertsView />
        )}

        {activeTab === 'audit' && (
          <AuditLogsView />
        )}

        {activeTab === 'users' && (
          <UserManagementView currentUser={currentUser} />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}

      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          fetchData();
        }}
      />

    </div>
  );
}

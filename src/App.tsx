import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { User, Invoice, DashboardStats } from './types';
import { api, getStoredToken, removeStoredToken, setStoredToken } from './lib/api';
import { playInvoiceChime, playUrgentAlert } from './utils/audioAlert';

import { TVDashboardHeader, MainViewType } from './components/TVDashboardHeader';
import { FilterBar, DateFilterType } from './components/FilterBar';
import { StatCards } from './components/StatCards';
import { BrazilSalesMapView } from './components/BrazilSalesMapView';
import { LiveInvoicesStreamList } from './components/LiveInvoicesStreamList';
import { LiveTicker } from './components/LiveTicker';
import { DashboardGraficosIntegracao } from './components/DashboardGraficosIntegracao';
import { DashboardRankings } from './components/DashboardRankings';
import { DatabaseView } from './components/DatabaseView';
import { StockHomeView } from './components/StockHomeView';
import { UploadModal } from './components/UploadModal';
import { ExportReportsModal } from './components/ExportReportsModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { UserManagementModal } from './components/UserManagementModal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { LoginForm } from './components/LoginForm';
import { RealTimeNotificationToast, FiscalNotificationItem } from './components/RealTimeNotificationToast';

export default function App() {
  // Authentication state
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Main View Type ('mapa' | 'graficos_integracao' | 'rankings' | 'database')
  const [mainView, setMainView] = useState<MainViewType>('mapa');

  // Sound and notifications
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('spm_sound_enabled') !== 'false';
  });
  const [activeNotification, setActiveNotification] = useState<FiscalNotificationItem | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<FiscalNotificationItem[]>([]);

  // Raw data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [latestExtracted, setLatestExtracted] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGSheetsModalOpen, setIsGSheetsModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<Invoice | null>(null);

  // Filters state
  const [dateFilter, setDateFilter] = useState<DateFilterType>('todos');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('Todas');
  const [selectedUf, setSelectedUf] = useState<string>('Todos');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist sound
  useEffect(() => {
    localStorage.setItem('spm_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  // Check auth session
  useEffect(() => {
    let isMounted = true;
    const authTimeout = setTimeout(() => {
      if (isMounted) {
        setIsAuthenticating(false);
      }
    }, 4000); // Garante que a tela nunca fique travada por mais de 4s

    const token = getStoredToken();
    if (token) {
      api.getCurrentUser()
        .then(u => {
          if (isMounted) {
            setCurrentUser(u);
            setIsAuthenticating(false);
            clearTimeout(authTimeout);
          }
        })
        .catch(() => {
          if (isMounted) {
            removeStoredToken();
            setCurrentUser(null);
            setIsAuthenticating(false);
            clearTimeout(authTimeout);
          }
        });
    } else {
      setIsAuthenticating(false);
      clearTimeout(authTimeout);
    }

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
    };
  }, []);

  // Fetch invoices data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getInvoices();
      setInvoices(res.invoices || []);
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Trigger Notification Toast and Audio
  const triggerNotification = useCallback((inv: Invoice, isUrgent = false) => {
    if (soundEnabled) {
      if (isUrgent) {
        playUrgentAlert();
      } else {
        playInvoiceChime();
      }
    }

    const newNotif: FiscalNotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      invoice: inv,
      title: isUrgent ? 'Alerta Fiscal de Duplicidade / Valor' : `Nova Nota Fiscal (${inv.origem || 'SPM'})`,
      message: `Fatura: ${inv.fatura || 'N/A'} • ${inv.nome || 'Consumidor'} - ${inv.municipio || 'SP'}`,
      isUrgent,
      createdAt: Date.now()
    };

    setActiveNotification(newNotif);
    setNotificationHistory(prev => [newNotif, ...prev.filter(n => n.invoice.id !== inv.id).slice(0, 20)]);

    setTimeout(() => {
      setActiveNotification(curr => (curr?.id === newNotif.id ? null : curr));
    }, 6000);
  }, [soundEnabled]);

  const handleNewExtracted = (items: Invoice[]) => {
    setLatestExtracted(items);
    if (items.length > 0) {
      triggerNotification(items[0]);
    }
  };

  // Sync Google Sheets
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await api.syncGSheets();
      await fetchData();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    removeStoredToken();
    setCurrentUser(null);
  };

  const handleResetFilters = () => {
    setDateFilter('todos');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedMarketplace('Todas');
    setSelectedUf('Todos');
    setSelectedCity('');
    setSelectedColor('Todas');
    setSelectedStatus('Todos');
    setSearchQuery('');
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      fetchData();
    } catch (err) {
      console.error('Delete invoice error:', err);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('pt-BR');

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toLocaleDateString('pt-BR');
    const currentMonthPrefix = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    return invoices.filter(item => {
      // 1. Date Filter
      if (dateFilter === 'hoje') {
        if (item.dataSaida !== todayStr) return false;
      } else if (dateFilter === 'ontem') {
        if (item.dataSaida !== yesterdayStr) return false;
      } else if (dateFilter === 'este_mes') {
        if (!item.dataSaida.includes(currentMonthPrefix)) return false;
      }

      // 2. Marketplace Filter
      if (selectedMarketplace !== 'Todas' && (item.origem || 'Outros') !== selectedMarketplace) {
        return false;
      }

      // 3. UF Filter
      if (selectedUf !== 'Todos' && (item.uf || '').toUpperCase() !== selectedUf.toUpperCase()) {
        return false;
      }

      // 3.1 City Filter (IBGE)
      if (selectedCity && selectedCity.trim().length > 0) {
        const itemCityNorm = (item.municipio || '').toLowerCase().trim();
        const selCityNorm = selectedCity.toLowerCase().trim();
        if (!itemCityNorm.includes(selCityNorm) && !selCityNorm.includes(itemCityNorm)) {
          return false;
        }
      }

      // 4. Color Filter
      if (selectedColor !== 'Todas' && (item.cor || '').toLowerCase() !== selectedColor.toLowerCase()) {
        return false;
      }

      // 5. Status Filter
      if (selectedStatus !== 'Todos' && item.status !== selectedStatus) {
        return false;
      }

      // 6. Search Query
      if (searchQuery.trim()) {
        const s = searchQuery.toLowerCase();
        const match =
          (item.nome || '').toLowerCase().includes(s) ||
          (item.documento || '').toLowerCase().includes(s) ||
          (item.fatura || '').toLowerCase().includes(s) ||
          (item.municipio || '').toLowerCase().includes(s) ||
          (item.codigo || '').toLowerCase().includes(s) ||
          (item.descricao || '').toLowerCase().includes(s);
        if (!match) return false;
      }

      return true;
    });
  }, [invoices, dateFilter, selectedMarketplace, selectedUf, selectedCity, selectedColor, selectedStatus, searchQuery]);

  // Loading screen
  if (isAuthenticating) {
    return (
      <div className="flex flex-col h-screen w-screen bg-[#020617] text-slate-100 items-center justify-center font-sans">
        <div className="text-center">
          <Shield className="w-14 h-14 text-cyan-400 mx-auto mb-3 animate-spin" />
          <p className="text-lg font-bold text-white tracking-wide">
            Carregando SPM Store Fiscal...
          </p>
          <p className="text-xs text-slate-400 mt-1">Conectando ao banco de dados...</p>
        </div>
      </div>
    );
  }

  // Login form if not logged in
  if (!currentUser) {
    return <LoginForm onAuthSuccess={u => setCurrentUser(u)} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020617] text-slate-100 overflow-hidden select-none font-sans">
      
      {/* Real-time Notification Toast Banner */}
      <RealTimeNotificationToast
        notification={activeNotification}
        history={notificationHistory}
        onDismiss={() => setActiveNotification(null)}
        onClearHistory={() => setNotificationHistory([])}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        onSelectInvoice={inv => setSelectedInvoiceForDetail(inv)}
      />

      {/* 1. Header with Clock, Status, Views & Action Buttons */}
      <TVDashboardHeader
        activeView={mainView}
        onChangeView={setMainView}
        onRefreshData={fetchData}
        isSyncing={isSyncing}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenGSheetsModal={() => setIsGSheetsModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        totalInvoicesCount={invoices.length}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Main View Switcher */}
      {mainView === 'graficos_integracao' ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <DashboardGraficosIntegracao
            invoices={filteredInvoices}
            onBackToMap={() => setMainView('mapa')}
          />
        </div>
      ) : mainView === 'rankings' ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <DashboardRankings
            invoices={filteredInvoices}
            onBackToMap={() => setMainView('mapa')}
            onSelectInvoice={inv => setSelectedInvoiceForDetail(inv)}
          />
        </div>
      ) : mainView === 'stock' ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-[#020617]">
          <StockHomeView
            invoices={filteredInvoices}
            onOpenInvoicesTab={() => setMainView('database')}
            userRole={currentUser.role}
          />
        </div>
      ) : mainView === 'database' ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-[#020617]">
          <DatabaseView
            invoices={filteredInvoices}
            onRefreshData={fetchData}
            userRole={currentUser.role}
          />
        </div>
      ) : (
        /* Default Operational Map & Live Stream View */
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          
          {/* Top Metric KPI Cards & Advanced Filter Bar */}
          <div className="px-3 sm:px-4 lg:px-6 pt-2 pb-1.5 flex flex-col gap-2 shrink-0 bg-[#020617]">
            <FilterBar
              dateFilter={dateFilter}
              onSelectDateFilter={setDateFilter}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onChangeCustomDates={(start, end) => {
                setCustomStartDate(start);
                setCustomEndDate(end);
              }}
              selectedMarketplace={selectedMarketplace}
              onSelectMarketplace={setSelectedMarketplace}
              selectedUf={selectedUf}
              onSelectUf={setSelectedUf}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onResetFilters={handleResetFilters}
              totalFiltered={filteredInvoices.length}
              totalRaw={invoices.length}
            />

            <StatCards
              invoices={filteredInvoices}
              onSelectMarketplaceFilter={mkt => setSelectedMarketplace(mkt)}
              activeMarketplaceFilter={selectedMarketplace}
              onSelectStatusFilter={st => setSelectedStatus(st)}
              activeStatusFilter={selectedStatus}
            />
          </div>

          {/* Main Grid: Left Column 8 (Interactive Map) + Right Column 4 (Live Stream Feed) */}
          <div className="flex-1 min-h-0 px-3 sm:px-4 lg:px-6 pb-2 grid grid-cols-1 lg:grid-cols-12 gap-3">
            
            {/* Map Container (8 Cols) */}
            <div className="lg:col-span-8 h-full min-h-[300px] relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#020617]">
              <BrazilSalesMapView
                invoices={filteredInvoices}
                latestExtractedInvoices={latestExtracted}
              />
            </div>

            {/* Live Feed Container (4 Cols) */}
            <div className="lg:col-span-4 h-full min-h-[300px] overflow-hidden">
              <LiveInvoicesStreamList
                invoices={filteredInvoices}
                onSelectInvoice={inv => setSelectedInvoiceForDetail(inv)}
                onViewDanfe={inv => setSelectedInvoiceForDetail(inv)}
                onDeleteInvoice={handleDeleteInvoice}
              />
            </div>

          </div>
        </div>
      )}

      {/* 3. Bottom Live Marquee Ticker */}
      <LiveTicker
        invoices={invoices}
        onSelectInvoice={inv => setSelectedInvoiceForDetail(inv)}
      />

      {/* 4. Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onRefreshData={fetchData}
        onNewExtracted={handleNewExtracted}
      />

      <ExportReportsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        invoices={filteredInvoices}
      />

      <GoogleSheetsModal
        isOpen={isGSheetsModalOpen}
        onClose={() => setIsGSheetsModalOpen(false)}
        invoicesCount={invoices.length}
      />

      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        currentUser={currentUser}
      />

      <InvoiceDetailModal
        invoice={selectedInvoiceForDetail}
        onClose={() => setSelectedInvoiceForDetail(null)}
      />

    </div>
  );
}

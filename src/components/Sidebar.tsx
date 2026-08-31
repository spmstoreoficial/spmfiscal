import React from 'react';
import { 
  LayoutDashboard, 
  MapPin,
  Upload, 
  Database, 
  BarChart3, 
  Table, 
  FileCheck, 
  BellRing, 
  ShieldAlert, 
  Users, 
  Settings,
  Workflow
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'map'
  | 'upload' 
  | 'database' 
  | 'powerbi' 
  | 'gsheets' 
  | 'n8n'
  | 'reports' 
  | 'alerts' 
  | 'audit' 
  | 'users' 
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole?: string;
  invoicesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  invoicesCount
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'map', label: 'Mapa do Brasil (Vendas)', icon: MapPin, badge: 'Ao Vivo' },
    { id: 'upload', label: 'Anexar & Extrair PDFs', icon: Upload, badge: 'Novo' },
    { id: 'database', label: 'Banco de Dados', icon: Database, badge: `${invoicesCount}` },
    { id: 'n8n', label: 'Automações n8n', icon: Workflow, badge: 'IA & Auto' },
    { id: 'powerbi', label: 'Conexão Power BI', icon: BarChart3, badge: 'Ao Vivo' },
    { id: 'gsheets', label: 'Google Sheets Sync', icon: Table, badge: 'Realtime' },
    { id: 'reports', label: 'Relatórios PDF & Excel', icon: FileCheck, badge: null },
    { id: 'alerts', label: 'Alertas & Push', icon: BellRing, badge: null },
    { id: 'audit', label: 'Auditoria & Logs', icon: ShieldAlert, badge: null },
    { id: 'users', label: 'Gestão de Usuários', icon: Users, badge: null, adminOnly: true },
    { id: 'settings', label: 'Configurações VPS', icon: Settings, badge: null }
  ];

  return (
    <aside className="w-full md:w-64 bg-[#0F172A] border-r border-slate-800 shrink-0 py-5 px-3 flex flex-col justify-between text-slate-300">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navegação Principal
        </div>
        
        <nav className="space-y-1">
          {menuItems.map(item => {
            if (item.adminOnly && userRole !== 'ADMIN') return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive 
                    ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info box */}
      <div className="mt-6 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Contabo VPS • Online</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Navegador Leve Otimizado. Sincronização em tempo real ativada.
        </p>
      </div>
    </aside>
  );
};

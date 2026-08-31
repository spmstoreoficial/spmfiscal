import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Trash2, 
  Clock, 
  User as UserIcon, 
  Server, 
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { LogEntry, LogCategory } from '../types';
import { api } from '../lib/api';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');

  const loadLogs = async () => {
    try {
      const data = await api.getLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = async () => {
    if (window.confirm('Tem certeza que deseja zerar o histórico de logs de auditoria?')) {
      await api.clearLogs();
      loadLogs();
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ip.includes(searchTerm);

    const matchesCategory = categoryFilter === 'TODOS' || l.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categoryBadges: Record<string, string> = {
    UPLOAD: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    SYNC: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    AUTH: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    SECURITY: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    EXPORT: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    SYSTEM: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Trilha de Conformidade LGPD & Fiscal
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Logs de Auditoria & Atividades do Sistema
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Rastreamento rigoroso de extrações de DANFE, sincronizações, logins de usuários e operações de exclusão.
          </p>
        </div>

        <button
          onClick={handleClearLogs}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Limpar Histórico</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação, detalhes ou IP..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#020617] border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-[#020617] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="TODOS">Todas as Categorias</option>
            <option value="UPLOAD">Extração & Upload</option>
            <option value="SYNC">Sincronização</option>
            <option value="AUTH">Autenticação</option>
            <option value="SECURITY">Segurança</option>
            <option value="EXPORT">Exportação</option>
            <option value="SYSTEM">Sistema</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#020617] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">DATA / HORA</th>
                <th className="p-3.5">USUÁRIO</th>
                <th className="p-3.5">CATEGORIA</th>
                <th className="p-3.5">AÇÃO</th>
                <th className="p-3.5">DETALHES</th>
                <th className="p-3.5">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono text-xs">
                    Nenhum log de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">{l.timestamp}</td>
                    <td className="p-3.5 font-bold text-white flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{l.userName}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${categoryBadges[l.category] || 'bg-slate-800 text-slate-300'}`}>
                        {l.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-200">{l.action}</td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate" title={l.details}>{l.details}</td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{l.ip}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

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
  Info
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
    UPLOAD: 'bg-blue-50 text-blue-700 border-blue-200',
    SYNC: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    AUTH: 'bg-purple-50 text-purple-700 border-purple-200',
    SECURITY: 'bg-amber-50 text-amber-800 border-amber-200',
    EXPORT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ALERT: 'bg-rose-50 text-rose-700 border-rose-200',
    SYSTEM: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <span>Auditoria Completa & Logs de Atividade</span>
            </h2>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
              Rastreamento Contínuo
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Registro cronológico inalterável de uploads, acessos, exportações e alterações de segurança.
          </p>
        </div>

        <button
          onClick={handleClearLogs}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          <span>Limpar Histórico</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por usuário, IP, ação ou detalhe..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['TODOS', 'UPLOAD', 'SYNC', 'AUTH', 'SECURITY', 'ALERT', 'SYSTEM'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                categoryFilter === cat 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3.5">Data & Hora</th>
                <th className="p-3.5">Usuário Responsável</th>
                <th className="p-3.5">Ação Realizada</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Detalhes da Operação</th>
                <th className="p-3.5">Endereço IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    Nenhum registro de log encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3.5 font-sans font-bold text-slate-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="p-3.5 font-sans font-bold text-blue-600 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-3.5 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryBadges[log.category] || 'bg-slate-100 text-slate-700'}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans text-slate-700 truncate max-w-md" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {log.ip}
                    </td>
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

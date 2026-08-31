import React from 'react';
import { DashboardFilter, DateFilterType } from '../types';
import {
  Filter,
  Calendar,
  Search,
  X,
  MapPin,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  Tag
} from 'lucide-react';

interface FilterBarProps {
  filters: DashboardFilter;
  onUpdateFilters: (newFilters: Partial<DashboardFilter>) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalAll: number;
}

const BRAZIL_UFS = [
  'Todos', 'SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE',
  'GO', 'DF', 'ES', 'MT', 'MS', 'MA', 'PB', 'PA', 'AM', 'RN',
  'AL', 'PI', 'SE', 'RO', 'TO', 'AC', 'AP', 'RR'
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  totalFiltered,
  totalAll
}) => {
  const datePresets: { id: DateFilterType; label: string }[] = [
    { id: 'todos', label: 'Todo Período' },
    { id: 'hoje', label: 'Hoje' },
    { id: '7dias', label: 'Últimos 7D' },
    { id: '30dias', label: 'Últimos 30D' },
    { id: 'mes', label: 'Este Mês' }
  ];

  const marketplaces = ['Todas', 'Shopee', 'Mercado Livre', 'TikTok', 'WhatsApp', 'Outros'];
  const cores = ['Todas', 'Preto', 'Marrom', 'Incolor'];

  const hasActiveFilters = Boolean(
    (filters.datePreset && filters.datePreset !== 'todos') ||
    (filters.origem && filters.origem !== 'Todas' && filters.origem !== 'Todos') ||
    (filters.cor && filters.cor !== 'Todas' && filters.cor !== 'Todos') ||
    (filters.uf && filters.uf !== 'Todos') ||
    filters.search
  );

  return (
    <div className="bg-[#0f172a]/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
      
      {/* Top Row: Search Input + Date Presets + Results count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Instant Search Box */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onUpdateFilters({ search: e.target.value })}
            placeholder="Buscar por NF, Cliente, CPF/CNPJ, Cidade ou Código..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#020617] border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
          />
          {filters.search && (
            <button
              onClick={() => onUpdateFilters({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none bg-[#020617] p-1 rounded-xl border border-slate-800">
          <div className="px-2 py-1 text-slate-500 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Data:</span>
          </div>
          {datePresets.map(preset => {
            const isSelected = (filters.datePreset || 'todos') === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onUpdateFilters({ datePreset: preset.id })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Result Counter & Clear */}
        <div className="flex items-center gap-2 text-xs font-mono ml-auto">
          <span className="text-slate-400">
            Exibindo <strong className="text-cyan-400">{totalFiltered}</strong> de <strong className="text-slate-300">{totalAll}</strong>
          </span>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1 transition"
              title="Limpar todos os filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>

      </div>

      {/* Bottom Row: Marketplace chips, Cor chips, UF select */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
        
        {/* Marketplace chips */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1 flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-amber-400" /> Canal:
          </span>
          {marketplaces.map(mp => {
            const isSelected = (filters.origem || 'Todas') === mp;
            return (
              <button
                key={mp}
                onClick={() => onUpdateFilters({ origem: mp })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-[#020617] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {mp}
              </button>
            );
          })}
        </div>

        {/* Cor chips */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none ml-0 sm:ml-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-purple-400" /> Cor:
          </span>
          {cores.map(cor => {
            const isSelected = (filters.cor || 'Todas') === cor;
            return (
              <button
                key={cor}
                onClick={() => onUpdateFilters({ cor })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-purple-500 text-slate-950 shadow-sm'
                    : 'bg-[#020617] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cor}
              </button>
            );
          })}
        </div>

        {/* UF Select */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-400" /> UF:
          </span>
          <select
            value={filters.uf || 'Todos'}
            onChange={(e) => onUpdateFilters({ uf: e.target.value })}
            className="bg-[#020617] text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500"
          >
            {BRAZIL_UFS.map(uf => (
              <option key={uf} value={uf}>{uf === 'Todos' ? 'Todos os Estados' : uf}</option>
            ))}
          </select>
        </div>

      </div>

    </div>
  );
};

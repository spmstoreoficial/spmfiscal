import React from 'react';
import {
  Filter,
  Calendar,
  Search,
  RotateCcw,
  ShoppingBag,
  MapPin,
  Palette,
  CheckCircle2,
  Building2,
  Globe
} from 'lucide-react';
import { CityAutocompleteIBGE } from './CityAutocompleteIBGE';

export type DateFilterType = 'hoje' | 'ontem' | 'ultimos_7_dias' | 'este_mes' | 'todos' | 'custom';

export const BRAZIL_UFS = [
  'SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 'PE', 'CE', 'PA', 'MT', 'MS', 'DF', 'ES', 'AM', 'RN', 'PB', 'AL', 'SE', 'PI', 'TO', 'RO', 'AC', 'AP', 'RR'
];

export const MARKETPLACES = [
  { id: 'Todas', label: 'Todos os Canais' },
  { id: 'Shopee', label: 'Shopee' },
  { id: 'Mercado Livre', label: 'Mercado Livre' },
  { id: 'TikTok', label: 'TikTok Shop' },
  { id: 'WhatsApp', label: 'WhatsApp / Direto' },
  { id: 'Outros', label: 'Outros / E-commerce' }
];

export const COLORS = [
  'Todas', 'Preto', 'Incolor', 'Marrom', 'Kit 1', 'Kit 2', 'Branco', 'Azul', 'Vermelho', 'Verde', 'Cinza', 'Outras'
];

interface FilterBarProps {
  dateFilter: DateFilterType;
  onSelectDateFilter: (val: DateFilterType) => void;
  customStartDate: string;
  customEndDate: string;
  onChangeCustomDates: (start: string, end: string) => void;
  selectedMarketplace: string;
  onSelectMarketplace: (val: string) => void;
  selectedUf: string;
  onSelectUf: (val: string) => void;
  selectedCity?: string;
  onSelectCity?: (val: string) => void;
  selectedColor: string;
  onSelectColor: (val: string) => void;
  selectedStatus: string;
  onSelectStatus: (val: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalRaw: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  dateFilter,
  onSelectDateFilter,
  customStartDate,
  customEndDate,
  onChangeCustomDates,
  selectedMarketplace,
  onSelectMarketplace,
  selectedUf,
  onSelectUf,
  selectedCity = '',
  onSelectCity,
  selectedColor,
  onSelectColor,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  onResetFilters,
  totalFiltered,
  totalRaw
}) => {
  const isFiltered =
    dateFilter !== 'todos' ||
    selectedMarketplace !== 'Todas' ||
    selectedUf !== 'Todos' ||
    (selectedCity && selectedCity.trim().length > 0) ||
    selectedColor !== 'Todas' ||
    selectedStatus !== 'Todos' ||
    searchQuery.trim().length > 0;

  return (
    <div className="bg-[#0b1329]/90 backdrop-blur border border-slate-800/80 rounded-xl p-2 sm:p-2.5 shadow-lg flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1">
          
          {/* Date Filter Pills */}
          <div className="flex items-center bg-[#020617] p-0.5 rounded-lg border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-0.5" />
            <button
              onClick={() => onSelectDateFilter('todos')}
              className={`px-2 py-1 rounded font-bold transition ${
                dateFilter === 'todos' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => onSelectDateFilter('hoje')}
              className={`px-2 py-1 rounded font-bold transition ${
                dateFilter === 'hoje' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => onSelectDateFilter('ontem')}
              className={`hidden sm:inline px-2 py-1 rounded font-bold transition ${
                dateFilter === 'ontem' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ontem
            </button>
            <button
              onClick={() => onSelectDateFilter('ultimos_7_dias')}
              className={`hidden md:inline px-2 py-1 rounded font-bold transition ${
                dateFilter === 'ultimos_7_dias' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => onSelectDateFilter('este_mes')}
              className={`hidden sm:inline px-2 py-1 rounded font-bold transition ${
                dateFilter === 'este_mes' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => onSelectDateFilter('custom')}
              className={`px-2 py-1 rounded font-bold transition ${
                dateFilter === 'custom' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Período
            </button>
          </div>

          {/* Custom Date Inputs */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1 bg-[#020617] px-2 py-1 rounded-lg border border-slate-800 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={e => onChangeCustomDates(e.target.value, customEndDate)}
                className="bg-transparent text-slate-200 text-xs outline-none"
              />
              <span className="text-slate-500">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => onChangeCustomDates(customStartDate, e.target.value)}
                className="bg-transparent text-slate-200 text-xs outline-none"
              />
            </div>
          )}

          {/* Marketplace Selector */}
          <div className="flex items-center bg-[#020617] px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
            <select
              value={selectedMarketplace}
              onChange={e => onSelectMarketplace(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer"
            >
              {MARKETPLACES.map(m => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* UF Selector */}
          <div className="flex items-center bg-[#020617] px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
            <select
              value={selectedUf}
              onChange={e => {
                onSelectUf(e.target.value);
                if (onSelectCity) onSelectCity('');
              }}
              className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="Todos" className="bg-slate-900 text-white">Todos os Estados</option>
              {BRAZIL_UFS.map(uf => (
                <option key={uf} value={uf} className="bg-slate-900 text-white">
                  {uf}
                </option>
              ))}
            </select>
          </div>

          {/* City Selector Connected to IBGE API */}
          {onSelectCity && (
            <div className="w-48 sm:w-56">
              <CityAutocompleteIBGE
                value={selectedCity}
                selectedUf={selectedUf}
                onChangeCity={(c, uf) => {
                  onSelectCity(c);
                  if (uf && selectedUf === 'Todos') {
                    onSelectUf(uf);
                  }
                }}
                placeholder="Município (IBGE)..."
              />
            </div>
          )}

          {/* Color Selector */}
          <div className="hidden md:flex items-center bg-[#020617] px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <Palette className="w-3.5 h-3.5 text-purple-400 mr-1.5" />
            <select
              value={selectedColor}
              onChange={e => onSelectColor(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer"
            >
              {COLORS.map(c => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c === 'Todas' ? 'Todas as Cores' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="hidden lg:flex items-center bg-[#020617] px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
            <select
              value={selectedStatus}
              onChange={e => onSelectStatus(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="Todos" className="bg-slate-900 text-white">Todos os Status</option>
              <option value="Processado" className="bg-slate-900 text-white">Processado</option>
              <option value="Auditado" className="bg-slate-900 text-white">Auditado</option>
              <option value="Pendente" className="bg-slate-900 text-white">Pendente</option>
            </select>
          </div>

        </div>

        {/* Right: Search & Counter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          
          {/* Instant Search Query */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente, CPF, fatura..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-[#020617] text-slate-100 placeholder-slate-500 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:border-cyan-500 outline-none transition"
            />
          </div>

          {/* Filter Counter Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <strong className="text-cyan-400 font-bold">{totalFiltered}</strong> / {totalRaw} NFs
            </span>

            {/* Reset Button */}
            {isFiltered && (
              <button
                onClick={onResetFilters}
                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 transition"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

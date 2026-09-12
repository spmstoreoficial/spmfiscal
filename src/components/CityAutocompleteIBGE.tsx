import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Check, X, Building2, Globe, Sparkles } from 'lucide-react';
import { IBGEMunicipio, searchIBGEMunicipios, loadAllIBGEMunicipios } from '../services/ibgeService';

interface CityAutocompleteIBGEProps {
  value: string;
  selectedUf?: string;
  onChangeCity: (cityName: string, uf?: string, ibgeId?: number) => void;
  placeholder?: string;
  className?: string;
  showIbgeBadge?: boolean;
}

export const CityAutocompleteIBGE: React.FC<CityAutocompleteIBGEProps> = ({
  value,
  selectedUf,
  onChangeCity,
  placeholder = 'Buscar município (IBGE)...',
  className = '',
  showIbgeBadge = true
}) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [suggestions, setSuggestions] = useState<IBGEMunicipio[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync value when prop changes
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Preload all municipalities on first mount
  useEffect(() => {
    loadAllIBGEMunicipios().catch(() => {});
  }, []);

  // Fetch suggestions on search or UF change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(() => {
      searchIBGEMunicipios(searchTerm, selectedUf, 25)
        .then(results => {
          if (isMounted) {
            setSuggestions(results);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, selectedUf, isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (m: IBGEMunicipio) => {
    setSearchTerm(m.nome);
    setIsOpen(false);
    onChangeCity(m.nome, m.uf, m.id);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChangeCity('');
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className={`relative font-sans ${className}`}>
      <div className="relative flex items-center">
        <MapPin className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-[#020617] text-white pl-8 pr-7 py-1.5 rounded-xl border border-slate-700 focus:border-cyan-500 text-xs outline-none shadow-inner placeholder-slate-500 transition"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-slate-500 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0b1329] border border-cyan-500/40 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1 text-xs backdrop-blur-md">
          <div className="px-2 py-1 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-bold text-cyan-300">
              <Globe className="w-3 h-3 text-cyan-400" />
              Municípios do Brasil (Base IBGE)
            </span>
            <span className="font-mono">{suggestions.length} resultados</span>
          </div>

          {isLoading ? (
            <div className="p-3 text-center text-slate-400 text-xs">
              Buscando na base do IBGE...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-center text-slate-500 text-xs">
              Nenhum município encontrado para "{searchTerm}".
            </div>
          ) : (
            <div className="space-y-0.5 mt-1">
              {suggestions.map(m => {
                const isSelected = value && value.toLowerCase() === m.nome.toLowerCase();
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{m.nome}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {m.uf}
                      </span>
                    </div>

                    {showIbgeBadge && (
                      <span className="text-[9px] text-slate-500 font-mono shrink-0 ml-2">
                        IBGE: {m.id}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

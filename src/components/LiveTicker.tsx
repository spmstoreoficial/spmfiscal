import React, { useState } from 'react';
import { Invoice } from '../types';
import { Radio, MapPin, Play, Pause, DollarSign, ShoppingBag } from 'lucide-react';

interface LiveTickerProps {
  invoices: Invoice[];
  onSelectCity?: (cityName: string) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({
  invoices,
  onSelectCity,
  onSelectInvoice
}) => {
  const [speed, setSpeed] = useState<'lento' | 'suave' | 'normal'>('lento');
  const [isPaused, setIsPaused] = useState(false);

  const sorted = invoices.slice(0, 25);
  if (sorted.length === 0) return null;

  const durationSec = speed === 'lento' ? 200 : speed === 'suave' ? 140 : 90;

  const getBadgeColor = (origem?: string) => {
    const o = origem?.toLowerCase() || '';
    if (o.includes('shopee')) return 'bg-orange-500 text-white';
    if (o.includes('mercado') || o.includes('ml')) return 'bg-yellow-400 text-slate-950';
    if (o.includes('tiktok')) return 'bg-pink-500 text-white';
    if (o.includes('whats')) return 'bg-emerald-500 text-white';
    return 'bg-blue-600 text-white';
  };

  return (
    <div className="bg-[#0b1329] border-t border-slate-800 py-1.5 px-3 sm:px-4 flex items-center overflow-hidden shadow-2xl relative z-20 shrink-0">
      
      {/* Ticker Lead Tag & Controls */}
      <div className="flex items-center gap-1.5 shrink-0 mr-3">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.35)] border border-cyan-400/30">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-200" />
          <span className="hidden sm:inline">Radar Fiscal</span>
          <span className="sm:hidden">Ao Vivo</span>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPaused(prev => !prev)}
          className={`p-1 rounded-md border transition ${
            isPaused
              ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 hover:bg-amber-600/50'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
          }`}
          title={isPaused ? "Retomar rolagem" : "Pausar rolagem"}
        >
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
        </button>

        {/* Speed Switcher */}
        <div className="hidden md:flex items-center gap-0.5 bg-[#020617] p-0.5 rounded-md border border-slate-800 text-[10px]">
          <button
            onClick={() => setSpeed('lento')}
            className={`px-1.5 py-0.2 rounded font-bold transition ${
              speed === 'lento' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lento
          </button>
          <button
            onClick={() => setSpeed('suave')}
            className={`px-1.5 py-0.2 rounded font-bold transition ${
              speed === 'suave' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Médio
          </button>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="overflow-hidden flex-1 relative">
        <div
          className="animate-marquee flex items-center gap-6 whitespace-nowrap"
          style={{
            animationDuration: `${durationSec}s`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          {sorted.concat(sorted).map((item, idx) => {
            return (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => onSelectInvoice?.(item)}
                className="inline-flex items-center gap-2 text-xs cursor-pointer hover:text-cyan-300 transition py-0.5 px-2 rounded-lg hover:bg-slate-800/80"
              >
                {/* Date / Time */}
                <span className="font-mono text-cyan-400 font-bold bg-[#020617] px-1.5 py-0.2 rounded border border-slate-800 text-[10px]">
                  {item.dataSaida || 'Recente'}
                </span>

                {/* Channel Badge */}
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${getBadgeColor(item.origem)} uppercase`}>
                  {item.origem || 'SPM'}
                </span>

                {/* Value */}
                <span className="font-mono font-extrabold text-emerald-400 text-xs">
                  R$ {item.valorNota}
                </span>

                {/* Customer */}
                <span className="font-bold text-white max-w-[140px] truncate">
                  {item.nome || 'Consumidor'}
                </span>

                {/* City & UF */}
                {item.municipio && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCity?.(item.municipio);
                    }}
                    className="text-slate-300 flex items-center gap-0.5 hover:text-cyan-300 font-mono text-[11px]"
                  >
                    <MapPin className="w-3 h-3 text-cyan-400 inline" />
                    {item.municipio} ({item.uf || 'SP'})
                  </span>
                )}

                {/* SKU */}
                <span className="text-slate-400 text-[11px]">
                  [{item.codigo || 'SKU'} - {item.cor || 'Padrão'}]
                </span>

                {/* Separator */}
                <span className="text-cyan-500/40 ml-2 font-bold">◆</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

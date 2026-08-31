import React, { useState } from 'react';
import { Invoice } from '../types';
import { Radio, MapPin, Play, Pause, DollarSign, Tag, ShoppingBag, ShieldCheck } from 'lucide-react';

interface LiveTickerProps {
  invoices: Invoice[];
  onSelectInvoice?: (invoice: Invoice) => void;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ invoices, onSelectInvoice }) => {
  const [speed, setSpeed] = useState<'lento' | 'suave' | 'normal'>('suave');
  const [isPaused, setIsPaused] = useState(false);

  // Take the 20 most recent invoices
  const recentInvoices = invoices.slice(0, 20);

  if (recentInvoices.length === 0) {
    return (
      <div className="bg-[#0f172a] border-t border-b border-slate-800/80 py-1.5 px-4 flex items-center gap-2 text-xs text-slate-400">
        <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider">Feed Fiscal:</span>
        <span>Aguardando extração ou importação de notas fiscais...</span>
      </div>
    );
  }

  const durationSec = speed === 'lento' ? 180 : speed === 'suave' ? 120 : 70;

  const getMarketplaceBadge = (origem: string) => {
    const orig = (origem || '').toLowerCase();
    if (orig.includes('shopee')) return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    if (orig.includes('mercado livre') || orig.includes('mercadolivre')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    if (orig.includes('tiktok')) return 'bg-pink-500/20 text-pink-400 border-pink-500/40';
    if (orig.includes('whatsapp')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
  };

  return (
    <div className="bg-[#0f172a] border-t border-b border-slate-800/80 py-1.5 px-3 sm:px-4 flex items-center overflow-hidden shadow-2xl relative z-20">
      
      {/* Ticker Lead Tag & Controls */}
      <div className="flex items-center gap-1.5 shrink-0 mr-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-600/90 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.35)] border border-cyan-400/30">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-200" />
          <span className="hidden sm:inline">Feed de Vendas & DANFE</span>
          <span className="sm:hidden">Ao Vivo</span>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPaused(prev => !prev)}
          className={`p-1 rounded-lg border transition ${
            isPaused
              ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 hover:bg-amber-600/50'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
          }`}
          title={isPaused ? 'Retomar rolagem' : 'Pausar rolagem'}
        >
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
        </button>

        {/* Speed Switcher */}
        <div className="hidden md:flex items-center gap-0.5 bg-[#020617] p-0.5 rounded-lg border border-slate-800 text-[10px]">
          <button
            onClick={() => setSpeed('lento')}
            className={`px-1.5 py-0.5 rounded font-bold transition ${
              speed === 'lento' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Velocidade lenta para leitura detalhada"
          >
            Lento
          </button>
          <button
            onClick={() => setSpeed('suave')}
            className={`px-1.5 py-0.5 rounded font-bold transition ${
              speed === 'suave' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Velocidade moderada"
          >
            Suave
          </button>
          <button
            onClick={() => setSpeed('normal')}
            className={`px-1.5 py-0.5 rounded font-bold transition ${
              speed === 'normal' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Velocidade rápida"
          >
            Rápido
          </button>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="overflow-hidden flex-1 relative mask-fade-edges">
        <div
          className="animate-marquee flex items-center gap-6 whitespace-nowrap"
          style={{
            animationDuration: `${durationSec}s`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          {recentInvoices.concat(recentInvoices).map((inv, idx) => {
            const marketplaceClass = getMarketplaceBadge(inv.origem);
            const formattedVal = inv.valorNota ? `R$ ${inv.valorNota}` : 'R$ --';

            return (
              <div
                key={`${inv.id || idx}-${idx}`}
                onClick={() => onSelectInvoice?.(inv)}
                className="inline-flex items-center gap-2 text-xs cursor-pointer hover:text-cyan-300 transition py-0.5 px-2.5 rounded-lg hover:bg-slate-800/80 group"
              >
                {/* NF / Fatura */}
                <span className="font-mono text-cyan-400 font-bold bg-[#020617] px-2 py-0.5 rounded border border-slate-800">
                  NF #{inv.fatura || inv.id || 'S/N'}
                </span>

                {/* Marketplace Badge */}
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase ${marketplaceClass}`}>
                  {inv.origem || 'Outros'}
                </span>

                {/* Client Name */}
                <span className="font-bold text-white group-hover:text-cyan-300 transition">
                  {inv.nome || 'Consumidor Final'}
                </span>

                {/* Value */}
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  {formattedVal}
                </span>

                {/* City & UF */}
                {(inv.municipio || inv.uf) && (
                  <span className="text-slate-400 flex items-center gap-0.5 text-[11px]">
                    <MapPin className="w-3 h-3 text-cyan-400 inline" />
                    {inv.municipio ? inv.municipio.toUpperCase() : ''}{inv.uf ? `/${inv.uf}` : ''}
                  </span>
                )}

                {/* Product Code / Color */}
                {inv.cor && inv.cor !== 'Não identificada' && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.2 rounded">
                    Cor: {inv.cor}
                  </span>
                )}

                {/* Item Separator Diamond */}
                <span className="text-cyan-500/40 ml-2">◆</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

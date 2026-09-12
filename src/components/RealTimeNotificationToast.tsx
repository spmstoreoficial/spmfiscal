import React, { useState } from 'react';
import {
  BellRing,
  X,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  ExternalLink,
  DollarSign,
  ShoppingBag,
  History
} from 'lucide-react';
import { Invoice } from '../types';

export interface FiscalNotificationItem {
  id: string;
  invoice: Invoice;
  title: string;
  message: string;
  isUrgent?: boolean;
  createdAt: number;
}

interface RealTimeNotificationToastProps {
  notification: FiscalNotificationItem | null;
  history: FiscalNotificationItem[];
  onDismiss: () => void;
  onClearHistory: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectInvoice?: (invoice: Invoice) => void;
}

export const RealTimeNotificationToast: React.FC<RealTimeNotificationToastProps> = ({
  notification,
  history,
  onDismiss,
  onClearHistory,
  soundEnabled,
  onToggleSound,
  onSelectInvoice
}) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      {/* Active Floating Pill */}
      {notification && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-1000 max-w-lg w-full px-4">
          <div
            onClick={() => onSelectInvoice?.(notification.invoice)}
            className={`p-3 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] border backdrop-blur-xl flex items-center justify-between gap-3 cursor-pointer transition transform hover:scale-[1.02] ${
              notification.isUrgent
                ? 'bg-rose-950/90 border-rose-500/70 text-white shadow-rose-900/40'
                : 'bg-slate-900/95 border-cyan-500/60 text-white shadow-cyan-900/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl flex items-center justify-center ${
                  notification.isUrgent ? 'bg-rose-600 text-white' : 'bg-cyan-600 text-white'
                }`}
              >
                {notification.isUrgent ? <AlertTriangle className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                    {notification.title}
                  </span>
                  <span className="text-[10px] bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-500/30 text-cyan-400 font-mono">
                    R$ {notification.invoice.valorNota}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span>{notification.invoice.nome}</span>
                  <span>•</span>
                  <span>{notification.invoice.municipio} - {notification.invoice.uf}</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* History Drawer Trigger in bottom right */}
      {history.length > 0 && (
        <div className="fixed bottom-12 right-4 z-40">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-white text-xs font-bold shadow-2xl backdrop-blur transition"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Alertas ({history.length})</span>
          </button>

          {/* History Popup */}
          {showHistory && (
            <div className="absolute bottom-10 right-0 w-80 max-h-96 bg-[#0b1329] border border-slate-700 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 overflow-hidden z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white">Histórico de Alertas Recentes</span>
                <button
                  onClick={onClearHistory}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Limpar
                </button>
              </div>

              <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
                {history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectInvoice?.(item.invoice);
                      setShowHistory(false);
                    }}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-cyan-400">{item.invoice.origem}</span>
                      <span className="font-mono font-bold text-emerald-400">R$ {item.invoice.valorNota}</span>
                    </div>
                    <div className="font-bold text-white truncate mt-0.5">{item.invoice.nome}</div>
                    <div className="text-[10px] text-slate-400">{item.invoice.municipio} - {item.invoice.uf}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

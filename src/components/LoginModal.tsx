import React, { useState } from 'react';
import { ShieldCheck, LogIn, X, Lock, Mail, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('josegaldino@hotmail.com.br');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login(email, password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickAccount = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-cyan-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Autenticação de Usuário</h3>
              <p className="text-[11px] text-slate-400">Acesso seguro ao Sistema Fiscal</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">E-mail de Acesso</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Senha de Segurança</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 text-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition shadow-lg shadow-cyan-600/30 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
          </button>
        </form>

        {/* Quick Account Selector for Demo */}
        <div className="pt-3 border-t border-slate-800 space-y-2 text-[11px]">
          <p className="font-bold text-slate-400">Contas Pré-cadastradas (Clique para preencher):</p>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => handleSelectQuickAccount('josegaldino@hotmail.com.br', 'admin123')}
              className="text-left p-2.5 rounded-xl bg-[#020617] hover:bg-slate-800/80 border border-slate-800 text-slate-300 flex justify-between items-center transition"
            >
              <div>
                <span className="font-bold text-cyan-400">José Galdino</span>
                <span className="text-slate-400 block text-[10px] font-mono">josegaldino@hotmail.com.br (ADMIN)</span>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-cyan-500" />
            </button>

            <button
              onClick={() => handleSelectQuickAccount('gerente@empresa.com', 'gerente123')}
              className="text-left p-2.5 rounded-xl bg-[#020617] hover:bg-slate-800/80 border border-slate-800 text-slate-300 flex justify-between items-center transition"
            >
              <div>
                <span className="font-bold text-emerald-400">Carlos Santos</span>
                <span className="text-slate-400 block text-[10px] font-mono">gerente@empresa.com (MANAGER)</span>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
            </button>

            <button
              onClick={() => handleSelectQuickAccount('auditor@empresa.com', 'auditor123')}
              className="text-left p-2.5 rounded-xl bg-[#020617] hover:bg-slate-800/80 border border-slate-800 text-slate-300 flex justify-between items-center transition"
            >
              <div>
                <span className="font-bold text-purple-400">Ana Maria</span>
                <span className="text-slate-400 block text-[10px] font-mono">auditor@empresa.com (AUDITOR)</span>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-purple-500" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

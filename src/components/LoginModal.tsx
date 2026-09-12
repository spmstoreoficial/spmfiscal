import React, { useState } from 'react';
import { ShieldCheck, LogIn, X, Lock, Mail, AlertCircle, KeyRound } from 'lucide-react';
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Autenticação de Usuário</h3>
              <p className="text-[11px] text-slate-500">Acesso seguro ao Sistema Fiscal</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">E-mail de Acesso</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Senha de Segurança</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-sm disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
          </button>
        </form>

        {/* Quick Account Selector for Demo */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
          <p className="font-bold text-slate-600">Contas de Teste Pré-cadastradas:</p>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => handleSelectQuickAccount('josegaldino@hotmail.com.br', 'admin123')}
              className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex justify-between items-center transition"
            >
              <div>
                <span className="font-bold text-indigo-700">José Galdino</span>
                <span className="text-slate-500 block text-[10px]">josegaldino@hotmail.com.br (ADMIN)</span>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleSelectQuickAccount('gerente@empresa.com', 'gerente123')}
              className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex justify-between items-center transition"
            >
              <div>
                <span className="font-bold text-emerald-700">Carlos Santos</span>
                <span className="text-slate-500 block text-[10px]">gerente@empresa.com (MANAGER)</span>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleSelectQuickAccount('auditor@empresa.com', 'auditor123')}
              className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex justify-between items-center transition"
            >
              <div>
                <span className="font-bold text-amber-700">Ana Maria</span>
                <span className="text-slate-500 block text-[10px]">auditor@empresa.com (AUDITOR)</span>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

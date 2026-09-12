import React, { useState } from 'react';
import { Mail, Lock, Loader, AlertCircle, CheckCircle, Shield, KeyRound, Sparkles } from 'lucide-react';
import { api, setStoredToken } from '../lib/api';
import { User } from '../types';

interface LoginFormProps {
  onAuthSuccess: (user: User) => void;
}

export function LoginForm({ onAuthSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('josegaldino@hotmail.com.br');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um e-mail válido.');
      setLoading(false);
      return;
    }

    if (!password || password.length < 3) {
      setError('A senha deve ter no mínimo 3 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.login(email, password);
      if (res.token && res.user) {
        setStoredToken(res.token);
        setSuccess('Autenticação realizada com sucesso! Acessando...');
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 400);
      } else {
        setError('Credenciais inválidas.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar no servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] sleek-dot-grid flex items-center justify-center p-4 font-sans selection:bg-cyan-600 selection:text-white">
      <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative overflow-hidden">
        
        {/* Glow corner */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.45)] border border-cyan-400/40">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            SPM STORE
          </h1>
          <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider mt-0.5">
            Sistema Fiscal & Auditoria NFs
          </p>
          <p className="text-slate-400 text-[11px] mt-1">
            Centro de Comando Operacional & Gestão de Notas
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1.5">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-cyan-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 focus:border-cyan-500 text-white placeholder-slate-500 rounded-xl text-xs outline-none transition shadow-inner"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-cyan-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 focus:border-cyan-500 text-white placeholder-slate-500 rounded-xl text-xs outline-none transition shadow-inner"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white py-2.5 px-4 rounded-xl font-extrabold text-xs tracking-wide transition shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Entrar no Painel Fiscal
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Accounts */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 relative z-10 space-y-2">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider text-center">
            Contas Pré-configuradas (Clique para preencher):
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => handleFillDemo('josegaldino@hotmail.com.br', 'admin123')}
              className="p-1.5 rounded-lg bg-slate-900 border border-purple-500/30 text-purple-300 hover:bg-purple-950 text-center transition"
            >
              <span className="font-extrabold block">ADMIN</span>
              <span className="text-[9px] text-slate-500">Diretoria</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('gerente@empresa.com', 'gerente123')}
              className="p-1.5 rounded-lg bg-slate-900 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950 text-center transition"
            >
              <span className="font-extrabold block">GERENTE</span>
              <span className="text-[9px] text-slate-500">Faturamento</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('auditor@empresa.com', 'auditor123')}
              className="p-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 text-center transition"
            >
              <span className="font-extrabold block">AUDITOR</span>
              <span className="text-[9px] text-slate-500">Fiscal</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

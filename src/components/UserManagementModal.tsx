import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Building2,
  Lock
} from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'MANAGER' as UserRole,
    department: 'Faturamento',
    password: ''
  });

  const loadUsers = async () => {
    try {
      const list = await api.getUsers();
      setUsers(list || []);
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setErrorMessage('Nome, e-mail e senha são obrigatórios.');
      return;
    }

    try {
      setErrorMessage(null);
      await api.createUser(newUser);
      setSuccessMessage(`Usuário ${newUser.email} cadastrado com sucesso.`);
      setIsCreateOpen(false);
      setNewUser({ name: '', email: '', role: 'MANAGER', department: 'Faturamento', password: '' });
      loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar usuário');
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
      try {
        await api.deleteUser(id);
        setSuccessMessage(`Usuário ${email} removido.`);
        loadUsers();
      } catch (err: any) {
        setErrorMessage(err.message || 'Erro ao excluir usuário.');
      }
    }
  };

  const roleBadges: Record<string, string> = {
    ADMIN: 'bg-purple-950 text-purple-300 border-purple-500/40',
    MANAGER: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
    AUDITOR: 'bg-amber-950 text-amber-300 border-amber-500/40'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Gestão de Usuários & Contas de Acesso
              </h3>
              <p className="text-xs text-slate-400">
                Controle de perfis, permissões e senhas criptografadas no MySQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">
              Usuários Ativos ({users.length})
            </span>
            <button
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Novo Usuário
            </button>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* New User Form Drawer */}
          {isCreateOpen && (
            <div className="p-3.5 rounded-xl bg-[#020617] border border-purple-500/40 space-y-3">
              <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-purple-400" />
                Cadastrar Novo Usuário
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">E-mail de Login</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                    placeholder="joao@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Perfil / Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                  >
                    <option value="ADMIN">ADMIN (Controle Total)</option>
                    <option value="MANAGER">MANAGER (Gerente de Faturamento)</option>
                    <option value="AUDITOR">AUDITOR (Auditoria & Consulta)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Senha Inicial</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Salvar Usuário
                </button>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-2">
            {users.map(u => (
              <div
                key={u.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{u.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleBadges[u.role] || 'bg-slate-800 text-slate-300'}`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {u.email} {u.department ? `• ${u.department}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser?.email !== u.email && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900 transition"
                      title="Excluir Usuário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

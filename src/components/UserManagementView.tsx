import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Building2
} from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface UserManagementViewProps {
  currentUser: User | null;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New User Form State
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
    loadUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setErrorMessage('Nome, e-mail e senha são obrigatórios.');
      return;
    }

    try {
      setErrorMessage(null);
      await api.createUser(newUser);
      setSuccessMessage(`Usuário ${newUser.email} cadastrado com sucesso.`);
      setIsModalOpen(false);
      setNewUser({ name: '', email: '', role: 'MANAGER', department: 'Faturamento', password: '' });
      loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar usuário');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      setErrorMessage(null);
      await api.updateUser(editingUser.id, editingUser);
      setSuccessMessage(`Usuário ${editingUser.email} atualizado com sucesso.`);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
      try {
        await api.deleteUser(id);
        setSuccessMessage(`Usuário ${email} removido.`);
        loadUsers();
      } catch (err: any) {
        setErrorMessage(err.message || 'Erro ao excluir usuário.');
      }
    }
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    MANAGER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    AUDITOR: 'bg-amber-50 text-amber-800 border-amber-200'
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador Total',
    MANAGER: 'Gerente Fiscal',
    AUDITOR: 'Auditor (Leitura)'
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Painel de Controle de Usuários & Permissões</span>
            </h2>
            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-bold">
              RBAC Ativo
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Gestão avançada de acessos, controle de permissões por perfil e auditoria de usuários.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3.5">Nome do Usuário</th>
                <th className="p-3.5">E-mail</th>
                <th className="p-3.5">Perfil de Acesso</th>
                <th className="p-3.5">Setor / Departamento</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Último Acesso</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                  <td className="p-3.5 font-mono text-slate-500">{u.email}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${roleColors[u.role] || 'bg-slate-100 text-slate-700'}`}>
                      {roleLabels[u.role] || u.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">{u.department || 'Geral'}</td>
                  <td className="p-3.5">
                    {u.active ? (
                      <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px]">
                    {u.lastLogin !== 'Nunca' ? new Date(u.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition"
                        title="Editar Permissões"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition"
                        title="Excluir Usuário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Cadastrar Novo Usuário</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  placeholder="carlos@empresa.com"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Senha Inicial</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Perfil de Permissão (Role)</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ADMIN">ADMIN - Acesso Total e Gestão de Usuários</option>
                  <option value="MANAGER">MANAGER - Upload, Edição e Sincronização</option>
                  <option value="AUDITOR">AUDITOR - Somente Leitura e Exportação de Relatórios</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Setor / Departamento</label>
                <input
                  type="text"
                  placeholder="Ex: Contabilidade / Faturamento"
                  value={newUser.department}
                  onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-sm"
              >
                Cadastrar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Editar Usuário: {editingUser.email}</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Perfil de Permissão</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ADMIN">ADMIN - Administrador Total</option>
                  <option value="MANAGER">MANAGER - Gerente Fiscal</option>
                  <option value="AUDITOR">AUDITOR - Auditor (Leitura)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editingUser.active}
                  onChange={e => setEditingUser({ ...editingUser, active: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="activeCheck" className="text-slate-800 font-semibold cursor-pointer">Usuário Ativo no Sistema</label>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-sm"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

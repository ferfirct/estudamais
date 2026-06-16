import { useEffect, useState } from 'react';
import { Button, Input, Card, Badge, IconButton } from '../ui.jsx';
import { Trash2, Plus } from 'lucide-react';
import { listUsers, createUser, deleteUser } from '../api/admin.js';
import { toast } from '../lib.js';

export default function AdminView({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao listar usuários', description: err?.message || String(err), variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createUser(form);
      toast({ title: 'Usuário criado', variant: 'success' });
      setForm({ name: '', email: '', password: '', role: 'user' });
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao criar usuário', description: err?.message || String(err), variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) return;
    try {
      await deleteUser(id);
      toast({ title: 'Usuário deletado', variant: 'info' });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao deletar usuário', description: err?.message || String(err), variant: 'error' });
    }
  }

  const formatDate = (s) => (s ? new Date(s).toLocaleString() : '—');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">Admin — Usuários</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowForm((v) => !v)} icon={Plus}>
            Novo Usuário
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Senha" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <div>
              <select
                className="w-full py-3.5 bg-surface-2 border border-border rounded-xl px-3"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div className="md:col-span-4 flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={saving}>
                Criar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-text-muted text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Criado</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-text-muted">
                    Nenhum usuário.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === 'admin' ? 'accent' : 'default'}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(u.createdAt || u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <IconButton icon={Trash2} label="Deletar usuário" onClick={() => handleDelete(u.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

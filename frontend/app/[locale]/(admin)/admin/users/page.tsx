'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Coins, Loader2, X } from 'lucide-react';
import api from '@/lib/api';

interface AdminUser {
  id: string;
  username: string;
  role: 'user' | 'moderator' | 'admin';
  coins_balance: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [grantTarget, setGrantTarget] = useState<AdminUser | null>(null);
  const [grantAmount, setGrantAmount] = useState('100');
  const [grantReason, setGrantReason] = useState('');
  const [granting, setGranting] = useState(false);

  const fetchUsers = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q.trim()) params.set('search', q.trim());
      const { data } = await api.get(`/api/admin/users?${params.toString()}`);
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers(page, query);
  }, [page, query, fetchUsers]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: role as any } : u)));
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'No se pudo cambiar el rol (requiere rol admin).');
    }
  };

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantTarget) return;
    setGranting(true);
    try {
      const { data } = await api.post(`/api/admin/users/${grantTarget.id}/grant-coins`, {
        amount: Number(grantAmount),
        reason: grantReason.trim() || undefined,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === grantTarget.id ? { ...u, coins_balance: data.new_balance } : u
        )
      );
      setGrantTarget(null);
      setGrantReason('');
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'No se pudieron otorgar las monedas.');
    } finally {
      setGranting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">Usuarios</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {total} usuarios registrados
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(search);
          }}
          className="flex gap-2"
        >
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuario..."
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-14 text-center text-sm text-[var(--color-text-muted)]">
            No se encontraron usuarios.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--color-bg)]/60 text-xs uppercase text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Monedas</th>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-semibold">{u.username}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2.5 py-1 text-xs"
                      >
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-accent)] font-bold">
                      🪙 {u.coins_balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                      {new Date(u.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setGrantTarget(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-xs font-semibold hover:bg-[var(--color-accent)]/25 transition-colors"
                      >
                        <Coins size={13} />
                        Dar monedas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-xs disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-xs disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal otorgar monedas */}
      {grantTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setGrantTarget(null)} />
          <form
            onSubmit={handleGrantSubmit}
            className="relative bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-sm space-y-4 z-10 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setGrantTarget(null)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X size={18} />
            </button>

            <h3 className="font-bold text-lg">Otorgar monedas a {grantTarget.username}</h3>

            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Cantidad *</label>
              <input
                type="number"
                min="1"
                required
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Motivo (opcional)</label>
              <input
                type="text"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Bono / recompensa / soporte"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={granting}
              className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {granting ? 'Procesando...' : `Acreditar 🪙 ${grantAmount}`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2, Check, Ban } from 'lucide-react';
import api from '@/lib/api';

export default function AdminCoinsPage() {
  const [tab, setTab] = useState<'packages' | 'transactions'>('packages');
  const [packages, setPackages] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Nuevo paquete
  const [name, setName] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('100');
  const [bonusCoins, setBonusCoins] = useState('0');
  const [priceUsd, setPriceUsd] = useState('1.99');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgRes, txRes] = await Promise.all([
        api.get('/api/admin/coins/packages'),
        api.get('/api/admin/transactions'),
      ]);
      setPackages(pkgRes.data.packages ?? []);
      setTransactions(txRes.data.transactions ?? []);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/api/admin/coins/packages', {
        name: name.trim(),
        coins_amount: Number(coinsAmount),
        bonus_coins: Number(bonusCoins) || 0,
        price_usd: Number(priceUsd),
        is_active: true,
        sort_order: packages.length + 1,
      });
      setName('');
      void loadData();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al crear paquete.');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (pkg: any) => {
    try {
      await api.patch(`/api/admin/coins/packages/${pkg.id}`, {
        is_active: !pkg.is_active,
      });
      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al actualizar paquete.');
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">
            Monedas y Paquetes
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Configura paquetes de recarga y revisa el historial global de transacciones.
          </p>
        </div>

        <div className="flex gap-2 bg-[var(--color-card)] p-1 rounded-xl border border-[var(--color-border)] self-start">
          <button
            onClick={() => setTab('packages')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === 'packages' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
            }`}
          >
            Paquetes ({packages.length})
          </button>
          <button
            onClick={() => setTab('transactions')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === 'transactions' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
            }`}
          >
            Transacciones ({transactions.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : tab === 'packages' ? (
        <div className="space-y-6">
          {/* Crear paquete */}
          <form
            onSubmit={handleCreatePackage}
            className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mega Pack"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Monedas *</label>
              <input
                type="number"
                min="1"
                required
                value={coinsAmount}
                onChange={(e) => setCoinsAmount(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Bonus</label>
              <input
                type="number"
                min="0"
                value={bonusCoins}
                onChange={(e) => setBonusCoins(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Precio USD *</label>
              <input
                type="number"
                step="0.01"
                min="0.5"
                required
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={15} />
              Añadir
            </button>
          </form>

          {/* Tabla paquetes */}
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--color-bg)]/60 text-xs uppercase text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Monedas</th>
                  <th className="px-4 py-3">Bonus</th>
                  <th className="px-4 py-3">Precio USD</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {packages.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3 text-[var(--color-accent)] font-bold">
                      🪙 {p.coins_amount}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">+{p.bonus_coins}</td>
                    <td className="px-4 py-3 font-mono">{'$'}{Number(p.price_usd).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(p)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-[var(--color-border)] text-xs hover:border-[var(--color-primary)]"
                      >
                        {p.is_active ? <Ban size={12} /> : <Check size={12} />}
                        {p.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--color-bg)]/60 text-xs uppercase text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-medium">{tx.profiles?.username ?? '—'}</td>
                    <td className="px-4 py-3 text-xs uppercase">{tx.type}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{tx.description ?? '—'}</td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        tx.amount >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} 🪙
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">
                      {new Date(tx.created_at).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

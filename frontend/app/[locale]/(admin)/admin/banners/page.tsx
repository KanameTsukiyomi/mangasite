'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Loader2, Check, Ban } from 'lucide-react';
import api from '@/lib/api';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/banners');
      setBanners(data.banners ?? []);
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBanners();
  }, [fetchBanners]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    setCreating(true);
    try {
      await api.post('/api/admin/banners', {
        title: title.trim() || null,
        image_url: imageUrl.trim(),
        link: linkUrl.trim() || null,
        position: banners.length + 1,
        is_active: true,
      });
      setTitle('');
      setImageUrl('');
      setLinkUrl('');
      void fetchBanners();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al crear banner.');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (b: any) => {
    await api.patch(`/api/admin/banners/${b.id}`, { is_active: !b.is_active });
    setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este banner?')) return;
    await api.delete(`/api/admin/banners/${id}`);
    setBanners((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">Banners</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Gestiona banners promocionales del sitio.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Promo fin de semana"
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">URL de imagen *</label>
          <input
            type="url"
            required
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Enlace (opcional)</label>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/coins"
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
        >
          <Plus size={15} />
          Crear banner
        </button>
      </form>

      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : banners.length === 0 ? (
          <div className="py-14 text-center text-sm text-[var(--color-text-muted)]">
            No hay banners configurados.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {banners.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={b.image_url}
                    alt={b.title ?? 'Banner'}
                    className="w-28 h-14 object-cover rounded-lg border border-[var(--color-border)] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{b.title || 'Sin título'}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{b.link || 'Sin enlace'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(b)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs"
                  >
                    {b.is_active ? <Ban size={12} /> : <Check size={12} />}
                    {b.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

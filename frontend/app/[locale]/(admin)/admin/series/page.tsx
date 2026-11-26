'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Layers, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from '@/lib/navigation';
import api from '@/lib/api';

export default function AdminSeriesListPage() {
  const [series, setSeries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSeries = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/admin/series?page=${p}`);
      setSeries(data.series ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al cargar las series.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSeries(page);
  }, [page, fetchSeries]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}" y todos sus capítulos? Esta acción es irreversible.`)) return;
    try {
      await api.delete(`/api/admin/series/${id}`);
      void fetchSeries(page);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'No se pudo eliminar (requiere rol admin).');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">Series</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {total} {total === 1 ? 'serie registrada' : 'series registradas'}
          </p>
        </div>

        <Link
          href="/admin/series/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity self-start"
        >
          <Plus size={16} />
          Nueva serie
        </Link>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : series.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">
            Aún no hay series. Haz clic en &quot;Nueva serie&quot; para añadir la primera.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--color-bg)]/60 text-xs uppercase text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3">Serie</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Etiquetas</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {series.map((s) => {
                  const title =
                    s.series_translations?.find((t: any) => t.language === 'es')?.title ??
                    s.series_translations?.[0]?.title ??
                    s.slug;
                  return (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.cover_url ? (
                            <img
                              src={s.cover_url}
                              alt={title}
                              className="w-10 h-14 object-cover rounded-md border border-[var(--color-border)] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-14 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center text-xs shrink-0">
                              📖
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--color-text)] truncate max-w-[240px]">
                              {title}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
                              /{s.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-[var(--color-text-muted)]">{s.type}</td>
                      <td className="px-4 py-3 capitalize text-[var(--color-text-muted)]">{s.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.is_featured && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-300">
                              Destacado
                            </span>
                          )}
                          {s.is_hot && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-500/15 text-orange-300">
                              Hot
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/series/${s.slug}` as any}
                            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/10"
                            title="Ver en sitio"
                          >
                            <ExternalLink size={15} />
                          </Link>
                          <Link
                            href={`/admin/chapters?series_id=${s.id}` as any}
                            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-white/10"
                            title="Capítulos"
                          >
                            <Layers size={15} />
                          </Link>
                          <Link
                            href={`/admin/series/${s.id}` as any}
                            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-white/10"
                            title="Editar"
                          >
                            <Edit size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(s.id, title)}
                            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
    </div>
  );
}

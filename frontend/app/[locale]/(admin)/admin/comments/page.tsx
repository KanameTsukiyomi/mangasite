'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/comments');
      setComments((data.comments ?? []).filter((c: any) => !c.is_deleted));
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Ocultar este comentario?')) return;
    try {
      await api.delete(`/api/admin/comments/${id}`);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('No se pudo eliminar el comentario.');
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">Comentarios</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Moderación de comentarios recientes.
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-14 text-center text-sm text-[var(--color-text-muted)]">
            No hay comentarios recientes.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {comments.map((c) => {
              const sTitle =
                c.series?.series_translations?.find((t: any) => t.language === 'es')?.title ??
                c.series?.slug ??
                'Serie';
              return (
                <div key={c.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      <span className="font-semibold text-[var(--color-text)]">
                        {c.profiles?.username ?? 'Usuario'}
                      </span>
                      <span>en</span>
                      <span className="text-[var(--color-primary)]">{sTitle}</span>
                      <span>• {new Date(c.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text)]">{c.content}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 shrink-0"
                    title="Eliminar comentario"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

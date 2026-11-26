'use client';

import { useState } from 'react';
import { BookOpen, Check, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { Link } from '@/lib/navigation';
import api from '@/lib/api';

type LibraryStatus = 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';

const STATUS_LABELS: Record<LibraryStatus, string> = {
  reading:      'Leyendo',
  completed:    'Completado',
  on_hold:      'En pausa',
  dropped:      'Abandonado',
  plan_to_read: 'Pendiente',
};

interface LibraryButtonProps {
  seriesId:     string;
  initialStatus?: LibraryStatus | null;
}

export function LibraryButton({ seriesId, initialStatus }: LibraryButtonProps) {
  const { user } = useAuthStore();
  const [status,    setStatus]    = useState<LibraryStatus | null>(initialStatus ?? null);
  const [open,      setOpen]      = useState(false);
  const [loading,   setLoading]   = useState(false);

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)]
                   text-sm text-[var(--color-text-muted)] hover:border-[var(--color-primary)]
                   hover:text-[var(--color-primary)] transition-colors"
      >
        <BookOpen size={15} />
        Añadir a biblioteca
      </Link>
    );
  }

  const handleSelect = async (newStatus: LibraryStatus) => {
    setLoading(true);
    setOpen(false);
    try {
      await api.post('/api/users/me/library', { series_id: seriesId, status: newStatus });
      setStatus(newStatus);
    } catch { /* noop */ }
    setLoading(false);
  };

  const handleRemove = async () => {
    setLoading(true);
    setOpen(false);
    try {
      await api.delete(`/api/users/me/library/${seriesId}`);
      setStatus(null);
    } catch { /* noop */ }
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                    transition-colors disabled:opacity-50 ${
          status
            ? 'bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/40 text-[var(--color-primary)]'
            : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
        }`}
      >
        {status ? <Check size={15} /> : <BookOpen size={15} />}
        {status ? STATUS_LABELS[status] : 'Añadir a biblioteca'}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--color-card)]
                        border border-[var(--color-border)] rounded-xl shadow-2xl z-30 overflow-hidden">
          {(Object.entries(STATUS_LABELS) as [LibraryStatus, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                          hover:bg-white/5 ${
                status === key
                  ? 'text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              {status === key && <Check size={12} className="inline mr-2" />}
              {label}
            </button>
          ))}
          {status && (
            <>
              <div className="border-t border-[var(--color-border)]" />
              <button
                onClick={handleRemove}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Quitar de biblioteca
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { Eye, ArrowUpDown, Unlock } from 'lucide-react';
import { UnlockModal } from '@/components/reader/UnlockModal';
import { useAuthStore } from '@/lib/stores/authStore';

export interface Chapter {
  id: string;
  chapter_number: number;
  volume_number?: number;
  is_free: boolean;
  coin_cost: number;
  free_after_days?: number;
  views: number;
  pages_count: number;
  published_at: string;
  chapter_translations?: Array<{ title: string; language: string }>;
  is_accessible: boolean;
  is_unlocked_by_user: boolean;
}

interface ChapterListProps {
  chapters:   Chapter[];
  seriesSlug: string;
  locale:     string;
}

export function ChapterList({ chapters: initial, seriesSlug, locale }: ChapterListProps) {
  const { user } = useAuthStore();
  const [chapters,     setChapters]     = useState(initial);
  const [ascending,    setAscending]    = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<Chapter | null>(null);

  const sorted = [...chapters].sort((a, b) =>
    ascending ? a.chapter_number - b.chapter_number : b.chapter_number - a.chapter_number
  );

  const handleUnlockSuccess = (chapterId: string, newBalance: number) => {
    setChapters(prev =>
      prev.map(ch => ch.id === chapterId
        ? { ...ch, is_accessible: true, is_unlocked_by_user: true }
        : ch
      )
    );
    useAuthStore.getState().updateCoins(newBalance);
    setUnlockTarget(null);
  };

  return (
    <div>
      {/* Encabezado de la lista */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[var(--color-text)] text-lg">
          Capítulos{' '}
          <span className="text-[var(--color-text-muted)] font-normal text-sm">
            ({chapters.length})
          </span>
        </h2>
        <button
          onClick={() => setAscending(a => !a)}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]
                     hover:text-[var(--color-text)] transition-colors px-2 py-1 rounded"
        >
          <ArrowUpDown size={12} />
          {ascending ? 'Más nuevo primero' : 'Más viejo primero'}
        </button>
      </div>

      {/* Lista de capítulos */}
      <div className="space-y-1.5">
        {sorted.map(ch => {
          const title = ch.chapter_translations?.find(t => t.language === locale)?.title;
          const isLocked = !ch.is_accessible;
          const dateStr  = new Date(ch.published_at).toLocaleDateString(
            locale === 'es' ? 'es-ES' : 'en-US',
            { day: '2-digit', month: 'short', year: 'numeric' }
          );

          const rowContent = (
            <div className="flex items-center gap-3 w-full">
              {/* Número */}
              <span className="flex-shrink-0 w-16 text-sm font-semibold text-[var(--color-primary)]">
                Cap. {ch.chapter_number}
              </span>

              {/* Título + meta */}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-[var(--color-text)] truncate block">
                  {title || `Capítulo ${ch.chapter_number}`}
                </span>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--color-text-muted)]">
                  <span>{dateStr}</span>
                  {ch.pages_count > 0 && <span>{ch.pages_count} pág.</span>}
                  <span className="flex items-center gap-0.5">
                    <Eye size={10} /> {ch.views.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Badge */}
              <div className="flex-shrink-0">
                {isLocked ? (
                  <span className="coins-badge">🪙 {ch.coin_cost}</span>
                ) : ch.is_unlocked_by_user ? (
                  <span className="text-xs text-[var(--color-accent)] flex items-center gap-0.5">
                    <Unlock size={10} /> Desbloqueado
                  </span>
                ) : (
                  <span className="text-xs text-green-400">Libre</span>
                )}
              </div>
            </div>
          );

          const baseClass = `flex items-center px-4 py-3 rounded-xl
            bg-[var(--color-card)] border border-[var(--color-border)]
            transition-colors duration-150 ${
              isLocked
                ? 'hover:border-[var(--color-accent)]/40 cursor-pointer'
                : 'hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5'
            }`;

          return isLocked ? (
            <button
              key={ch.id}
              onClick={() => {
                if (!user) {
                  window.location.href = '/login';
                  return;
                }
                setUnlockTarget(ch);
              }}
              className={`w-full text-left ${baseClass}`}
            >
              {rowContent}
            </button>
          ) : (
            <Link
              key={ch.id}
              href={`/series/${seriesSlug}/chapter/${ch.id}` as any}
              className={baseClass}
            >
              {rowContent}
            </Link>
          );
        })}

        {sorted.length === 0 && (
          <div className="text-center py-10 text-[var(--color-text-muted)] text-sm">
            No hay capítulos disponibles aún.
          </div>
        )}
      </div>

      {/* Modal de desbloqueo */}
      {unlockTarget && (
        <UnlockModal
          chapter={unlockTarget}
          userBalance={user?.coins_balance ?? 0}
          onSuccess={handleUnlockSuccess}
          onClose={() => setUnlockTarget(null)}
        />
      )}
    </div>
  );
}

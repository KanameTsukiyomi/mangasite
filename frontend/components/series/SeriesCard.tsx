import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { Star, Eye } from 'lucide-react';

interface Chapter {
  id: string;
  chapter_number: number;
  published_at: string;
  is_free: boolean;
  coin_cost: number;
  is_accessible?: boolean;
}

export interface SeriesCardData {
  id: string;
  slug: string;
  type: string;
  status: string;
  cover_url: string | null;
  views: number;
  avg_rating: number;
  updated_at: string;
  series_translations: Array<{ title: string; language: string }>;
  chapters?: Chapter[];
}

interface SeriesCardProps {
  series: SeriesCardData;
  locale: string;
  priority?: boolean;
}

export function SeriesCard({ series, locale, priority = false }: SeriesCardProps) {
  const translation =
    series.series_translations?.find(t => t.language === locale) ??
    series.series_translations?.[0];

  const latestChapters = [...(series.chapters ?? [])]
    .sort((a, b) => b.chapter_number - a.chapter_number)
    .slice(0, 2);

  const href = `/series/${series.slug}` as const;

  return (
    <Link href={href as any} className="series-card block group">
      {/* ── Portada ── */}
      <div className="relative aspect-[2/3] overflow-hidden bg-[var(--color-secondary)]">
        {series.cover_url ? (
          <Image
            src={series.cover_url}
            alt={translation?.title ?? 'cover'}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-card)]
                          flex items-center justify-center">
            <span className="text-4xl opacity-40">📖</span>
          </div>
        )}

        {/* Tipo */}
        <span className="badge-type absolute top-2 left-2 capitalize">{series.type}</span>

        {/* Indicador premium en el último capítulo */}
        {latestChapters[0] && !latestChapters[0].is_free && !latestChapters[0].is_accessible && (
          <span className="coins-badge absolute top-2 right-2">
            🪙 {latestChapters[0].coin_cost}
          </span>
        )}

        {/* Gradiente inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-16
                        bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      {/* ── Info ── */}
      <div className="p-2.5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] line-clamp-2 leading-tight mb-1.5">
          {translation?.title ?? '—'}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mb-2">
          <span className="flex items-center gap-0.5">
            <Star size={10} className="text-[var(--color-accent)] fill-current" />
            {(series.avg_rating ?? 0).toFixed(1)}
          </span>
          <span className="flex items-center gap-0.5">
            <Eye size={10} />
            {formatViews(series.views ?? 0)}
          </span>
        </div>

        {/* Últimos capítulos */}
        <div className="space-y-0.5">
          {latestChapters.map(ch => (
            <div key={ch.id} className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-primary)] font-medium">
                Cap. {ch.chapter_number}
              </span>
              <span className="text-[var(--color-text-muted)]">
                {timeAgo(ch.published_at)}
              </span>
            </div>
          ))}
          {latestChapters.length === 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">Sin capítulos</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Helpers ─────────────────────────────────────────────────────
function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (mins  > 0) return `${mins}m`;
  return 'ahora';
}

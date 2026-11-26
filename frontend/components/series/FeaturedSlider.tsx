'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { ChevronLeft, ChevronRight, Star, Eye } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface FeaturedSeries {
  id: string;
  slug: string;
  type: string;
  status: string;
  cover_url: string | null;
  banner_url: string | null;
  avg_rating: number;
  views: number;
  series_translations: Array<{
    title: string;
    description: string | null;
    language: string;
  }>;
}

interface FeaturedSliderProps {
  items: FeaturedSeries[];
}

export function FeaturedSlider({ items }: FeaturedSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const locale = useLocale();
  const t      = useTranslations('home');

  const next = useCallback(
    () => setCurrent(c => (c + 1) % items.length),
    [items.length]
  );
  const prev = () => setCurrent(c => (c - 1 + items.length) % items.length);

  // Auto-advance cada 5 segundos
  useEffect(() => {
    if (paused || items.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused, items.length]);

  if (!items.length) return null;

  const item = items[current];
  const tr   = item.series_translations?.find(t => t.language === locale)
             ?? item.series_translations?.[0];
  const bgSrc = item.banner_url || item.cover_url;

  return (
    <section
      className="relative h-[400px] md:h-[480px] overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Fondo deslizante ── */}
      {items.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {(s.banner_url || s.cover_url) ? (
            <Image
              src={(s.banner_url || s.cover_url)!}
              alt=""
              fill
              priority={i === 0}
              className="object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-bg)]" />
          )}
          {/* Gradientes de oscurecimiento */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)] via-[var(--color-bg)]/75 to-[var(--color-bg)]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-transparent" />
        </div>
      ))}

      {/* ── Contenido ── */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6
                      flex items-center gap-6 md:gap-10">
        {/* Portada (solo desktop) */}
        <div className="hidden md:block flex-shrink-0 w-40 lg:w-48 h-60 lg:h-72
                        relative rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/10">
          {item.cover_url ? (
            <Image src={item.cover_url} alt={tr?.title ?? ''} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[var(--color-card)] flex items-center justify-center">
              <span className="text-5xl opacity-30">📖</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 max-w-lg">
          <span className="badge-type mb-3 inline-block capitalize">{item.type}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--color-text)]
                         leading-tight mb-3 line-clamp-2">
            {tr?.title}
          </h2>

          {/* Rating y vistas */}
          <div className="flex items-center gap-4 mb-4 text-sm text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Star size={14} className="text-[var(--color-accent)] fill-current" />
              {(item.avg_rating ?? 0).toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {formatViews(item.views ?? 0)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs border border-[var(--color-border)]
                             text-[var(--color-text-muted)] capitalize">
              {item.status}
            </span>
          </div>

          {/* Descripción */}
          {tr?.description && (
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-6 line-clamp-3">
              {tr.description}
            </p>
          )}

          {/* Botón */}
          <Link
            href={`/series/${item.slug}` as any}
            className="inline-flex items-center gap-2 bg-[var(--color-primary)]
                       hover:opacity-90 text-white font-semibold
                       px-6 py-3 rounded-lg transition-opacity text-sm sm:text-base"
          >
            {t('continue_reading')} →
          </Link>
        </div>
      </div>

      {/* ── Botones prev / next ── */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full
                       bg-black/40 hover:bg-black/60 text-white transition-colors z-10"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full
                       bg-black/40 hover:bg-black/60 text-white transition-colors z-10"
            aria-label="Siguiente"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-6 bg-[var(--color-primary)]'
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

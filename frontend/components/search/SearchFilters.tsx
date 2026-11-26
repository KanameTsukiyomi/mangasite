'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';

export interface GenreOption {
  id: string;
  slug: string;
  name: string;
}

interface SearchFiltersProps {
  initialQ: string;
  initialType: string;
  initialStatus: string;
  initialGenre: string;
  initialSort: string;
  genres: GenreOption[];
}

export function SearchFilters({
  initialQ,
  initialType,
  initialStatus,
  initialGenre,
  initialSort,
  genres,
}: SearchFiltersProps) {
  const tSearch = useTranslations('search');
  const tSeries = useTranslations('series');
  const router = useRouter();

  const [q, setQ] = useState(initialQ);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  const updateParams = (overrides: Record<string, string>) => {
    const next: Record<string, string> = {
      q: initialQ,
      type: initialType,
      status: initialStatus,
      genre: initialGenre,
      sort: initialSort,
      ...overrides,
    };

    const params = new URLSearchParams();
    if (next.q.trim()) params.set('q', next.q.trim());
    if (next.type) params.set('type', next.type);
    if (next.status) params.set('status', next.status);
    if (next.genre) params.set('genre', next.genre);
    if (next.sort && next.sort !== 'updated_at') params.set('sort', next.sort);

    const qs = params.toString();
    router.push((qs ? `/search?${qs}` : '/search') as any);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q });
  };

  const hasActiveFilters = Boolean(
    initialQ || initialType || initialStatus || initialGenre || (initialSort && initialSort !== 'updated_at')
  );

  const selectClass =
    'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--color-primary)] transition-colors w-full';

  return (
    <div className="bg-[var(--color-card)]/60 border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Buscador de texto */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tSearch('placeholder')}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)]"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {tSearch('filters') === 'Filtros' ? 'Buscar' : 'Search'}
        </button>
      </form>

      {/* Fila de selectores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
        {/* Tipo */}
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">
            {tSearch('type')}
          </label>
          <select
            value={initialType}
            onChange={(e) => updateParams({ type: e.target.value })}
            className={selectClass}
          >
            <option value="">{tSearch('all_types')}</option>
            <option value="manga">{tSeries('type.manga')}</option>
            <option value="manhwa">{tSeries('type.manhwa')}</option>
            <option value="manhua">{tSeries('type.manhua')}</option>
            <option value="webtoon">{tSeries('type.webtoon')}</option>
            <option value="novel">{tSeries('type.novel')}</option>
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">
            {tSearch('status')}
          </label>
          <select
            value={initialStatus}
            onChange={(e) => updateParams({ status: e.target.value })}
            className={selectClass}
          >
            <option value="">{tSearch('all_statuses')}</option>
            <option value="ongoing">{tSeries('status.ongoing')}</option>
            <option value="completed">{tSeries('status.completed')}</option>
            <option value="hiatus">{tSeries('status.hiatus')}</option>
            <option value="dropped">{tSeries('status.dropped')}</option>
          </select>
        </div>

        {/* Género */}
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">
            {tSearch('genre')}
          </label>
          <select
            value={initialGenre}
            onChange={(e) => updateParams({ genre: e.target.value })}
            className={selectClass}
          >
            <option value="">{tSearch('all_genres')}</option>
            {genres.map((g) => (
              <option key={g.id} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Orden */}
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">
            {tSearch('sort')}
          </label>
          <select
            value={initialSort || 'updated_at'}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className={selectClass}
          >
            <option value="updated_at">{tSearch('sort_updated')}</option>
            <option value="views">{tSearch('sort_views')}</option>
            <option value="rating">{tSearch('sort_rating')}</option>
            <option value="created_at">{tSearch('sort_new')}</option>
          </select>
        </div>
      </div>

      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <SlidersHorizontal size={12} />
            {tSearch('filters')}
          </span>
          <button
            type="button"
            onClick={() => {
              setQ('');
              router.push('/search' as any);
            }}
            className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
          >
            <RotateCcw size={12} />
            {tSearch('filters') === 'Filtros' ? 'Limpiar filtros' : 'Reset filters'}
          </button>
        </div>
      )}
    </div>
  );
}

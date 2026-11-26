import { getLocale, getTranslations } from 'next-intl/server';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { SeriesCard, SeriesCardData } from '@/components/series/SeriesCard';
import { SearchFilters, GenreOption } from '@/components/search/SearchFilters';

interface SearchPageProps {
  searchParams: {
    q?: string;
    type?: string;
    status?: string;
    genre?: string;
    sort?: string;
    page?: string;
  };
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const locale = await getLocale();
  const t = await getTranslations('search');
  const sp = searchParams;

  const q = sp.q ?? '';
  const type = sp.type ?? '';
  const status = sp.status ?? '';
  const genre = sp.genre ?? '';
  const sort = sp.sort ?? 'updated_at';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const apiParams = new URLSearchParams({
    lang: locale,
    page: String(page),
    limit: '24',
    sort,
  });
  if (q) apiParams.set('search', q);
  if (type) apiParams.set('type', type);
  if (status) apiParams.set('status', status);
  if (genre) apiParams.set('genre', genre);

  const [resultsRes, genresRes] = await Promise.all([
    fetch(`${API}/api/series?${apiParams.toString()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(`${API}/api/series/genres?lang=${locale}`, { next: { revalidate: 600 } })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const series: SeriesCardData[] = resultsRes?.series ?? [];
  const total: number = resultsRes?.total ?? 0;
  const totalPages: number = resultsRes?.totalPages ?? 1;
  const genres: GenreOption[] = genresRes?.genres ?? [];

  const buildPageHref = (targetPage: number) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (type) p.set('type', type);
    if (status) p.set('status', status);
    if (genre) p.set('genre', genre);
    if (sort && sort !== 'updated_at') p.set('sort', sort);
    if (targetPage > 1) p.set('page', String(targetPage));
    const qs = p.toString();
    return qs ? `/search?${qs}` : '/search';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Título + contador */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">
            {locale === 'en' ? 'Catalog' : 'Catálogo'}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {total} {total === 1 ? (locale === 'en' ? 'series found' : 'serie encontrada') : (locale === 'en' ? 'series found' : 'series encontradas')}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <SearchFilters
        initialQ={q}
        initialType={type}
        initialStatus={status}
        initialGenre={genre}
        initialSort={sort}
        genres={genres}
      />

      {/* Resultados */}
      {series.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[var(--color-card)]/40 border border-[var(--color-border)] rounded-2xl">
          <span className="text-5xl mb-3">🔍</span>
          <p className="text-base font-medium text-[var(--color-text)]">{t('no_results')}</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {locale === 'en'
              ? 'Try adjusting your search terms or filters.'
              : 'Prueba ajustando tu búsqueda o los filtros.'}
          </p>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          {page > 1 ? (
            <Link
              href={buildPageHref(page - 1) as any}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
            >
              <ChevronLeft size={16} />
              {locale === 'en' ? 'Previous' : 'Anterior'}
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--color-card)]/40 border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] opacity-40 cursor-not-allowed">
              <ChevronLeft size={16} />
              {locale === 'en' ? 'Previous' : 'Anterior'}
            </span>
          )}

          <span className="text-sm text-[var(--color-text-muted)] px-2">
            {page} / {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={buildPageHref(page + 1) as any}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
            >
              {locale === 'en' ? 'Next' : 'Siguiente'}
              <ChevronRight size={16} />
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--color-card)]/40 border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] opacity-40 cursor-not-allowed">
              {locale === 'en' ? 'Next' : 'Siguiente'}
              <ChevronRight size={16} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

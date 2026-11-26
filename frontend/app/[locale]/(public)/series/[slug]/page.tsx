import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BookOpen, Eye, Layers, Palette, User } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { ChapterList, Chapter } from '@/components/series/ChapterList';
import { LibraryButton } from '@/components/series/LibraryButton';
import { RatingStars } from '@/components/series/RatingStars';

interface PageProps {
  params: { locale: string; slug: string };
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const STATUS_LABELS: Record<string, Record<string, string>> = {
  es: {
    ongoing:   'En progreso',
    completed: 'Completado',
    hiatus:    'En pausa',
    dropped:   'Abandonado',
  },
  en: {
    ongoing:   'Ongoing',
    completed: 'Completed',
    hiatus:    'Hiatus',
    dropped:   'Dropped',
  },
};

async function fetchSeriesDetail(slug: string, lang: string) {
  try {
    const res = await fetch(`${API}/api/series/${slug}?lang=${lang}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchSeriesChapters(slug: string, lang: string) {
  try {
    const res = await fetch(`${API}/api/series/${slug}/chapters?lang=${lang}&order=desc`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { locale, slug } = params;

  const [seriesRes, chaptersRes] = await Promise.all([
    fetchSeriesDetail(slug, locale),
    fetchSeriesChapters(slug, locale),
  ]);

  if (!seriesRes?.series) notFound();

  const series = seriesRes.series;
  const chapters: Chapter[] = chaptersRes?.chapters ?? [];

  const tr =
    series.series_translations?.find((t: any) => t.language === locale) ??
    series.series_translations?.[0];

  const title = tr?.title ?? series.slug;
  const description = tr?.description ?? '';
  const author = tr?.author ?? '';
  const artist = tr?.artist ?? '';
  const altTitles: string[] = Array.isArray(tr?.alt_titles) ? tr.alt_titles : [];

  const genres: Array<{ id: string; slug: string; name: string }> = (
    series.series_genres ?? []
  )
    .map((sg: any) => {
      const g = sg.genres;
      if (!g) return null;
      const gTr =
        g.genre_translations?.find((t: any) => t.language === locale) ??
        g.genre_translations?.[0];
      return {
        id: g.id,
        slug: g.slug,
        name: gTr?.name ?? g.slug,
      };
    })
    .filter(Boolean);

  // Primer capítulo (orden ascendente) para el botón "Empezar a leer"
  const sortedAsc = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);
  const firstChapter = sortedAsc.find((c) => c.is_accessible) ?? sortedAsc[0];
  const latestChapter = chapters[0];

  const statusLabel =
    STATUS_LABELS[locale]?.[series.status] ??
    STATUS_LABELS.es[series.status] ??
    series.status;

  const heroImage = series.banner_url || series.cover_url;

  return (
    <div className="min-h-screen pb-16">
      {/* ── Hero con banner difuminado ── */}
      <div className="relative overflow-hidden border-b border-[var(--color-border)]">
        {heroImage && (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={title}
              fill
              priority
              className="object-cover opacity-20 blur-xl scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/80 to-[var(--color-bg)]/40" />
          </div>
        )}

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            {/* Portada */}
            <div className="w-44 sm:w-52 aspect-[2/3] relative rounded-xl overflow-hidden shadow-2xl border border-[var(--color-border)] flex-shrink-0 bg-[var(--color-card)]">
              {series.cover_url ? (
                <Image
                  src={series.cover_url}
                  alt={title}
                  fill
                  priority
                  sizes="(max-width: 768px) 176px, 208px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-card)] flex items-center justify-center">
                  <span className="text-5xl opacity-40">📖</span>
                </div>
              )}
            </div>

            {/* Metadatos */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                <span className="badge-type capitalize">{series.type}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  {statusLabel}
                </span>
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] ml-1">
                  <Eye size={13} />
                  {(series.views ?? 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <Layers size={13} />
                  {chapters.length} {locale === 'en' ? 'chapters' : 'capítulos'}
                </span>
              </div>

              {/* Título */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--color-text)] leading-tight mb-2">
                {title}
              </h1>

              {altTitles.length > 0 && (
                <p className="text-xs text-[var(--color-text-muted)] mb-3 line-clamp-1">
                  {altTitles.join(' • ')}
                </p>
              )}

              {/* Valoración */}
              <div className="flex justify-center md:justify-start mb-4">
                <RatingStars
                  seriesId={series.id}
                  avgRating={Number(series.avg_rating ?? 0)}
                  ratingCount={Number(series.rating_count ?? 0)}
                  userRating={seriesRes.userRating ?? null}
                />
              </div>

              {/* Autor / Arte */}
              {(author || artist) && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-[var(--color-text-muted)] mb-4">
                  {author && (
                    <span className="flex items-center gap-1.5">
                      <User size={14} className="text-[var(--color-primary)]" />
                      <strong className="text-[var(--color-text)] font-medium">
                        {locale === 'en' ? 'Author:' : 'Autor:'}
                      </strong>{' '}
                      {author}
                    </span>
                  )}
                  {artist && (
                    <span className="flex items-center gap-1.5">
                      <Palette size={14} className="text-[var(--color-primary)]" />
                      <strong className="text-[var(--color-text)] font-medium">
                        {locale === 'en' ? 'Artist:' : 'Arte:'}
                      </strong>{' '}
                      {artist}
                    </span>
                  )}
                </div>
              )}

              {/* Géneros */}
              {genres.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-5">
                  {genres.map((g) => (
                    <Link
                      key={g.id}
                      href={`/search?genre=${g.slug}` as any}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                {firstChapter && (
                  <Link
                    href={`/series/${slug}/chapter/${firstChapter.id}` as any}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-[var(--color-primary)]/20"
                  >
                    <BookOpen size={16} />
                    {locale === 'en'
                      ? `Start Reading (Ch. ${firstChapter.chapter_number})`
                      : `Empezar a leer (Cap. ${firstChapter.chapter_number})`}
                  </Link>
                )}

                {latestChapter && latestChapter.id !== firstChapter?.id && (
                  <Link
                    href={`/series/${slug}/chapter/${latestChapter.id}` as any}
                    className="px-5 py-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
                  >
                    {locale === 'en'
                      ? `Latest: Ch. ${latestChapter.chapter_number}`
                      : `Último: Cap. ${latestChapter.chapter_number}`}
                  </Link>
                )}

                <LibraryButton
                  seriesId={series.id}
                  initialStatus={seriesRes.userLibraryStatus ?? null}
                />
              </div>

              {/* Sinopsis */}
              {description && (
                <div className="text-left bg-[var(--color-card)]/60 border border-[var(--color-border)] rounded-xl p-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                    {locale === 'en' ? 'Synopsis' : 'Sinopsis'}
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lista de capítulos ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <ChapterList chapters={chapters} seriesSlug={slug} locale={locale} />
      </div>
    </div>
  );
}

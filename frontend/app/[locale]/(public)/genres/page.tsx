import { getLocale, getTranslations } from 'next-intl/server';
import { Tags } from 'lucide-react';
import { Link } from '@/lib/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default async function GenresPage() {
  const locale = await getLocale();
  const tNav = await getTranslations('nav');

  let genres: Array<{ id: string; slug: string; name: string }> = [];
  try {
    const res = await fetch(`${API}/api/series/genres?lang=${locale}`, {
      next: { revalidate: 600 },
    });
    if (res.ok) {
      const data = await res.json();
      genres = data.genres ?? [];
    }
  } catch {
    genres = [];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="flex items-center gap-3">
        <Tags className="text-[var(--color-primary)]" size={26} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">{tNav('genres')}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {locale === 'en'
              ? 'Explore series by your favorite genre.'
              : 'Explora series según tu género favorito.'}
          </p>
        </div>
      </div>

      {genres.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/40 text-sm text-[var(--color-text-muted)]">
          {locale === 'en' ? 'No genres available.' : 'No hay géneros disponibles todavía.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {genres.map((g) => (
            <Link
              key={g.id}
              href={`/search?genre=${g.slug}` as any}
              className="group p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors flex items-center justify-between"
            >
              <span className="font-semibold text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                {g.name}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

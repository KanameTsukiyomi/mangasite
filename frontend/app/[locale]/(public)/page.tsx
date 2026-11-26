import { getLocale } from 'next-intl/server';
import { FeaturedSlider } from '@/components/series/FeaturedSlider';
import { SeriesCard, SeriesCardData } from '@/components/series/SeriesCard';
import { SectionHeader } from '@/components/series/SectionHeader';

// ── Helpers de fetch (server-side, cacheados) ─────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function fetchJSON<T>(path: string, lang: string, ttl = 300): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}?lang=${lang}`, {
      next: { revalidate: ttl },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ── Página de inicio ──────────────────────────────────────────────
export default async function HomePage() {
  const locale = await getLocale();

  // Fetch en paralelo — si alguno falla, devuelve null y mostramos array vacío
  const [featuredRes, latestRes, hotRes] = await Promise.all([
    fetchJSON<{ featured: any[] }>('/api/series/featured', locale),
    fetchJSON<{ latest:   any[] }>('/api/series/latest',   locale, 60),
    fetchJSON<{ hot:      any[] }>('/api/series/hot',      locale, 120),
  ]);

  const featured = featuredRes?.featured ?? [];
  const latest   = latestRes?.latest     ?? [];
  const hot      = hotRes?.hot           ?? [];

  return (
    <>
      {/* ── Slider destacados ── */}
      <FeaturedSlider items={featured} />

      {/* ── Contenido principal ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14">

        {/* ── Últimas actualizaciones ── */}
        <section>
          <SectionHeader
            title="Últimas actualizaciones"
            href="/search?sort=updated_at"
            viewAllLabel="Ver todo"
          />
          {latest.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {latest.map((s: SeriesCardData, i) => (
                <SeriesCard key={s.id} series={s} locale={locale} priority={i < 6} />
              ))}
            </div>
          ) : (
            <EmptyState message="No hay series disponibles aún." />
          )}
        </section>

        {/* ── Tendencias ── */}
        {hot.length > 0 && (
          <section>
            <SectionHeader
              title="🔥 Tendencias"
              href="/search?sort=views"
              viewAllLabel="Ver todo"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {hot.map((s: SeriesCardData) => (
                <SeriesCard key={s.id} series={s} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ── Información para nuevos usuarios (si no hay contenido) ── */}
        {featured.length === 0 && latest.length === 0 && (
          <WelcomeCard />
        )}
      </div>
    </>
  );
}

// ── Componentes auxiliares ────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">📚</span>
      <p className="text-[var(--color-text-muted)] text-sm">{message}</p>
    </div>
  );
}

function WelcomeCard() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]
                    p-8 text-center max-w-xl mx-auto">
      <div className="text-5xl mb-4">🚀</div>
      <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
        ¡Bienvenido a MangaSite!
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        El sitio está listo. Accede al panel de administración para empezar a subir series y capítulos.
      </p>
      <a
        href="/admin/dashboard"
        className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white
                   font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm"
      >
        Ir al panel admin →
      </a>
    </div>
  );
}

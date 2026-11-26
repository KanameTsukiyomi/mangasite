'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { BookOpen, Trash2, Loader2 } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import api from '@/lib/api';

type LibraryStatus = 'all' | 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';

export default function LibraryPage() {
  const t = useTranslations('library');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const { user, loading: authLoading, loadUser } = useAuthStore();

  const [filter, setFilter] = useState<LibraryStatus>('all');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const fetchLibrary = useCallback(async () => {
    if (!useAuthStore.getState().user) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ lang: locale });
      if (filter !== 'all') qs.set('status', filter);
      const { data } = await api.get(`/api/users/me/library?${qs.toString()}`);
      setEntries(data.library ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [locale, filter]);

  useEffect(() => {
    if (user) {
      void fetchLibrary();
    }
  }, [user, fetchLibrary]);

  const handleRemove = async (seriesId: string) => {
    try {
      await api.delete(`/api/users/me/library/${seriesId}`);
      setEntries((prev) => prev.filter((e) => e.series?.id !== seriesId));
    } catch {
      // noop
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-5xl">📚</div>
        <h1 className="text-2xl font-black text-[var(--color-text)]">{tNav('library')}</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {locale === 'en'
            ? 'Sign in to organize your favorite series.'
            : 'Inicia sesión para guardar y organizar tus series favoritas.'}
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
        >
          {tNav('login')}
        </Link>
      </div>
    );
  }

  const tabs: Array<{ key: LibraryStatus; label: string }> = [
    { key: 'all',          label: locale === 'en' ? 'All' : 'Todas' },
    { key: 'reading',      label: t('reading') },
    { key: 'completed',    label: t('completed') },
    { key: 'on_hold',      label: t('on_hold') },
    { key: 'plan_to_read', label: t('plan_to_read') },
    { key: 'dropped',      label: t('dropped') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="text-[var(--color-primary)]" size={24} />
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">{tNav('library')}</h1>
      </div>

      {/* Tabs de estado */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setFilter(tb.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filter === tb.key
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/40 space-y-3">
          <p className="text-4xl">📚</p>
          <p className="text-sm text-[var(--color-text-muted)]">{t('empty')}</p>
          <Link
            href="/search"
            className="inline-block px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-semibold"
          >
            {locale === 'en' ? 'Browse catalog' : 'Explorar catálogo'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {entries.map((entry) => {
            const s = entry.series;
            if (!s) return null;
            const title = s.series_translations?.[0]?.title ?? s.slug;
            return (
              <div
                key={s.id}
                className="group rounded-xl overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)] flex flex-col"
              >
                <Link href={`/series/${s.slug}` as any} className="relative aspect-[2/3] block bg-[var(--color-secondary)] overflow-hidden">
                  {s.cover_url ? (
                    <img
                      src={s.cover_url}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">
                      📖
                    </div>
                  )}
                  <span className="badge-type absolute top-2 left-2 capitalize">{s.type}</span>
                </Link>
                <div className="p-2.5 flex-1 flex flex-col justify-between gap-2">
                  <Link
                    href={`/series/${s.slug}` as any}
                    className="text-sm font-semibold text-[var(--color-text)] line-clamp-2 hover:text-[var(--color-primary)]"
                  >
                    {title}
                  </Link>
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <span className="text-[var(--color-primary)] font-medium">
                      {t(entry.status as any)}
                    </span>
                    <button
                      onClick={() => handleRemove(s.id)}
                      className="p-1 text-[var(--color-text-muted)] hover:text-red-400"
                      title="Quitar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

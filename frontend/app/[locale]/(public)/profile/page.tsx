'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Save, History, BookOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import api from '@/lib/api';

export default function ProfilePage() {
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const { user, loading: isLoading, loadUser } = useAuthStore();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState('');

  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      setUsername(user.username ?? '');
      setBio(user.bio ?? '');
      setLanguage((user.language as 'es' | 'en') ?? 'es');

      setHistoryLoading(true);
      api
        .get(`/api/users/me/history?lang=${locale}`)
        .then(({ data }) => setHistory(data.history ?? []))
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [user, locale]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedOk(false);
    setError('');
    try {
      await api.patch('/api/users/me', { username, bio, language });
      await loadUser();
      setSavedOk(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-5xl">👤</div>
        <h1 className="text-2xl font-black text-[var(--color-text)]">{tNav('profile')}</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {locale === 'en'
            ? 'Sign in to view and edit your profile.'
            : 'Inicia sesión para ver y editar tu perfil.'}
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Cabecera */}
      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-black overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              user.username.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--color-text)]">{user.username}</h1>
            <p className="text-xs uppercase tracking-wider text-[var(--color-primary)] font-bold mt-0.5">
              {user.role}
            </p>
          </div>
        </div>

        <Link
          href="/coins"
          className="px-4 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors flex items-center gap-2 text-sm font-bold text-[var(--color-accent)]"
        >
          🪙 {user.coins_balance.toLocaleString()} {locale === 'en' ? 'coins' : 'monedas'}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editar perfil */}
        <form
          onSubmit={handleSave}
          className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 space-y-4 h-fit"
        >
          <h2 className="font-bold text-lg text-[var(--color-text)]">
            {locale === 'en' ? 'Account Settings' : 'Ajustes de cuenta'}
          </h2>

          {savedOk && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs">
              <CheckCircle2 size={15} />
              {locale === 'en' ? 'Profile updated!' : '¡Perfil actualizado!'}
            </div>
          )}
          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">
              {locale === 'en' ? 'Username' : 'Nombre de usuario'}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={locale === 'en' ? 'Tell us about your favorite series...' : 'Cuéntanos qué te gusta leer...'}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">
              {locale === 'en' ? 'Preferred language' : 'Idioma preferido'}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {locale === 'en' ? 'Save changes' : 'Guardar cambios'}
          </button>
        </form>

        {/* Historial de lectura */}
        <section className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-[var(--color-text)] flex items-center gap-2">
              <History size={18} className="text-[var(--color-primary)]" />
              {locale === 'en' ? 'Reading History' : 'Historial de lectura'}
            </h2>
            <Link href="/library" className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
              <BookOpen size={13} />
              {tNav('library')}
            </Link>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--color-text-muted)]">
              {locale === 'en' ? 'No reading history yet.' : 'Aún no has leído ningún capítulo.'}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {history.map((item) => {
                const series = item.chapters?.series;
                const title =
                  series?.series_translations?.[0]?.title ?? series?.slug ?? 'Serie';
                return (
                  <Link
                    key={item.chapter_id}
                    href={`/series/${series?.slug}/chapter/${item.chapter_id}` as any}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {series?.cover_url ? (
                        <img
                          src={series.cover_url}
                          alt={title}
                          className="w-10 h-14 object-cover rounded-md shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-14 rounded-md bg-[var(--color-card)] flex items-center justify-center shrink-0">
                          📖
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[var(--color-text)] truncate">
                          {title}
                        </p>
                        <p className="text-xs text-[var(--color-primary)]">
                          Cap. {item.chapters?.chapter_number} • Pág. {item.page_number}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">
                      {new Date(item.read_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES')}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

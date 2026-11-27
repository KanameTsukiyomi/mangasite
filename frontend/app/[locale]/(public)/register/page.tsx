'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/lib/navigation';
import { getSupabase } from '@/lib/supabase';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';

export default function RegisterPage() {
  const t      = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const supabase = getSupabase();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { language: locale },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/${locale}`)}`,
      },
    });

    if (err) {
      setError(err.message ?? t('register_error'));
      setLoading(false);
      return;
    }

    if (!data.session) {
      setSuccess(t('check_email'));
      setLoading(false);
      return;
    }

    // Redirigir al inicio; el trigger de Supabase creará el perfil automáticamente
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center
                          justify-center text-white font-black text-xl mx-auto mb-3">M</div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">MangaSite</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('register')}</p>
        </div>

        <div className="bg-[var(--color-card)] border border-[var(--color-border)]
                        rounded-2xl p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3
                            text-sm text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3
                            text-sm text-emerald-300">
              {success}
            </div>
          )}

          <SocialAuthButtons onError={setError} disabled={loading} />

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--color-border)] w-full" />
            <span className="bg-[var(--color-card)] px-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
              {t('or_email')}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                {t('email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)]
                           text-[var(--color-text)] rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                {t('password')} <span className="text-[var(--color-text-muted)]">(mín. 6)</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)]
                           text-[var(--color-text)] rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-white font-semibold
                         py-2.5 rounded-lg hover:opacity-90 transition-opacity
                         disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '...' : t('register')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
          {t('have_account')}{' '}
          <Link href="/login" className="text-[var(--color-primary)] hover:opacity-80 font-medium">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}

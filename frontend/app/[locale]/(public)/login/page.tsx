'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/lib/navigation';
import { getSupabase } from '@/lib/supabase';

export default function LoginPage() {
  const t      = useTranslations('auth');
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = getSupabase();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError(t('login_error'));
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center
                          justify-center text-white font-black text-xl mx-auto mb-3">M</div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">MangaSite</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('login')}</p>
        </div>

        <form onSubmit={handleSubmit}
              className="bg-[var(--color-card)] border border-[var(--color-border)]
                         rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3
                            text-sm text-red-400">
              {error}
            </div>
          )}

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
              {t('password')}
            </label>
            <input
              type="password"
              required
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
            {loading ? 'Cargando...' : t('login')}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
          {t('no_account')}{' '}
          <Link href="/register" className="text-[var(--color-primary)] hover:opacity-80 font-medium">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
}

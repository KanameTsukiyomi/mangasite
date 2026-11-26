'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { UserMenu } from '@/components/common/UserMenu';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { Search, Menu, X, Coins } from 'lucide-react';
import { useRouter, usePathname } from '@/lib/navigation';

const NAV_LINKS = [
  { key: 'home',    href: '/' },
  { key: 'latest',  href: '/search?sort=updated_at' },
  { key: 'genres',  href: '/genres' },
] as const;

export function Header() {
  const { user, loadUser } = useAuthStore();
  const t       = useTranslations('nav');
  const locale  = useLocale();
  const pathname = usePathname();
  const router  = useRouter();

  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');

  // Cargar sesión al montar
  useEffect(() => { void loadUser(); }, [loadUser]);

  // Efecto de scroll para el fondo del header
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}` as any);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-[var(--color-bg)]/95 backdrop-blur-md border-b border-[var(--color-border)] shadow-lg'
            : 'bg-[var(--color-bg)]/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

          {/* ── Botón hamburguesa (móvil) ── */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            aria-label="Menú"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center
                            justify-center text-white font-black text-sm">M</div>
            <span className="font-black text-lg text-[var(--color-text)] hidden sm:block tracking-tight">
              MangaSite
            </span>
          </Link>

          {/* ── Navegación desktop ── */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV_LINKS.map(link => (
              <Link
                key={link.key}
                href={link.href as any}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
                }`}
              >
                {t(link.key as any)}
              </Link>
            ))}
          </nav>

          {/* ── Spacer ── */}
          <div className="flex-1" />

          {/* ── Barra de búsqueda (desktop) ── */}
          <div className="hidden md:flex items-center">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar series..."
                  className="bg-[var(--color-card)] border border-[var(--color-border)]
                             text-[var(--color-text)] text-sm rounded-lg px-3 py-1.5 w-52
                             focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
                <button type="button" onClick={() => setSearchOpen(false)}
                  className="ml-1 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                  <X size={16} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]
                           hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Buscar"
              >
                <Search size={18} />
              </button>
            )}
          </div>

          {/* ── Language switcher ── */}
          <LanguageSwitcher />

          {/* ── Auth ── */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Monedas */}
              <Link
                href="/coins"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold
                           text-[var(--color-accent)] hover:opacity-80 transition-opacity"
              >
                🪙 {user.coins_balance.toLocaleString()}
              </Link>
              <UserMenu />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]
                           transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="text-sm bg-[var(--color-primary)] text-white font-semibold
                           px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>

        {/* ── Búsqueda en móvil (barra debajo del header) ── */}
        {searchOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]">
            <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-2">
              <Search size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar series..."
                className="flex-1 bg-transparent text-[var(--color-text)] text-sm
                           focus:outline-none placeholder:text-[var(--color-text-muted)]"
              />
              <button type="button" onClick={() => setSearchOpen(false)}>
                <X size={16} className="text-[var(--color-text-muted)]" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ── Menú móvil ── */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* ── Espacio para el header fijo ── */}
      <div className="h-16" />
    </>
  );
}

'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { X, Home, Clock, BookOpen, Layers, Coins, User, Shield, LogOut } from 'lucide-react';

const NAV_LINKS = [
  { key: 'home',    href: '/',                        icon: Home },
  { key: 'latest',  href: '/search?sort=updated_at',  icon: Clock },
  { key: 'genres',  href: '/genres',                  icon: Layers },
  { key: 'library', href: '/library',                 icon: BookOpen },
] as const;

interface MobileMenuProps {
  open:    boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { user, logout } = useAuthStore();
  const t       = useTranslations('nav');
  const pathname = usePathname();

  // Bloquear scroll cuando está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel deslizante */}
      <div
        className={`fixed left-0 top-0 bottom-0 z-50 w-72 bg-[var(--color-card)]
                    border-r border-[var(--color-border)] md:hidden
                    transition-transform duration-300 ease-in-out flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del panel */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--color-border)]">
          <span className="font-black text-lg text-[var(--color-text)]">MangaSite</span>
          <button onClick={onClose} className="p-2 text-[var(--color-text-muted)]">
            <X size={20} />
          </button>
        </div>

        {/* Usuario (si está autenticado) */}
        {user && (
          <div className="px-4 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center
                              justify-center text-white font-bold text-sm">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)] text-sm">{user.username}</p>
                <p className="text-xs text-[var(--color-accent)]">
                  🪙 {user.coins_balance.toLocaleString()} monedas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_LINKS.map(link => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.key}
                href={link.href as any}
                onClick={onClose}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  active
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {t(link.key as any)}
              </Link>
            );
          })}

          {user && ['admin', 'moderator'].includes(user.role) && (
            <Link
              href="/admin/dashboard"
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-3 text-sm
                         text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5"
            >
              <Shield size={18} />
              {t('admin')}
            </Link>
          )}
        </nav>

        {/* Footer del panel */}
        <div className="border-t border-[var(--color-border)] p-4 space-y-2">
          {user ? (
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400
                         hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              {t('logout')}
            </button>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm
                           border border-[var(--color-border)] rounded-lg text-[var(--color-text)]
                           hover:bg-white/5 transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm
                           bg-[var(--color-primary)] text-white font-semibold rounded-lg
                           hover:opacity-90 transition-opacity"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

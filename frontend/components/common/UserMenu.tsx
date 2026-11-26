'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  User, BookOpen, History, Settings, LogOut,
  ChevronDown, Shield,
} from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuthStore();
  const t      = useTranslations('nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref   = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();
  const isAdmin  = ['admin', 'moderator'].includes(user.role);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 group"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center
                        justify-center text-white text-xs font-bold overflow-hidden">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--color-card)]
                        border border-[var(--color-border)] rounded-xl shadow-2xl
                        overflow-hidden z-50">
          {/* Header del menú */}
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <p className="font-semibold text-[var(--color-text)] text-sm truncate">{user.username}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              🪙 {user.coins_balance.toLocaleString()} monedas
            </p>
          </div>

          {/* Links */}
          <div className="py-1">
            <MenuItem href="/profile"  icon={<User size={14} />}    label={t('profile')} onClick={() => setOpen(false)} />
            <MenuItem href="/library"  icon={<BookOpen size={14} />} label={t('library')} onClick={() => setOpen(false)} />
            <MenuItem href="/coins"    icon={<span>🪙</span>}        label={t('coins')}   onClick={() => setOpen(false)} />
            {isAdmin && (
              <MenuItem href="/admin/dashboard" icon={<Shield size={14} />} label={t('admin')} onClick={() => setOpen(false)} />
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-[var(--color-border)] py-1">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400
                         hover:bg-red-500/10 transition-colors text-left"
            >
              <LogOut size={14} />
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  href, icon, label, onClick,
}: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href as any}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-text-muted)]
                 hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

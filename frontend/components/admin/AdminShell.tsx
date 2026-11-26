'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Users,
  Coins,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  ArrowLeft,
  Menu,
  X,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Link, usePathname } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/authStore';

const ADMIN_NAV = [
  { label: 'Dashboard',     href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Series',        href: '/admin/series',    icon: BookOpen },
  { label: 'Capítulos',     href: '/admin/chapters',  icon: Layers },
  { label: 'Usuarios',      href: '/admin/users',     icon: Users },
  { label: 'Monedas',       href: '/admin/coins',     icon: Coins },
  { label: 'Comentarios',   href: '/admin/comments',  icon: MessageSquare },
  { label: 'Banners',       href: '/admin/banners',   icon: ImageIcon },
  { label: 'Configuración', href: '/admin/settings',  icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, loadUser } = useAuthStore();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  const isAuthorized = user && ['admin', 'moderator'].includes(user.role);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-black text-[var(--color-text)]">Acceso restringido</h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          {!user
            ? 'Debes iniciar sesión con una cuenta de administrador o moderador para acceder a este panel.'
            : 'Tu cuenta no tiene permisos suficientes para acceder al panel de administración.'}
        </p>
        <div className="flex gap-3 mt-2">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
          >
            Volver al inicio
          </Link>
          {!user && (
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <Link href="/admin/dashboard" className="font-black text-lg text-[var(--color-text)] flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-black">
            M
          </div>
          <span>Admin Panel</span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="space-y-1 text-sm flex-1">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors font-medium ${
                active
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-4 border-t border-[var(--color-border)] space-y-3">
        <div className="px-2">
          <p className="text-xs font-semibold text-[var(--color-text)] truncate">{user.username}</p>
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-primary)] font-bold">
            {user.role}
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver al sitio
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Header móvil */}
      <div className="md:hidden sticky top-0 z-30 h-14 px-4 bg-[var(--color-card)] border-b border-[var(--color-border)] flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          aria-label="Abrir menú admin"
        >
          <Menu size={20} />
        </button>
        <span className="font-bold text-sm">Panel Admin</span>
        <Link href="/" className="text-xs text-[var(--color-primary)]">
          Sitio
        </Link>
      </div>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 max-w-[80vw] bg-[var(--color-card)] border-r border-[var(--color-border)] p-4 z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="w-64 min-h-screen bg-[var(--color-card)] border-r border-[var(--color-border)] p-4 hidden md:flex flex-col sticky top-0 h-screen">
          {sidebarContent}
        </aside>

        {/* Contenido */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

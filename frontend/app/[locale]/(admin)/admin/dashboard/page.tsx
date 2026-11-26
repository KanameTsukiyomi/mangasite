'use client';

import { useEffect, useState } from 'react';
import { Users, BookOpen, Layers, DollarSign, Plus, Upload, Palette, Loader2 } from 'lucide-react';
import { Link } from '@/lib/navigation';
import api from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  totalSeries: number;
  totalChapters: number;
  monthlyRevenue: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentChapters, setRecentChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/dashboard').then((r) => r.data.stats).catch(() => null),
      api.get('/api/admin/chapters').then((r) => (r.data.chapters ?? []).slice(0, 6)).catch(() => []),
    ])
      .then(([s, ch]) => {
        setStats(s);
        setRecentChapters(ch);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  const cards = [
    { label: 'Usuarios totales',    value: stats?.totalUsers ?? 0,              icon: Users,      color: 'text-blue-400' },
    { label: 'Series publicadas',   value: stats?.totalSeries ?? 0,             icon: BookOpen,   color: 'text-[var(--color-primary)]' },
    { label: 'Capítulos subidos',   value: stats?.totalChapters ?? 0,           icon: Layers,     color: 'text-purple-400' },
    { label: 'Ingresos (30 días)',  value: `$${stats?.monthlyRevenue ?? '0.00'}`, icon: DollarSign, color: 'text-green-400' },
  ];

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Resumen general de la plataforma y accesos rápidos.
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-[var(--color-text-muted)]">{c.label}</p>
                <p className="text-2xl font-black text-[var(--color-text)] mt-1">{c.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center ${c.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/series/new"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/20 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center">
            <Plus size={18} />
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--color-text)]">Nueva Serie</p>
            <p className="text-xs text-[var(--color-text-muted)]">Crear manga, manhwa o novela</p>
          </div>
        </Link>

        <Link
          href="/admin/chapters"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-accent)] flex items-center justify-center">
            <Upload size={18} />
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--color-text)]">Subir Capítulo</p>
            <p className="text-xs text-[var(--color-text-muted)]">Imágenes o contenido de novela</p>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-purple-400 flex items-center justify-center">
            <Palette size={18} />
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--color-text)]">Personalizar Colores</p>
            <p className="text-xs text-[var(--color-text-muted)]">Tema, nombre y redes del sitio</p>
          </div>
        </Link>
      </div>

      {/* Últimos capítulos subidos */}
      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-bold text-base text-[var(--color-text)]">Últimos capítulos subidos</h2>
          <Link href="/admin/chapters" className="text-xs text-[var(--color-primary)] hover:underline">
            Ver todos →
          </Link>
        </div>

        {recentChapters.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
            Aún no se han subido capítulos.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {recentChapters.map((ch) => {
              const seriesTitle =
                ch.series?.series_translations?.find((t: any) => t.language === 'es')?.title ??
                ch.series?.series_translations?.[0]?.title ??
                ch.series?.slug ??
                'Serie';
              return (
                <div key={ch.id} className="px-5 py-3 flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">{seriesTitle}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Capítulo {ch.chapter_number} • {ch.pages_count ?? 0} pág.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                      ch.is_free
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                    }`}
                  >
                    {ch.is_free ? 'Gratis' : `🪙 ${ch.coin_cost}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Save, RotateCcw, Loader2, CheckCircle2, Palette, Globe } from 'lucide-react';
import api from '@/lib/api';
import { applyTheme } from '@/lib/theme';

const COLOR_FIELDS = [
  { key: 'color_primary',    label: 'Color primario (botones, acentos)', defaultVal: '#e11d48' },
  { key: 'color_secondary',  label: 'Color secundario (gradientes)',     defaultVal: '#1e1b4b' },
  { key: 'color_bg',         label: 'Fondo principal',                   defaultVal: '#0f0f0f' },
  { key: 'color_card',       label: 'Fondo de tarjetas',                 defaultVal: '#1a1a2e' },
  { key: 'color_text',       label: 'Texto principal',                   defaultVal: '#f1f5f9' },
  { key: 'color_text_muted', label: 'Texto secundario',                  defaultVal: '#94a3b8' },
  { key: 'color_accent',     label: 'Acento (monedas, estrellas)',       defaultVal: '#f59e0b' },
  { key: 'color_border',     label: 'Bordes',                            defaultVal: '#2d2d44' },
];

const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: 'MangaSite',
  site_tagline_es: 'Lee manga, manhwa y novelas gratis',
  site_tagline_en: 'Read manga, manhwa and novels for free',
  site_logo_url: '',
  site_favicon_url: '',
  color_primary: '#e11d48',
  color_secondary: '#1e1b4b',
  color_bg: '#0f0f0f',
  color_card: '#1a1a2e',
  color_text: '#f1f5f9',
  color_text_muted: '#94a3b8',
  color_accent: '#f59e0b',
  color_border: '#2d2d44',
  coins_name_es: 'Monedas',
  coins_name_en: 'Coins',
  coins_icon: '🪙',
  social_twitter: '',
  social_discord: '',
  social_instagram: '',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/admin/settings')
      .then(({ data }) => {
        setSettings((prev) => ({ ...prev, ...(data.settings ?? {}) }));
      })
      .catch(() => setError('Error al cargar la configuración.'))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key: string, value: string) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSavedOk(false);
    // Vista previa en vivo para los colores
    if (key.startsWith('color_')) {
      applyTheme(next);
    }
  };

  const resetColors = () => {
    const next = { ...settings };
    COLOR_FIELDS.forEach((f) => {
      next[f.key] = f.defaultVal;
    });
    setSettings(next);
    applyTheme(next);
    setSavedOk(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSavedOk(false);
    try {
      await api.patch('/api/admin/settings', settings);
      applyTheme(settings);
      setSavedOk(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al guardar configuración (requiere rol admin).');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-4xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">
            Configuración y Colores
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Personaliza la paleta visual del sitio en tiempo real y los datos generales.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar cambios
        </button>
      </div>

      {savedOk && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          <CheckCircle2 size={16} />
          Configuración guardada y aplicada al sitio.
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Colores del tema */}
      <section className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Palette size={18} className="text-[var(--color-primary)]" />
            Paleta de colores (vista previa en vivo)
          </h2>
          <button
            type="button"
            onClick={resetColors}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <RotateCcw size={13} />
            Restaurar predeterminados
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map((field) => {
            const val = settings[field.key] || field.defaultVal;
            return (
              <div
                key={field.key}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]"
              >
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-[var(--color-text)] truncate">
                    {field.label}
                  </label>
                  <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                    {field.key}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="color"
                    value={val.startsWith('#') ? val : field.defaultVal}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="w-24 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-xs font-mono text-[var(--color-text)]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Identidad del sitio */}
      <section className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2">
          <Globe size={18} className="text-[var(--color-primary)]" />
          Identidad y redes sociales
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Nombre del sitio</label>
            <input
              type="text"
              value={settings.site_name ?? ''}
              onChange={(e) => updateField('site_name', e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Icono de moneda</label>
            <input
              type="text"
              value={settings.coins_icon ?? ''}
              onChange={(e) => updateField('coins_icon', e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Eslogan (ES)</label>
            <input
              type="text"
              value={settings.site_tagline_es ?? ''}
              onChange={(e) => updateField('site_tagline_es', e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Tagline (EN)</label>
            <input
              type="text"
              value={settings.site_tagline_en ?? ''}
              onChange={(e) => updateField('site_tagline_en', e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Discord URL</label>
            <input
              type="url"
              value={settings.social_discord ?? ''}
              onChange={(e) => updateField('social_discord', e.target.value)}
              placeholder="https://discord.gg/..."
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Twitter / X URL</label>
            <input
              type="url"
              value={settings.social_twitter ?? ''}
              onChange={(e) => updateField('social_twitter', e.target.value)}
              placeholder="https://x.com/..."
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>
    </form>
  );
}

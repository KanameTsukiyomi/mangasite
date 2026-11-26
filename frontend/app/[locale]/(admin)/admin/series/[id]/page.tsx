'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { Link, useRouter } from '@/lib/navigation';
import api from '@/lib/api';

interface TranslationForm {
  title: string;
  description: string;
  author: string;
  artist: string;
}

const emptyTr = (): TranslationForm => ({
  title: '',
  description: '',
  author: '',
  artist: '',
});

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminSeriesEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'cover' | 'banner' | null>(null);
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  const [slug, setSlug] = useState('');
  const [type, setType] = useState('manhwa');
  const [status, setStatus] = useState('ongoing');
  const [coverUrl, setCoverUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isHot, setIsHot] = useState(false);

  const [trEs, setTrEs] = useState<TranslationForm>(emptyTr);
  const [trEn, setTrEn] = useState<TranslationForm>(emptyTr);

  const [genres, setGenres] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);

  useEffect(() => {
    api
      .get('/api/series/genres?lang=es')
      .then((r) => setGenres(r.data.genres ?? []))
      .catch(() => {});

    if (!isNew) {
      api
        .get(`/api/admin/series/${params.id}`)
        .then(({ data }) => {
          const s = data.series;
          setSlug(s.slug ?? '');
          setType(s.type ?? 'manhwa');
          setStatus(s.status ?? 'ongoing');
          setCoverUrl(s.cover_url ?? '');
          setBannerUrl(s.banner_url ?? '');
          setIsFeatured(Boolean(s.is_featured));
          setIsHot(Boolean(s.is_hot));

          const es = s.series_translations?.find((t: any) => t.language === 'es');
          const en = s.series_translations?.find((t: any) => t.language === 'en');
          if (es) {
            setTrEs({
              title: es.title ?? '',
              description: es.description ?? '',
              author: es.author ?? '',
              artist: es.artist ?? '',
            });
          }
          if (en) {
            setTrEn({
              title: en.title ?? '',
              description: en.description ?? '',
              author: en.author ?? '',
              artist: en.artist ?? '',
            });
          }
          setSelectedGenreIds((s.series_genres ?? []).map((g: any) => g.genre_id));
        })
        .catch(() => setError('No se pudo cargar la serie.'))
        .finally(() => setLoading(false));
    }
  }, [isNew, params.id]);

  const handleUploadImage = async (file: File, target: 'cover' | 'banner') => {
    setUploading(target);
    setError('');
    try {
      const fd = new FormData();
      fd.append('folder', target === 'banner' ? 'banners' : 'covers');
      fd.append('file', file);
      const { data } = await api.post('/api/admin/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (target === 'cover') setCoverUrl(data.url);
      else setBannerUrl(data.url);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al subir la imagen.');
    } finally {
      setUploading(null);
    }
  };

  const toggleGenre = (gid: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(gid) ? prev.filter((id) => id !== gid) : [...prev, gid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedOk(false);

    if (!trEs.title.trim() && !trEn.title.trim()) {
      setError('Debes indicar al menos el título en español o inglés.');
      return;
    }

    const finalSlug = slug.trim() || slugify(trEs.title || trEn.title);
    const translations = [
      {
        language: 'es',
        title: trEs.title.trim() || trEn.title.trim(),
        description: trEs.description,
        author: trEs.author,
        artist: trEs.artist,
      },
      {
        language: 'en',
        title: trEn.title.trim() || trEs.title.trim(),
        description: trEn.description || trEs.description,
        author: trEn.author || trEs.author,
        artist: trEn.artist || trEs.artist,
      },
    ];

    const payload = {
      slug: finalSlug,
      type,
      status,
      cover_url: coverUrl || null,
      banner_url: bannerUrl || null,
      is_featured: isFeatured,
      is_hot: isHot,
      translations,
      genre_ids: selectedGenreIds,
    };

    setSaving(true);
    try {
      if (isNew) {
        const { data } = await api.post('/api/admin/series', payload);
        router.push(`/admin/series/${data.series.id}` as any);
      } else {
        await api.patch(`/api/admin/series/${params.id}`, payload);
        setSavedOk(true);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al guardar la serie.');
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
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/series"
            className="p-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-black text-[var(--color-text)]">
            {isNew ? 'Nueva Serie' : 'Editar Serie'}
          </h1>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isNew ? 'Crear serie' : 'Guardar cambios'}
        </button>
      </div>

      {savedOk && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          <CheckCircle2 size={16} />
          Serie actualizada correctamente.
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Datos básicos */}
      <section className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 space-y-4">
        <h2 className="font-bold text-base">Información general</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Slug URL</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="solo-leveling"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            >
              <option value="manhwa">Manhwa</option>
              <option value="manga">Manga</option>
              <option value="manhua">Manhua</option>
              <option value="webtoon">Webtoon</option>
              <option value="novel">Novela</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            >
              <option value="ongoing">En progreso</option>
              <option value="completed">Completado</option>
              <option value="hiatus">En pausa</option>
              <option value="dropped">Abandonado</option>
            </select>
          </div>
        </div>

        {/* Portada y Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Portada (URL o subir)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs cursor-pointer hover:border-[var(--color-primary)]">
                {uploading === 'cover' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Subir
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUploadImage(f, 'cover');
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Banner horizontal (opcional)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs cursor-pointer hover:border-[var(--color-primary)]">
                {uploading === 'banner' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Subir
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUploadImage(f, 'banner');
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            Mostrar en Slider Destacados
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isHot}
              onChange={(e) => setIsHot(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            Marcar como Tendencia (Hot)
          </label>
        </div>
      </section>

      {/* Traducciones ES + EN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-5 space-y-3">
          <h2 className="font-bold text-sm uppercase tracking-wider text-[var(--color-primary)]">
            Español (ES)
          </h2>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Título *</label>
            <input
              type="text"
              value={trEs.title}
              onChange={(e) => {
                const title = e.target.value;
                setTrEs({ ...trEs, title });
                if (isNew && !slug) setSlug(slugify(title));
              }}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Autor</label>
              <input
                type="text"
                value={trEs.author}
                onChange={(e) => setTrEs({ ...trEs, author: e.target.value })}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Arte</label>
              <input
                type="text"
                value={trEs.artist}
                onChange={(e) => setTrEs({ ...trEs, artist: e.target.value })}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Sinopsis</label>
            <textarea
              rows={4}
              value={trEs.description}
              onChange={(e) => setTrEs({ ...trEs, description: e.target.value })}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-5 space-y-3">
          <h2 className="font-bold text-sm uppercase tracking-wider text-[var(--color-accent)]">
            English (EN)
          </h2>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Title</label>
            <input
              type="text"
              value={trEn.title}
              onChange={(e) => setTrEn({ ...trEn, title: e.target.value })}
              placeholder="Igual que ES si queda vacío"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Author</label>
              <input
                type="text"
                value={trEn.author}
                onChange={(e) => setTrEn({ ...trEn, author: e.target.value })}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Artist</label>
              <input
                type="text"
                value={trEn.artist}
                onChange={(e) => setTrEn({ ...trEn, artist: e.target.value })}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Synopsis</label>
            <textarea
              rows={4}
              value={trEn.description}
              onChange={(e) => setTrEn({ ...trEn, description: e.target.value })}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </section>
      </div>

      {/* Géneros */}
      <section className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 space-y-3">
        <h2 className="font-bold text-base">Géneros</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => {
            const selected = selectedGenreIds.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  selected
                    ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </section>
    </form>
  );
}

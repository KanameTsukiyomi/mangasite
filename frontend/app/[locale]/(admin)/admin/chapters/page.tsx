'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload, Trash2, Loader2, CheckCircle2, FileText, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';

function AdminChaptersContent() {
  const searchParams = useSearchParams();
  const initialSeriesId = searchParams.get('series_id') ?? '';

  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [filterSeriesId, setFilterSeriesId] = useState(initialSeriesId);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario de nuevo capítulo
  const [seriesId, setSeriesId] = useState(initialSeriesId);
  const [chapterNumber, setChapterNumber] = useState('1');
  const [titleEs, setTitleEs] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [coinCost, setCoinCost] = useState('10');
  const [freeAfterDays, setFreeAfterDays] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [novelEs, setNovelEs] = useState('');
  const [novelEn, setNovelEn] = useState('');

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchChapters = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const qs = sid ? `?series_id=${sid}` : '';
      const { data } = await api.get(`/api/admin/chapters${qs}`);
      setChapters(data.chapters ?? []);
    } catch {
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api
      .get('/api/admin/series?page=1')
      .then(({ data }) => {
        const list = data.series ?? [];
        setSeriesList(list);
        if (!seriesId && list.length > 0) setSeriesId(list[0].id);
      })
      .catch(() => {});
  }, [seriesId]);

  useEffect(() => {
    void fetchChapters(filterSeriesId);
  }, [filterSeriesId, fetchChapters]);

  const selectedSeries = seriesList.find((s) => s.id === seriesId);
  const isNovel = selectedSeries?.type === 'novel';

  const handleFilesChange = (fileList: FileList | null) => {
    if (!fileList) return;
    // Orden natural por nombre (001.jpg, 002.jpg, 10.jpg...)
    const sorted = Array.from(fileList).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    setFiles(sorted);
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!seriesId) {
      setError('Selecciona una serie.');
      return;
    }

    setUploading(true);
    try {
      const translations: Array<{ language: string; title: string }> = [];
      if (titleEs.trim()) translations.push({ language: 'es', title: titleEs.trim() });
      if (titleEn.trim()) translations.push({ language: 'en', title: titleEn.trim() });

      const { data: created } = await api.post('/api/admin/chapters', {
        series_id: seriesId,
        chapter_number: Number(chapterNumber),
        is_free: isFree,
        coin_cost: isFree ? 0 : Number(coinCost) || 0,
        free_after_days: freeAfterDays ? Number(freeAfterDays) : null,
        translations,
      });

      const chapterId = created.chapter.id;

      if (isNovel) {
        if (novelEs.trim()) {
          await api.post(`/api/admin/chapters/${chapterId}/novel-content`, {
            language: 'es',
            content: novelEs,
          });
        }
        if (novelEn.trim()) {
          await api.post(`/api/admin/chapters/${chapterId}/novel-content`, {
            language: 'en',
            content: novelEn,
          });
        }
      } else if (files.length > 0) {
        // Subir páginas en lotes de 40 para no exceder límites de request
        const batchSize = 40;
        for (let i = 0; i < files.length; i += batchSize) {
          const chunk = files.slice(i, i + batchSize);
          const fd = new FormData();
          fd.append('start_page', String(i + 1));
          chunk.forEach((f) => fd.append('pages', f));
          await api.post(`/api/admin/chapters/${chapterId}/pages`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      setMessage(`Capítulo ${chapterNumber} publicado correctamente.`);
      setChapterNumber(String(Number(chapterNumber) + 1));
      setTitleEs('');
      setTitleEn('');
      setFiles([]);
      setNovelEs('');
      setNovelEn('');
      void fetchChapters(filterSeriesId);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al publicar el capítulo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteChapter = async (id: string, num: number) => {
    if (!confirm(`¿Eliminar el capítulo ${num}?`)) return;
    try {
      await api.delete(`/api/admin/chapters/${id}`);
      void fetchChapters(filterSeriesId);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al eliminar (requiere rol admin).');
    }
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">Capítulos</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Sube nuevos capítulos (imágenes de cómic o texto de novela) y gestiona precios en monedas.
        </p>
      </div>

      {/* Formulario de subida */}
      <form
        onSubmit={handleCreateChapter}
        className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 space-y-5"
      >
        <h2 className="font-bold text-base flex items-center gap-2">
          <Upload size={18} className="text-[var(--color-primary)]" />
          Subir nuevo capítulo
        </h2>

        {message && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            <CheckCircle2 size={16} />
            {message}
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Serie *</label>
            <select
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            >
              {seriesList.map((s) => {
                const t =
                  s.series_translations?.find((x: any) => x.language === 'es')?.title ??
                  s.series_translations?.[0]?.title ??
                  s.slug;
                return (
                  <option key={s.id} value={s.id}>
                    {t} ({s.type})
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Número de capítulo *</label>
            <input
              type="number"
              step="0.1"
              required
              value={chapterNumber}
              onChange={(e) => setChapterNumber(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Título ES (opcional)</label>
            <input
              type="text"
              value={titleEs}
              onChange={(e) => setTitleEs(e.target.value)}
              placeholder="El comienzo"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Título EN (opcional)</label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="The beginning"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Acceso / Monedas */}
        <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            Capítulo gratuito
          </label>

          {!isFree && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--color-text-muted)]">Costo (monedas):</label>
                <input
                  type="number"
                  min="1"
                  value={coinCost}
                  onChange={(e) => setCoinCost(e.target.value)}
                  className="w-24 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--color-text-muted)]">Gratis tras (días, opc.):</label>
                <input
                  type="number"
                  min="1"
                  placeholder="—"
                  value={freeAfterDays}
                  onChange={(e) => setFreeAfterDays(e.target.value)}
                  className="w-20 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Contenido: páginas o novela */}
        {isNovel ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
                <FileText size={13} /> Contenido HTML (ES)
              </label>
              <textarea
                rows={8}
                value={novelEs}
                onChange={(e) => setNovelEs(e.target.value)}
                placeholder="<p>Primer párrafo de la novela...</p>"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3 text-sm font-mono"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
                <FileText size={13} /> HTML Content (EN)
              </label>
              <textarea
                rows={8}
                value={novelEn}
                onChange={(e) => setNovelEn(e.target.value)}
                placeholder="<p>First paragraph...</p>"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3 text-sm font-mono"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-2">
              <ImageIcon size={13} /> Páginas del capítulo (se ordenan automáticamente por nombre de archivo)
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-xl p-6 cursor-pointer transition-colors bg-[var(--color-bg)]/50">
              <Upload size={24} className="text-[var(--color-text-muted)] mb-2" />
              <span className="text-sm font-medium text-[var(--color-text)]">
                {files.length > 0
                  ? `${files.length} páginas seleccionadas (${files[0].name} ... ${files[files.length - 1].name})`
                  : 'Haz clic para seleccionar imágenes (JPG, PNG, WEBP)'}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesChange(e.target.files)}
              />
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Subiendo capítulo...' : 'Publicar capítulo'}
        </button>
      </form>

      {/* Listado de capítulos */}
      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold text-base">Capítulos recientes</h2>
          <select
            value={filterSeriesId}
            onChange={(e) => setFilterSeriesId(e.target.value)}
            className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-1.5 text-xs"
          >
            <option value="">Todas las series</option>
            {seriesList.map((s) => {
              const t =
                s.series_translations?.find((x: any) => x.language === 'es')?.title ??
                s.series_translations?.[0]?.title ??
                s.slug;
              return (
                <option key={s.id} value={s.id}>
                  {t}
                </option>
              );
            })}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : chapters.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
            No hay capítulos que mostrar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--color-bg)]/60 text-xs uppercase text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3">Serie</th>
                  <th className="px-4 py-3">Capítulo</th>
                  <th className="px-4 py-3">Páginas</th>
                  <th className="px-4 py-3">Acceso</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {chapters.map((ch) => {
                  const sTitle =
                    ch.series?.series_translations?.find((t: any) => t.language === 'es')?.title ??
                    ch.series?.series_translations?.[0]?.title ??
                    ch.series?.slug ??
                    '—';
                  return (
                    <tr key={ch.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-medium">{sTitle}</td>
                      <td className="px-4 py-3 text-[var(--color-primary)] font-semibold">
                        Cap. {ch.chapter_number}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{ch.pages_count ?? 0}</td>
                      <td className="px-4 py-3">
                        {ch.is_free ? (
                          <span className="text-xs text-green-400">Gratis</span>
                        ) : (
                          <span className="text-xs text-[var(--color-accent)]">🪙 {ch.coin_cost}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteChapter(ch.id, ch.chapter_number)}
                          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminChaptersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        </div>
      }
    >
      <AdminChaptersContent />
    </Suspense>
  );
}

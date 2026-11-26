'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReaderNav, { ReaderChapter } from './ReaderNav';

interface Page {
  page_number: number;
  image_url: string;
}

interface ComicReaderProps {
  pages: Page[];
  currentChapter: ReaderChapter;
  chapters: ReaderChapter[];
  seriesSlug: string;
  seriesTitle: string;
  locale: string;
  onProgress?: (pageNumber: number) => void;
}

type ReadMode = 'scroll' | 'page';

export default function ComicReader({
  pages,
  currentChapter,
  chapters,
  seriesSlug,
  seriesTitle,
  locale,
  onProgress,
}: ComicReaderProps) {
  const [mode, setMode] = useState<ReadMode>('scroll');
  const [currentPage, setCurrentPage] = useState(1);
  const pageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const sortedPages = [...pages].sort((a, b) => a.page_number - b.page_number);

  useEffect(() => {
    const saved = localStorage.getItem('reader_mode') as ReadMode | null;
    if (saved === 'scroll' || saved === 'page') setMode(saved);
  }, []);

  const handleModeChange = (newMode: ReadMode) => {
    setMode(newMode);
    localStorage.setItem('reader_mode', newMode);
    setCurrentPage(1);
  };

  // Modo scroll: IntersectionObserver detecta la página actual
  useEffect(() => {
    if (mode !== 'scroll') return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = pageRefs.current.indexOf(entry.target as HTMLImageElement);
            if (idx !== -1) {
              const pg = idx + 1;
              setCurrentPage(pg);
              onProgressRef.current?.(pg);
            }
          }
        });
      },
      { threshold: 0.45 }
    );

    pageRefs.current.forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [mode, sortedPages.length]);

  // Modo página: navegación por teclado
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (mode !== 'page') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentPage((p) => {
          const next = Math.min(p + 1, sortedPages.length);
          onProgressRef.current?.(next);
          return next;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentPage((p) => Math.max(p - 1, 1));
      }
    },
    [mode, sortedPages.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const progress = sortedPages.length > 0 ? (currentPage / sortedPages.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto h-full">
      <ReaderNav
        seriesSlug={seriesSlug}
        seriesTitle={seriesTitle}
        currentChapter={currentChapter}
        chapters={chapters}
        locale={locale}
        mode={mode}
        onModeChange={handleModeChange}
      />

      {/* Barra de progreso */}
      <div className="fixed top-14 left-0 right-0 z-40 h-1 bg-white/10">
        <div
          className="h-full bg-[var(--color-primary)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Indicador de página */}
      {sortedPages.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-black/75 backdrop-blur-sm text-white/85 text-xs font-medium px-3 py-1 rounded-full border border-white/10">
          {currentPage} / {sortedPages.length}
        </div>
      )}

      {sortedPages.length === 0 ? (
        <div className="pt-28 text-center text-white/60 text-sm">
          Este capítulo aún no tiene páginas cargadas.
        </div>
      ) : mode === 'scroll' ? (
        <div className="pt-14 flex flex-col items-center">
          {sortedPages.map((page, i) => (
            <img
              key={page.page_number}
              ref={(el) => {
                pageRefs.current[i] = el;
              }}
              src={page.image_url}
              alt={`Página ${page.page_number}`}
              className="w-full max-w-[800px] block"
              loading={i < 3 ? 'eager' : 'lazy'}
            />
          ))}
          <div className="h-24" />
        </div>
      ) : (
        <div className="pt-14 h-screen flex items-center justify-center relative select-none">
          {/* Zona izquierda */}
          <div
            className="absolute left-0 top-14 bottom-0 w-1/3 z-30 cursor-pointer flex items-center justify-start pl-4 group"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          >
            <div className="bg-black/40 hover:bg-black/70 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Zona derecha */}
          <div
            className="absolute right-0 top-14 bottom-0 w-1/3 z-30 cursor-pointer flex items-center justify-end pr-4 group"
            onClick={() => {
              setCurrentPage((p) => {
                const next = Math.min(p + 1, sortedPages.length);
                onProgressRef.current?.(next);
                return next;
              });
            }}
          >
            <div className="bg-black/40 hover:bg-black/70 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-8 h-8 text-white" />
            </div>
          </div>

          {sortedPages[currentPage - 1] && (
            <img
              key={sortedPages[currentPage - 1].page_number}
              src={sortedPages[currentPage - 1].image_url}
              alt={`Página ${currentPage}`}
              className="max-h-[calc(100vh-56px)] max-w-full object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, List, Columns2, Lock } from 'lucide-react';
import { Link, useRouter } from '@/lib/navigation';

export interface ReaderChapter {
  id: string;
  chapter_number: number;
  is_accessible?: boolean;
  is_free?: boolean;
  coin_cost?: number;
  chapter_translations?: Array<{ title: string; language: string }>;
}

interface ReaderNavProps {
  seriesSlug: string;
  seriesTitle: string;
  currentChapter: ReaderChapter;
  chapters: ReaderChapter[];
  locale: string;
  mode?: 'scroll' | 'page';
  onModeChange?: (mode: 'scroll' | 'page') => void;
  isNovel?: boolean;
}

function getChapterTitle(ch: ReaderChapter, locale: string): string | undefined {
  return (
    ch.chapter_translations?.find((t) => t.language === locale)?.title ??
    ch.chapter_translations?.[0]?.title
  );
}

export default function ReaderNav({
  seriesSlug,
  seriesTitle,
  currentChapter,
  chapters,
  locale,
  mode = 'scroll',
  onModeChange,
  isNovel = false,
}: ReaderNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const sortedAsc = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);
  const idx = sortedAsc.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = idx > 0 ? sortedAsc[idx - 1] : null;
  const nextChapter = idx >= 0 && idx < sortedAsc.length - 1 ? sortedAsc[idx + 1] : null;

  const goTo = (ch: ReaderChapter) => {
    setDropdownOpen(false);
    router.push(`/series/${seriesSlug}/chapter/${ch.id}` as any);
  };

  const currentTitle = getChapterTitle(currentChapter, locale);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-black/90 backdrop-blur-sm border-b border-white/10 flex items-center px-3 gap-2">
      {/* Volver a la serie */}
      <Link
        href={`/series/${seriesSlug}` as any}
        className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors shrink-0 mr-1"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline text-sm truncate max-w-[140px]">{seriesTitle}</span>
      </Link>

      {/* Capítulo anterior */}
      <button
        onClick={() => prevChapter && goTo(prevChapter)}
        disabled={!prevChapter}
        className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title={prevChapter ? `Cap. ${prevChapter.chapter_number}` : 'Sin capítulo anterior'}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Selector de capítulos */}
      <div className="relative flex-1 max-w-md mx-auto">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          <List className="w-4 h-4 shrink-0" />
          <span className="truncate">
            Cap. {currentChapter.chapter_number}
            {currentTitle ? ` — ${currentTitle}` : ''}
          </span>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 max-h-80 overflow-y-auto bg-[#1a1a2e] border border-white/20 rounded-lg shadow-2xl z-50">
              {[...chapters]
                .sort((a, b) => b.chapter_number - a.chapter_number)
                .map((ch) => {
                  const title = getChapterTitle(ch, locale);
                  const locked = ch.is_accessible === false;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => goTo(ch)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-white/10 transition-colors ${
                        ch.id === currentChapter.id ? 'bg-white/15 text-[var(--color-primary)] font-semibold' : 'text-white/80'
                      }`}
                    >
                      <span className="truncate">
                        Cap. {ch.chapter_number}
                        {title ? ` — ${title}` : ''}
                      </span>
                      {locked && <Lock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                    </button>
                  );
                })}
            </div>
          </>
        )}
      </div>

      {/* Siguiente capítulo */}
      <button
        onClick={() => nextChapter && goTo(nextChapter)}
        disabled={!nextChapter}
        className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title={nextChapter ? `Cap. ${nextChapter.chapter_number}` : 'Último capítulo'}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Cambio de modo (solo cómics) */}
      {!isNovel && onModeChange && (
        <button
          onClick={() => onModeChange(mode === 'scroll' ? 'page' : 'scroll')}
          className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0 flex items-center gap-1 text-xs"
          title={mode === 'scroll' ? 'Cambiar a modo página' : 'Cambiar a modo scroll'}
        >
          <Columns2 className="w-4 h-4" />
          <span className="hidden md:inline">{mode === 'scroll' ? 'Scroll' : 'Página'}</span>
        </button>
      )}
    </div>
  );
}

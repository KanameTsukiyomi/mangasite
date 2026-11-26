'use client';

import { useState, useEffect } from 'react';
import { Type, X } from 'lucide-react';
import ReaderNav, { ReaderChapter } from './ReaderNav';

interface NovelReaderProps {
  content: string;
  currentChapter: ReaderChapter;
  chapters: ReaderChapter[];
  seriesSlug: string;
  seriesTitle: string;
  locale: string;
}

type NovelTheme = 'dark' | 'sepia' | 'light';

const themes: Record<NovelTheme, { bg: string; text: string; label: string }> = {
  dark:  { bg: '#0f0f0f', text: '#e2e8f0', label: 'Oscuro' },
  sepia: { bg: '#f5e6d0', text: '#5c3d2e', label: 'Sepia'  },
  light: { bg: '#ffffff', text: '#1a1a1a', label: 'Claro'  },
};

const FONT_MIN = 13;
const FONT_MAX = 24;
const LH_MIN = 1.4;
const LH_MAX = 2.2;
const LH_STEP = 0.1;

export default function NovelReader({
  content,
  currentChapter,
  chapters,
  seriesSlug,
  seriesTitle,
  locale,
}: NovelReaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [theme, setTheme] = useState<NovelTheme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('novel_settings');
    if (saved) {
      try {
        const { fontSize: fs, lineHeight: lh, theme: th } = JSON.parse(saved);
        if (fs) setFontSize(fs);
        if (lh) setLineHeight(lh);
        if (th) setTheme(th);
      } catch {}
    }
  }, []);

  const save = (updates: Partial<{ fontSize: number; lineHeight: number; theme: NovelTheme }>) => {
    const current = { fontSize, lineHeight, theme, ...updates };
    localStorage.setItem('novel_settings', JSON.stringify(current));
    if (updates.fontSize !== undefined) setFontSize(updates.fontSize);
    if (updates.lineHeight !== undefined) setLineHeight(updates.lineHeight);
    if (updates.theme !== undefined) setTheme(updates.theme);
  };

  const { bg, text } = themes[theme];

  return (
    <div
      className="min-h-screen h-full overflow-y-auto transition-colors duration-300"
      style={{ backgroundColor: bg, color: text }}
    >
      <ReaderNav
        seriesSlug={seriesSlug}
        seriesTitle={seriesTitle}
        currentChapter={currentChapter}
        chapters={chapters}
        locale={locale}
        isNovel
      />

      {/* Contenido de la novela */}
      <div
        className="novel-reader pt-20 pb-24 px-4 mx-auto max-w-[700px]"
        style={{ fontSize: `${fontSize}px`, lineHeight }}
        dangerouslySetInnerHTML={{ __html: content || '<p>Sin contenido disponible aún.</p>' }}
      />

      {/* Botón flotante Aa */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--color-primary)] text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        title="Ajustes de lectura"
      >
        <Type className="w-5 h-5" />
      </button>

      {/* Panel de ajustes */}
      {settingsOpen && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setSettingsOpen(false)} />
          <div
            className="fixed bottom-20 right-6 z-50 w-72 rounded-2xl shadow-2xl border border-white/10 p-5 space-y-5"
            style={{
              backgroundColor: theme === 'light' ? '#f0f0f0' : '#1e1e2e',
              color: theme === 'light' ? '#1a1a1a' : '#e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Ajustes de lectura</span>
              <button onClick={() => setSettingsOpen(false)} className="p-1 rounded hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tamaño de fuente */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Tamaño de fuente</span>
                <span className="font-mono">{fontSize}px</span>
              </div>
              <input
                type="range"
                min={FONT_MIN}
                max={FONT_MAX}
                value={fontSize}
                onChange={(e) => save({ fontSize: Number(e.target.value) })}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-xs opacity-50">
                <span>{FONT_MIN}px</span>
                <span>{FONT_MAX}px</span>
              </div>
            </div>

            {/* Interlineado */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Interlineado</span>
                <span className="font-mono">{lineHeight.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={LH_MIN}
                max={LH_MAX}
                step={LH_STEP}
                value={lineHeight}
                onChange={(e) => save({ lineHeight: Number(e.target.value) })}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-xs opacity-50">
                <span>{LH_MIN}</span>
                <span>{LH_MAX}</span>
              </div>
            </div>

            {/* Tema */}
            <div className="space-y-2">
              <span className="text-sm">Tema</span>
              <div className="flex gap-2">
                {(Object.keys(themes) as NovelTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => save({ theme: t })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 transition-colors ${
                      theme === t ? 'border-[var(--color-primary)]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: themes[t].bg, color: themes[t].text }}
                  >
                    {themes[t].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

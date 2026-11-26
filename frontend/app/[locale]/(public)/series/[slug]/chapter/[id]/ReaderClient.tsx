'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from '@/lib/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import ComicReader from '@/components/reader/ComicReader';
import NovelReader from '@/components/reader/NovelReader';
import { ReaderChapter } from '@/components/reader/ReaderNav';
import { UnlockModal } from '@/components/reader/UnlockModal';
import { Loader2 } from 'lucide-react';

interface ReaderClientProps {
  slug: string;
  chapterId: string;
  chapters: ReaderChapter[];
  seriesTitle: string;
  locale: string;
}

type ContentState =
  | { status: 'loading' }
  | { status: 'comic'; pages: { page_number: number; image_url: string }[] }
  | { status: 'novel'; content: string }
  | { status: 'locked_guest' }
  | { status: 'locked_user'; coinCost: number }
  | { status: 'error'; message: string };

export default function ReaderClient({
  slug,
  chapterId,
  chapters,
  seriesTitle,
  locale,
}: ReaderClientProps) {
  const { loadUser, updateCoins } = useAuthStore();
  const router = useRouter();
  const [state, setState] = useState<ContentState>({ status: 'loading' });
  const lastSavedPage = useRef<number>(0);

  const currentChapter: ReaderChapter = chapters.find((c) => c.id === chapterId) ?? {
    id: chapterId,
    chapter_number: 0,
    is_accessible: true,
    coin_cost: 0,
  };

  const fetchContent = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const { data } = await api.get(`/api/chapters/${chapterId}?lang=${locale}`);
      if (data.type === 'novel') {
        setState({ status: 'novel', content: data.content ?? '' });
      } else {
        setState({ status: 'comic', pages: data.pages ?? [] });
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const currentUser = useAuthStore.getState().user;
      if (status === 401 || (status === 403 && !currentUser)) {
        setState({ status: 'locked_guest' });
      } else if (status === 403) {
        setState({
          status: 'locked_user',
          coinCost: err.response?.data?.coin_cost ?? currentChapter.coin_cost ?? 0,
        });
      } else {
        setState({
          status: 'error',
          message: err?.response?.data?.error ?? 'Error al cargar el capítulo.',
        });
      }
    }
  }, [chapterId, locale, currentChapter.coin_cost]);

  useEffect(() => {
    loadUser().then(() => fetchContent());
  }, [loadUser, fetchContent]);

  const saveProgress = useCallback(
    async (pageNumber: number) => {
      if (!useAuthStore.getState().user) return;
      if (pageNumber === lastSavedPage.current) return;
      lastSavedPage.current = pageNumber;
      try {
        await api.post(`/api/chapters/${chapterId}/progress`, { page_number: pageNumber });
      } catch {
        // Silenciar errores de guardado de progreso
      }
    },
    [chapterId]
  );

  const handleUnlockSuccess = (_unlockedId: string, newBalance: number) => {
    updateCoins(newBalance);
    void fetchContent();
  };

  if (state.status === 'loading') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (state.status === 'locked_guest') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 text-white px-4 text-center">
        <div className="text-5xl">🔒</div>
        <h2 className="text-xl font-bold">Capítulo bloqueado</h2>
        <p className="text-white/60 max-w-xs text-sm">
          Inicia sesión para leer este capítulo o desbloquearlo con monedas.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/series/${slug}` as any)}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            Volver
          </button>
          <button
            onClick={() => router.push('/login' as any)}
            className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  if (state.status === 'locked_user') {
    const balance = useAuthStore.getState().user?.coins_balance ?? 0;
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center px-4">
        <UnlockModal
          chapter={{
            id: chapterId,
            chapter_number: currentChapter.chapter_number,
            coin_cost: state.coinCost,
          }}
          userBalance={balance}
          onSuccess={handleUnlockSuccess}
          onClose={() => router.push(`/series/${slug}` as any)}
        />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 text-white px-4 text-center">
        <div className="text-5xl">⚠️</div>
        <p className="text-white/70 max-w-xs text-sm">{state.message}</p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/series/${slug}` as any)}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            Volver a la serie
          </button>
          <button
            onClick={() => fetchContent()}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (state.status === 'novel') {
    return (
      <NovelReader
        content={state.content}
        currentChapter={currentChapter}
        chapters={chapters}
        seriesSlug={slug}
        seriesTitle={seriesTitle}
        locale={locale}
      />
    );
  }

  return (
    <ComicReader
      pages={state.pages}
      currentChapter={currentChapter}
      chapters={chapters}
      seriesSlug={slug}
      seriesTitle={seriesTitle}
      locale={locale}
      onProgress={saveProgress}
    />
  );
}

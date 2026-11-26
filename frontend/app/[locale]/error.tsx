'use client';

import { useEffect } from 'react';
import { Link } from '@/lib/navigation';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="text-5xl">⚠️</div>
      <h1 className="text-2xl font-black text-[var(--color-text)]">Algo salió mal</h1>
      <p className="text-sm text-[var(--color-text-muted)] max-w-md">
        Ha ocurrido un error inesperado al cargar esta página.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
        >
          Inicio
        </Link>
      </div>
    </div>
  );
}

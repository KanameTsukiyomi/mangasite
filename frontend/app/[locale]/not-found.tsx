import { Link } from '@/lib/navigation';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="text-6xl">📚</div>
      <h1 className="text-3xl font-black text-[var(--color-text)]">404 — Página no encontrada</h1>
      <p className="text-sm text-[var(--color-text-muted)] max-w-md">
        La serie, capítulo o página que buscas no existe o fue eliminada.
      </p>
      <Link
        href="/"
        className="mt-2 px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

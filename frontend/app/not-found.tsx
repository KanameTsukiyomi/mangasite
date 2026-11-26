import Link from 'next/link';

export default function RootNotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f5f9] flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="text-6xl">📚</div>
      <h1 className="text-3xl font-black">404 — Página no encontrada</h1>
      <p className="text-sm text-[#94a3b8] max-w-md">
        No pudimos encontrar la ruta solicitada.
      </p>
      <Link
        href="/"
        className="mt-2 px-6 py-2.5 rounded-xl bg-[#e11d48] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

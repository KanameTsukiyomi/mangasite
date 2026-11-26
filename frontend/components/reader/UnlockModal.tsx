'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Link } from '@/lib/navigation';
import api from '@/lib/api';

interface UnlockModalProps {
  chapter: {
    id: string;
    chapter_number: number;
    coin_cost: number;
  };
  userBalance: number;
  onSuccess:   (chapterId: string, newBalance: number) => void;
  onClose:     () => void;
}

export function UnlockModal({ chapter, userBalance, onSuccess, onClose }: UnlockModalProps) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const canAfford = userBalance >= chapter.coin_cost;

  const handleUnlock = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/api/chapters/${chapter.id}/unlock`);
      onSuccess(chapter.id, data.new_balance);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al desbloquear. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-[var(--color-card)] border border-[var(--color-border)]
                      rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in-95
                      duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--color-text-muted)]
                     hover:text-[var(--color-text)] transition-colors"
        >
          <X size={16} />
        </button>

        {/* Cabecera */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">🔓</div>
          <h3 className="font-bold text-lg text-[var(--color-text)]">
            Capítulo {chapter.chapter_number}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Contenido premium
          </p>
        </div>

        {/* Costo */}
        <div className="bg-[var(--color-bg)] rounded-xl p-3 mb-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Costo del capítulo</p>
          <p className="text-xl font-bold text-[var(--color-accent)]">
            🪙 {chapter.coin_cost} monedas
          </p>
        </div>

        {/* Saldo del usuario */}
        <div className="flex justify-between items-center text-sm mb-5 px-1">
          <span className="text-[var(--color-text-muted)]">Tu saldo actual:</span>
          <span className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
            🪙 {userBalance.toLocaleString()}
          </span>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 text-center mb-4 bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Acciones */}
        {canAfford ? (
          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white font-semibold
                       py-3 rounded-xl hover:opacity-90 transition-opacity
                       disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading
              ? 'Desbloqueando...'
              : `Desbloquear — 🪙 ${chapter.coin_cost}`}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-center text-red-400 mb-1">
              Te faltan 🪙 {chapter.coin_cost - userBalance} monedas
            </p>
            <Link
              href="/coins"
              className="block text-center w-full bg-[var(--color-accent)] text-black
                         font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              🪙 Recargar monedas
            </Link>
            <button
              onClick={onClose}
              className="block w-full text-center text-sm text-[var(--color-text-muted)]
                         py-2 hover:text-[var(--color-text)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

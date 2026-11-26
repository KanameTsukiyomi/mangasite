'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import api from '@/lib/api';

interface RatingStarsProps {
  seriesId:      string;
  avgRating:     number;
  ratingCount:   number;
  userRating?:   number | null;
}

export function RatingStars({ seriesId, avgRating, ratingCount, userRating: initial }: RatingStarsProps) {
  const { user } = useAuthStore();
  const [userRating, setUserRating] = useState<number | null>(initial ?? null);
  const [hovering,   setHovering]   = useState(0);
  const [loading,    setLoading]    = useState(false);

  const display = hovering || userRating || Math.round(avgRating);

  const handleRate = async (rating: number) => {
    if (!user || loading) return;
    setLoading(true);
    try {
      await api.post('/api/users/me/ratings', { series_id: seriesId, rating });
      setUserRating(rating);
    } catch { /* noop */ }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Estrellas interactivas (si está autenticado) */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            disabled={!user || loading}
            onClick={() => handleRate(i)}
            onMouseEnter={() => user && setHovering(i)}
            onMouseLeave={() => setHovering(0)}
            className="p-0.5 disabled:cursor-default transition-transform hover:scale-110"
            title={user ? `Valorar con ${i} estrella${i > 1 ? 's' : ''}` : 'Inicia sesión para valorar'}
          >
            <Star
              size={18}
              className={`transition-colors ${
                i <= display
                  ? 'text-[var(--color-accent)] fill-current'
                  : 'text-[var(--color-border)]'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Número */}
      <div className="text-sm text-[var(--color-text-muted)]">
        <span className="font-semibold text-[var(--color-text)]">
          {avgRating.toFixed(1)}
        </span>
        <span className="ml-1">
          ({ratingCount.toLocaleString()} valoraciones)
        </span>
      </div>

      {/* Tu valoración */}
      {userRating && (
        <span className="text-xs text-[var(--color-accent)]">
          Tu nota: {userRating}★
        </span>
      )}
    </div>
  );
}

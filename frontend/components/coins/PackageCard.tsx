'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

export interface CoinPackage {
  id: string;
  name: string;
  coins_amount: number;
  bonus_coins: number;
  price_usd: number | string;
  is_active: boolean;
  sort_order: number;
}

interface PackageCardProps {
  pkg: CoinPackage;
  onSelect: (pkg: CoinPackage) => void;
  highlighted?: boolean;
}

export function PackageCard({ pkg, onSelect, highlighted = false }: PackageCardProps) {
  const t = useTranslations('coins');
  const price = Number(pkg.price_usd).toFixed(2);
  const totalCoins = pkg.coins_amount + pkg.bonus_coins;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all duration-200 ${
        highlighted
          ? 'bg-gradient-to-b from-[var(--color-primary)]/15 to-[var(--color-card)] border-[var(--color-primary)] shadow-xl shadow-[var(--color-primary)]/10'
          : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
      }`}
    >
      {/* Badge popular */}
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--color-primary)] text-white shadow">
          <Sparkles size={11} />
          Popular
        </span>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {pkg.name}
          </span>
          {pkg.bonus_coins > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
              {t('bonus', { count: pkg.bonus_coins })}
            </span>
          )}
        </div>

        {/* Cantidad de monedas */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-[var(--color-text)]">
            🪙 {pkg.coins_amount.toLocaleString()}
          </span>
        </div>

        {pkg.bonus_coins > 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] mb-5">
            Total: <strong className="text-[var(--color-accent)]">{totalCoins.toLocaleString()}</strong> {t('coins')}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] mb-5">{t('coins')}</p>
        )}
      </div>

      <button
        onClick={() => onSelect(pkg)}
        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 ${
          highlighted
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]'
        }`}
      >
        {t('buy')} — {'$'}{price}
      </button>
    </div>
  );
}

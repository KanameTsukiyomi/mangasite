'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, CreditCard, Wallet, Coins as CryptoIcon, Loader2 } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import api from '@/lib/api';
import type { CoinPackage } from './PackageCard';

interface PaymentModalProps {
  pkg: CoinPackage | null;
  onClose: () => void;
}

type Provider = 'stripe' | 'paypal' | 'binance';

export function PaymentModal({ pkg, onClose }: PaymentModalProps) {
  const t = useTranslations('coins');
  const tAuth = useTranslations('auth');
  const { user } = useAuthStore();

  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState('');

  if (!pkg) return null;

  const totalCoins = pkg.coins_amount + pkg.bonus_coins;
  const price = Number(pkg.price_usd).toFixed(2);

  const handleCheckout = async (provider: Provider) => {
    setLoadingProvider(provider);
    setError('');
    try {
      const { data } = await api.post(`/api/coins/checkout/${provider}`, {
        package_id: pkg.id,
      });
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError('No se recibió una URL de pago válida.');
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
          err?.response?.data?.detail ??
          'Error al iniciar el pago. Intenta de nuevo.'
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {/* Resumen del paquete */}
        <div className="text-center mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            {pkg.name}
          </span>
          <h3 className="text-2xl font-black text-[var(--color-text)] mt-1">
            🪙 {totalCoins.toLocaleString()} {t('coins')}
          </h3>
          {pkg.bonus_coins > 0 && (
            <p className="text-xs text-[var(--color-accent)] mt-0.5">
              ({pkg.coins_amount.toLocaleString()} + {pkg.bonus_coins.toLocaleString()} bonus)
            </p>
          )}
          <div className="mt-3 inline-block px-4 py-1.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-lg font-bold text-[var(--color-text)]">
            {'$'}{price} USD
          </div>
        </div>

        {!user ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Inicia sesión para acreditar las monedas en tu cuenta.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {tAuth('login')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              {t('pay_with')}
            </p>

            {/* Stripe */}
            <button
              onClick={() => handleCheckout('stripe')}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors disabled:opacity-50"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text)]">
                <CreditCard size={18} className="text-[var(--color-primary)]" />
                {t('stripe_card')}
              </span>
              {loadingProvider === 'stripe' ? (
                <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">Stripe</span>
              )}
            </button>

            {/* PayPal */}
            <button
              onClick={() => handleCheckout('paypal')}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[#0070ba] transition-colors disabled:opacity-50"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text)]">
                <Wallet size={18} className="text-[#0070ba]" />
                {t('paypal')}
              </span>
              {loadingProvider === 'paypal' ? (
                <Loader2 size={16} className="animate-spin text-[#0070ba]" />
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">USD</span>
              )}
            </button>

            {/* Binance Pay */}
            <button
              onClick={() => handleCheckout('binance')}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[#F0B90B] transition-colors disabled:opacity-50"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text)]">
                <CryptoIcon size={18} className="text-[#F0B90B]" />
                {t('binance')}
              </span>
              {loadingProvider === 'binance' ? (
                <Loader2 size={16} className="animate-spin text-[#F0B90B]" />
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">USDT</span>
              )}
            </button>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 text-center mt-2">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

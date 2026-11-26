'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import api from '@/lib/api';
import { PackageCard, CoinPackage } from '@/components/coins/PackageCard';
import { PaymentModal } from '@/components/coins/PaymentModal';

interface CoinTransaction {
  id: string;
  type: 'purchase' | 'spend' | 'refund' | 'bonus' | 'admin_grant';
  amount: number;
  balance_after: number;
  description: string | null;
  payment_provider: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

function CoinsContent() {
  const t = useTranslations('coins');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, loadUser } = useAuthStore();

  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null);

  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txLoading, setTxLoading] = useState(false);

  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const paypalCapturedRef = useRef(false);

  // Cargar paquetes disponibles
  useEffect(() => {
    setPackagesLoading(true);
    api
      .get('/api/coins/packages')
      .then(({ data }) => setPackages(data.packages ?? []))
      .catch(() => setPackages([]))
      .finally(() => setPackagesLoading(false));
  }, []);

  // Cargar historial de transacciones del usuario
  const fetchTransactions = useCallback(async (page: number) => {
    if (!useAuthStore.getState().user) return;
    setTxLoading(true);
    try {
      const { data } = await api.get(`/api/users/me/transactions?page=${page}`);
      setTransactions(data.transactions ?? []);
      setTxTotal(data.total ?? 0);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void fetchTransactions(txPage);
    }
  }, [user, txPage, fetchTransactions]);

  // Manejar retorno desde pasarelas de pago
  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');
    const token = searchParams.get('token'); // order_id de PayPal

    if (cancelled === 'true') {
      setBanner({ kind: 'error', text: t('purchase_fail') });
      return;
    }

    if (success === 'paypal' && token && !paypalCapturedRef.current) {
      paypalCapturedRef.current = true;
      api
        .post('/api/coins/checkout/paypal/capture', { order_id: token })
        .then(async () => {
          await loadUser();
          await fetchTransactions(1);
          setBanner({
            kind: 'success',
            text:
              locale === 'en'
                ? 'PayPal payment completed! Your coins have been credited.'
                : '¡Pago con PayPal completado! Tus monedas han sido acreditadas.',
          });
        })
        .catch(() => {
          setBanner({ kind: 'error', text: t('purchase_fail') });
        });
      return;
    }

    if (success === 'stripe' || success === 'binance') {
      void loadUser();
      void fetchTransactions(1);
      setBanner({
        kind: 'success',
        text:
          locale === 'en'
            ? 'Payment received! Your coin balance has been updated.'
            : '¡Pago recibido! Tu saldo de monedas se ha actualizado.',
      });
    }
  }, [searchParams, loadUser, fetchTransactions, locale, t]);

  const txTotalPages = Math.max(1, Math.ceil(txTotal / 20));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Banner de resultado de pago */}
      {banner && (
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium ${
            banner.kind === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {banner.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{banner.text}</span>
        </div>
      )}

      {/* Cabecera / Saldo actual */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-secondary)]/50 via-[var(--color-card)] to-[var(--color-card)] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            {t('balance')}
          </p>
          {authLoading ? (
            <div className="h-10 w-36 rounded-lg bg-white/10 animate-pulse" />
          ) : user ? (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-[var(--color-accent)]">
                🪙 {user.coins_balance.toLocaleString()}
              </span>
              <span className="text-sm text-[var(--color-text-muted)]">{t('coins')}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-bold text-[var(--color-text)]">
                {locale === 'en'
                  ? 'Sign in to view your coin balance'
                  : 'Inicia sesión para ver tu saldo'}
              </p>
              <Link
                href="/login"
                className="inline-block px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {locale === 'en' ? 'Sign in' : 'Iniciar sesión'}
              </Link>
            </div>
          )}
        </div>

        <div className="text-center sm:text-right max-w-xs">
          <h1 className="text-xl font-bold text-[var(--color-text)]">{t('recharge')}</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {locale === 'en'
              ? 'Unlock premium chapters instantly and support our scanlation team.'
              : 'Desbloquea capítulos premium al instante y apoya a nuestro equipo.'}
          </p>
        </div>
      </div>

      {/* Paquetes de monedas */}
      <section>
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-5">
          {locale === 'en' ? 'Choose a package' : 'Elige un paquete'}
        </h2>

        {packagesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/40 text-sm text-[var(--color-text-muted)]">
            {locale === 'en'
              ? 'No coin packages available right now.'
              : 'No hay paquetes de monedas disponibles en este momento.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((pkg, idx) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSelect={setSelectedPkg}
                highlighted={pkg.name.toLowerCase() === 'popular' || idx === 3}
              />
            ))}
          </div>
        )}
      </section>

      {/* Historial de transacciones (solo usuarios autenticados) */}
      {user && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[var(--color-primary)]" />
            <h2 className="text-lg font-bold text-[var(--color-text)]">{t('history')}</h2>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
            {txLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--color-text-muted)]">
                {locale === 'en'
                  ? 'You have no transactions yet.'
                  : 'Aún no tienes transacciones.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[var(--color-bg)]/60 text-xs uppercase text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <tr>
                      <th className="px-4 py-3">{locale === 'en' ? 'Type' : 'Tipo'}</th>
                      <th className="px-4 py-3">{locale === 'en' ? 'Description' : 'Descripción'}</th>
                      <th className="px-4 py-3 text-right">{locale === 'en' ? 'Amount' : 'Cantidad'}</th>
                      <th className="px-4 py-3 text-right">{locale === 'en' ? 'Balance' : 'Saldo'}</th>
                      <th className="px-4 py-3 text-right">{locale === 'en' ? 'Date' : 'Fecha'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {transactions.map((tx) => {
                      const isPositive = tx.amount >= 0;
                      const dateStr = new Date(tx.created_at).toLocaleDateString(
                        locale === 'en' ? 'en-US' : 'es-ES',
                        { day: '2-digit', month: 'short', year: 'numeric' }
                      );
                      return (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                            <span className="px-2 py-0.5 rounded-md text-xs bg-[var(--color-bg)] border border-[var(--color-border)]">
                              {t(`types.${tx.type}` as any)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--color-text-muted)]">
                            {tx.description ?? '—'}
                            {tx.payment_provider && (
                              <span className="ml-2 text-xs uppercase opacity-60">
                                ({tx.payment_provider})
                              </span>
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-bold ${
                              isPositive ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount} 🪙
                          </td>
                          <td className="px-4 py-3 text-right text-[var(--color-text-muted)]">
                            {tx.balance_after.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">
                            {dateStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {txTotalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                disabled={txPage === 1}
                className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-[var(--color-text-muted)]">
                {txPage} / {txTotalPages}
              </span>
              <button
                onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                disabled={txPage === txTotalPages}
                className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Modal de pago */}
      <PaymentModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />
    </div>
  );
}

export default function CoinsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        </div>
      }
    >
      <CoinsContent />
    </Suspense>
  );
}

'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/lib/navigation';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale  = useLocale();
  const router  = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    const nextLocale = locale === 'es' ? 'en' : 'es';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggle}
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]
                 hover:text-[var(--color-text)] transition-colors px-2 py-1 rounded-md
                 hover:bg-[var(--color-card)]"
    >
      <Globe size={15} />
      <span className="font-semibold uppercase tracking-wide">{locale}</span>
    </button>
  );
}

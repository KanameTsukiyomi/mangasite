import { createNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

/**
 * Helpers de navegación con soporte i18n automático.
 * Usar en lugar de next/link y next/navigation en toda la app.
 */
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

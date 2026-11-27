import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Aplicar a todas las rutas excepto API, callback OAuth, assets de Next.js y archivos estáticos
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)'],
};

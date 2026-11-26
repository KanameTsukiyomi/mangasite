'use client';

import { useEffect } from 'react';
import { applyTheme } from '@/lib/theme';

/**
 * Carga la paleta de colores desde la API al iniciar la app
 * y la aplica como variables CSS en el :root.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    fetch(`${apiUrl}/api/settings`)
      .then(r => r.json())
      .then(({ settings }) => { if (settings) applyTheme(settings); })
      .catch(() => {}); // Fallback: se usan los colores por defecto del globals.css
  }, []);

  return <>{children}</>;
}

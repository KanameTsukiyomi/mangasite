import type { Config } from 'tailwindcss';
import animate   from 'tailwindcss-animate';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores impulsados por variables CSS de site_settings
        primary:      'var(--color-primary)',
        secondary:    'var(--color-secondary)',
        'site-bg':    'var(--color-bg)',
        card:         'var(--color-card)',
        'text-main':  'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        accent:       'var(--color-accent)',
        'site-border':'var(--color-border)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        reading: ['Georgia', 'Cambria', 'serif'],
      },
      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [animate, typography],
};

export default config;

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default:  'MangaSite',
    template: '%s | MangaSite',
  },
  description: 'Lee manga, manhwa, manhua, webtoons y novelas web.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

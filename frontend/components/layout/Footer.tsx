import { Link } from '@/lib/navigation';
import { Github, Twitter, MessageCircle, Instagram } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-card)] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">

          {/* Columna 1: Marca */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center
                              justify-center text-white font-black text-sm">M</div>
              <span className="font-black text-lg text-[var(--color-text)]">MangaSite</span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-xs">
              Lee manga, manhwa, manhua, webtoons y novelas web de forma gratuita.
            </p>
            {/* Redes sociales */}
            <div className="flex items-center gap-3 mt-4">
              <SocialLink href="#" icon={<Twitter size={16} />}      label="Twitter" />
              <SocialLink href="#" icon={<MessageCircle size={16} />} label="Discord" />
              <SocialLink href="#" icon={<Instagram size={16} />}    label="Instagram" />
            </div>
          </div>

          {/* Columna 2: Explorar */}
          <div>
            <h4 className="font-semibold text-[var(--color-text)] text-sm mb-3 uppercase tracking-wider">
              Explorar
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Inicio',               href: '/' },
                { label: 'Últimas actualizaciones', href: '/search?sort=updated_at' },
                { label: 'Géneros',               href: '/genres' },
                { label: 'Más populares',         href: '/search?sort=views' },
                { label: 'Nuevos',                href: '/search?sort=created_at' },
              ].map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href as any}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]
                               transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Cuenta */}
          <div>
            <h4 className="font-semibold text-[var(--color-text)] text-sm mb-3 uppercase tracking-wider">
              Mi cuenta
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Iniciar sesión', href: '/login' },
                { label: 'Registrarse',   href: '/register' },
                { label: 'Mi biblioteca', href: '/library' },
                { label: 'Monedas',       href: '/coins' },
                { label: 'Mi perfil',     href: '/profile' },
              ].map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href as any}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]
                               transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="border-t border-[var(--color-border)] pt-6 flex flex-col sm:flex-row
                        items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {year} MangaSite. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
            <a href="#" className="hover:text-[var(--color-primary)] transition-colors">
              Términos de uso
            </a>
            <a href="#" className="hover:text-[var(--color-primary)] transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-[var(--color-primary)] transition-colors">
              Contacto
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]
                 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]
                 hover:border-[var(--color-primary)] transition-colors"
    >
      {icon}
    </a>
  );
}

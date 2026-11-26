import { Link } from '@/lib/navigation';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  href?: string;
  viewAllLabel?: string;
}

export function SectionHeader({ title, href, viewAllLabel = 'Ver todo' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        {/* Barra de acento */}
        <span className="w-1 h-6 rounded-full bg-[var(--color-primary)] inline-block" />
        <h2 className="text-xl font-bold text-[var(--color-text)]">{title}</h2>
      </div>
      {href && (
        <Link
          href={href as any}
          className="flex items-center gap-1 text-sm text-[var(--color-primary)]
                     hover:opacity-80 transition-opacity font-medium"
        >
          {viewAllLabel}
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

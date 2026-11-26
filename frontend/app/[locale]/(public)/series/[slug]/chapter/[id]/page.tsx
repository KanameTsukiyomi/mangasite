import { notFound } from 'next/navigation';
import ReaderClient from './ReaderClient';

interface PageProps {
  params: { locale: string; slug: string; id: string };
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function fetchChapters(slug: string, locale: string) {
  try {
    const res = await fetch(`${API}/api/series/${slug}/chapters?lang=${locale}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchSeries(slug: string, locale: string) {
  try {
    const res = await fetch(`${API}/api/series/${slug}?lang=${locale}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ChapterReaderPage({ params }: PageProps) {
  const { locale, slug, id } = params;

  const [seriesRes, chaptersRes] = await Promise.all([
    fetchSeries(slug, locale),
    fetchChapters(slug, locale),
  ]);

  if (!seriesRes?.series) notFound();

  const series = seriesRes.series;
  const chapters = chaptersRes?.chapters ?? [];
  const tr =
    series.series_translations?.find((t: any) => t.language === locale) ??
    series.series_translations?.[0];
  const seriesTitle = tr?.title ?? series.slug;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <ReaderClient
        slug={slug}
        chapterId={id}
        chapters={chapters}
        seriesTitle={seriesTitle}
        locale={locale}
      />
    </div>
  );
}

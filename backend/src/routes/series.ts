import { Router } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/series — lista paginada con filtros ─────────────────
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  const {
    type, status, genre, search,
    page = '1', limit = '20',
    sort = 'updated_at',
    lang = 'es',
  } = req.query as Record<string, string>;

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset   = (pageNum - 1) * limitNum;

  let query = supabaseAdmin
    .from('series')
    .select(`
      id, slug, type, status, cover_url,
      views, avg_rating, is_featured, is_hot, is_new, updated_at,
      series_translations!inner(title, language),
      chapters(id, chapter_number, published_at, is_free, coin_cost)
    `, { count: 'exact' })
    .eq('series_translations.language', lang)
    .range(offset, offset + limitNum - 1);

  // Filtros
  if (type)   query = query.eq('type', type);
  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('series_translations.title', `%${search}%`);

  // Género: filtrar via series_genres
  if (genre) {
    const { data: genreRow } = await supabaseAdmin
      .from('genres').select('id').eq('slug', genre).single();
    if (genreRow) {
      const { data: sg } = await supabaseAdmin
        .from('series_genres')
        .select('series_id')
        .eq('genre_id', genreRow.id);
      const ids = (sg ?? []).map(r => r.series_id);
      if (ids.length) query = query.in('id', ids);
      else {
        res.json({ series: [], total: 0, page: pageNum, totalPages: 0 });
        return;
      }
    }
  }

  // Ordenamiento
  const sortMap: Record<string, { col: string; asc: boolean }> = {
    updated_at: { col: 'updated_at', asc: false },
    views:      { col: 'views',      asc: false },
    rating:     { col: 'avg_rating', asc: false },
    created_at: { col: 'created_at', asc: false },
  };
  const s = sortMap[sort] ?? sortMap['updated_at'];
  query = query.order(s.col, { ascending: s.asc });

  const { data, error, count } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json({
    series:     data ?? [],
    total:      count ?? 0,
    page:       pageNum,
    limit:      limitNum,
    totalPages: Math.ceil((count ?? 0) / limitNum),
  });
});

// ── GET /api/series/featured — slider de portada ─────────────────
router.get('/featured', async (req, res) => {
  const lang = (req.query.lang as string) ?? 'es';

  const { data, error } = await supabaseAdmin
    .from('series')
    .select(`
      id, slug, type, status, cover_url, banner_url, views, avg_rating,
      series_translations!inner(title, description, language)
    `)
    .eq('is_featured', true)
    .eq('series_translations.language', lang)
    .limit(10);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ featured: data ?? [] });
});

// ── GET /api/series/latest — últimas actualizaciones ─────────────
router.get('/latest', async (req, res) => {
  const lang  = (req.query.lang  as string) ?? 'es';
  const limit = Math.min(50, parseInt((req.query.limit as string) ?? '24'));

  const { data, error } = await supabaseAdmin
    .from('series')
    .select(`
      id, slug, type, status, cover_url, updated_at,
      series_translations!inner(title, language),
      chapters(id, chapter_number, published_at, is_free, coin_cost)
    `)
    .eq('series_translations.language', lang)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ latest: data ?? [] });
});

// ── GET /api/series/hot — tendencias ─────────────────────────────
router.get('/hot', async (req, res) => {
  const lang  = (req.query.lang  as string) ?? 'es';
  const limit = Math.min(20, parseInt((req.query.limit as string) ?? '12'));

  const { data, error } = await supabaseAdmin
    .from('series')
    .select(`id, slug, type, cover_url, views, avg_rating, series_translations!inner(title, language)`)
    .eq('is_hot', true)
    .eq('series_translations.language', lang)
    .order('views', { ascending: false })
    .limit(limit);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ hot: data ?? [] });
});

// ── GET /api/series/genres — lista de géneros ───────────────────
router.get('/genres', async (req, res) => {
  const lang = (req.query.lang as string) ?? 'es';

  const { data, error } = await supabaseAdmin
    .from('genres')
    .select('id, slug, genre_translations(name, language)')
    .order('slug', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }

  const genres = (data ?? []).map((g: any) => {
    const tr =
      g.genre_translations?.find((t: any) => t.language === lang) ??
      g.genre_translations?.[0];
    return {
      id: g.id,
      slug: g.slug,
      name: tr?.name ?? g.slug,
    };
  });

  res.json({ genres });
});

// ── GET /api/series/:slug — detalle de serie ─────────────────────
router.get('/:slug', optionalAuth, async (req: AuthRequest, res) => {
  const { slug } = req.params;
  const lang = (req.query.lang as string) ?? 'es';

  const { data: series, error } = await supabaseAdmin
    .from('series')
    .select(`
      id, slug, type, status,
      cover_url, banner_url, views, avg_rating, rating_count,
      is_featured, is_hot, is_new, created_at, updated_at,
      series_translations(title, alt_titles, description, author, artist, language),
      series_genres(genres(id, slug, genre_translations(name, language)))
    `)
    .eq('slug', slug)
    .single();

  if (error || !series) { res.status(404).json({ error: 'Serie no encontrada' }); return; }

  // Incrementar vistas (fire-and-forget, no bloqueante)
  void supabaseAdmin.from('series').update({ views: (series.views ?? 0) + 1 }).eq('id', series.id);

  // Datos personalizados del usuario si está autenticado
  let userLibraryStatus: string | null = null;
  let userRating: number | null = null;

  if (req.user) {
    const [libRes, ratingRes] = await Promise.all([
      supabaseAdmin.from('user_library')
        .select('status').eq('user_id', req.user.id).eq('series_id', series.id).single(),
      supabaseAdmin.from('ratings')
        .select('rating').eq('user_id', req.user.id).eq('series_id', series.id).single(),
    ]);
    userLibraryStatus = libRes.data?.status ?? null;
    userRating = ratingRes.data?.rating ?? null;
  }

  res.json({ series, userLibraryStatus, userRating });
});

// ── GET /api/series/:slug/chapters — lista de capítulos ──────────
router.get('/:slug/chapters', optionalAuth, async (req: AuthRequest, res) => {
  const { slug } = req.params;
  const lang  = (req.query.lang  as string) ?? 'es';
  const order = (req.query.order as string) === 'asc';

  const { data: series } = await supabaseAdmin
    .from('series').select('id').eq('slug', slug).single();

  if (!series) { res.status(404).json({ error: 'Serie no encontrada' }); return; }

  const { data: chapters, error } = await supabaseAdmin
    .from('chapters')
    .select(`
      id, chapter_number, volume_number,
      is_free, coin_cost, free_after_days,
      views, pages_count, published_at,
      chapter_translations(title, language)
    `)
    .eq('series_id', series.id)
    .order('chapter_number', { ascending: order });

  if (error) { res.status(500).json({ error: error.message }); return; }

  // Marcar capítulos desbloqueados si el usuario está autenticado
  let unlockedIds: string[] = [];
  if (req.user && chapters?.length) {
    const { data: unlocked } = await supabaseAdmin
      .from('user_unlocked_chapters')
      .select('chapter_id')
      .eq('user_id', req.user.id)
      .in('chapter_id', chapters.map(c => c.id));
    unlockedIds = (unlocked ?? []).map(u => u.chapter_id);
  }

  const now = Date.now();
  const enriched = (chapters ?? []).map(ch => {
    const isFreeByTime =
      ch.free_after_days != null &&
      new Date(ch.published_at).getTime() < now - ch.free_after_days * 86_400_000;
    return {
      ...ch,
      is_accessible:        ch.is_free || isFreeByTime || unlockedIds.includes(ch.id),
      is_unlocked_by_user:  unlockedIds.includes(ch.id),
    };
  });

  res.json({ chapters: enriched });
});

export default router;

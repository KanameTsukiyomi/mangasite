import { Router } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/users/me ─────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url, role, coins_balance, language, bio, created_at')
    .eq('id', req.user!.id)
    .single();

  if (error) { res.status(404).json({ error: 'Perfil no encontrado' }); return; }
  res.json({ profile: data });
});

// ── PATCH /api/users/me ───────────────────────────────────────────
router.patch('/me', authenticate, async (req: AuthRequest, res) => {
  const { username, bio, language } = req.body;
  const updates: Record<string, string> = {};

  if (username) updates.username = username;
  if (bio !== undefined) updates.bio = bio;
  if (language && ['es', 'en'].includes(language)) updates.language = language;

  if (!Object.keys(updates).length) {
    res.status(400).json({ error: 'Sin campos para actualizar' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('profiles').update(updates).eq('id', req.user!.id).select().single();

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ profile: data });
});

// ── GET /api/users/me/library ─────────────────────────────────────
router.get('/me/library', authenticate, async (req: AuthRequest, res) => {
  const lang   = (req.query.lang   as string) ?? 'es';
  const status = req.query.status  as string | undefined;

  let query = supabaseAdmin
    .from('user_library')
    .select(`
      status, added_at, updated_at,
      series(id, slug, type, cover_url, avg_rating, updated_at,
        series_translations!inner(title, language))
    `)
    .eq('user_id', req.user!.id)
    .eq('series.series_translations.language', lang)
    .order('updated_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ library: data ?? [] });
});

// ── POST /api/users/me/library ────────────────────────────────────
router.post('/me/library', authenticate, async (req: AuthRequest, res) => {
  const { series_id, status = 'reading' } = req.body;
  if (!series_id) { res.status(400).json({ error: 'series_id es requerido' }); return; }

  const { data, error } = await supabaseAdmin
    .from('user_library')
    .upsert({ user_id: req.user!.id, series_id, status }, { onConflict: 'user_id,series_id' })
    .select().single();

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ entry: data });
});

// ── DELETE /api/users/me/library/:seriesId ────────────────────────
router.delete('/me/library/:seriesId', authenticate, async (req: AuthRequest, res) => {
  const { error } = await supabaseAdmin
    .from('user_library')
    .delete()
    .eq('user_id', req.user!.id)
    .eq('series_id', req.params.seriesId);

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

// ── GET /api/users/me/history ─────────────────────────────────────
router.get('/me/history', authenticate, async (req: AuthRequest, res) => {
  const lang = (req.query.lang as string) ?? 'es';

  const { data, error } = await supabaseAdmin
    .from('user_reading_history')
    .select(`
      chapter_id, page_number, read_at,
      chapters(chapter_number, series(slug, cover_url,
        series_translations!inner(title, language)))
    `)
    .eq('user_id', req.user!.id)
    .eq('chapters.series.series_translations.language', lang)
    .order('read_at', { ascending: false })
    .limit(50);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ history: data ?? [] });
});

// ── GET /api/users/me/transactions ───────────────────────────────
router.get('/me/transactions', authenticate, async (req: AuthRequest, res) => {
  const page   = Math.max(1, parseInt((req.query.page as string) ?? '1'));
  const limit  = 20;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('coin_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ transactions: data ?? [], total: count ?? 0, page, limit });
});

// ── POST /api/users/me/ratings — valorar una serie ───────────────
router.post('/me/ratings', authenticate, async (req: AuthRequest, res) => {
  const { series_id, rating } = req.body;
  if (!series_id || !rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'series_id y rating (1-5) son requeridos' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('ratings')
    .upsert({ user_id: req.user!.id, series_id, rating }, { onConflict: 'user_id,series_id' })
    .select().single();

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ rating: data });
});

export default router;

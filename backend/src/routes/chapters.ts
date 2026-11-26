import { Router } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Verifica si un usuario tiene acceso a un capítulo ────────────
async function checkAccess(
  chapterId: string,
  userId?: string
): Promise<{ ok: boolean; chapter: Record<string, any> | null; reason?: string }> {
  const { data: chapter, error } = await supabaseAdmin
    .from('chapters')
    .select('id, series_id, is_free, coin_cost, free_after_days, published_at')
    .eq('id', chapterId)
    .single();

  if (error || !chapter) return { ok: false, chapter: null, reason: 'Capítulo no encontrado' };

  const isFreeByTime =
    chapter.free_after_days != null &&
    new Date(chapter.published_at).getTime() < Date.now() - chapter.free_after_days * 86_400_000;

  if (chapter.is_free || isFreeByTime) return { ok: true, chapter };
  if (!userId) return { ok: false, chapter, reason: 'Debes iniciar sesión para leer este capítulo' };

  const { data: unlocked } = await supabaseAdmin
    .from('user_unlocked_chapters')
    .select('unlocked_at')
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .single();

  if (unlocked) return { ok: true, chapter };
  return { ok: false, chapter, reason: 'Capítulo premium — usa monedas para desbloquearlo' };
}

// ── GET /api/chapters/:id — contenido del capítulo ───────────────
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  const { id }  = req.params;
  const lang    = (req.query.lang as string) ?? 'es';

  const { ok, chapter, reason } = await checkAccess(id, req.user?.id);

  if (!ok) {
    res.status(403).json({
      error:      reason,
      coin_cost:  chapter?.coin_cost,
      chapter_id: id,
    });
    return;
  }

  // Tipo de serie → determina si es cómic o novela
  const { data: series } = await supabaseAdmin
    .from('series').select('type').eq('id', chapter!.series_id).single();

  if (series?.type === 'novel') {
    // Novela: texto en el idioma pedido (con fallback al otro idioma)
    let { data: content } = await supabaseAdmin
      .from('novel_content')
      .select('content, language')
      .eq('chapter_id', id)
      .eq('language', lang)
      .single();

    if (!content) {
      const fallback = await supabaseAdmin
        .from('novel_content')
        .select('content, language')
        .eq('chapter_id', id)
        .limit(1)
        .single();
      content = fallback.data;
    }

    res.json({ type: 'novel', content: content?.content ?? '', language: content?.language });
  } else {
    // Cómic/manhwa/webtoon: lista de páginas ordenada
    const { data: pages } = await supabaseAdmin
      .from('chapter_pages')
      .select('page_number, image_url')
      .eq('chapter_id', id)
      .order('page_number', { ascending: true });

    res.json({ type: 'comic', pages: pages ?? [] });
  }
});

// ── POST /api/chapters/:id/unlock — desbloquear con monedas ──────
router.post('/:id/unlock', authenticate, async (req: AuthRequest, res) => {
  const { id }   = req.params;
  const userId   = req.user!.id;

  const { data: chapter } = await supabaseAdmin
    .from('chapters')
    .select('id, is_free, coin_cost, free_after_days, published_at')
    .eq('id', id)
    .single();

  if (!chapter) { res.status(404).json({ error: 'Capítulo no encontrado' }); return; }

  const isFreeByTime =
    chapter.free_after_days != null &&
    new Date(chapter.published_at).getTime() < Date.now() - chapter.free_after_days * 86_400_000;

  if (chapter.is_free || isFreeByTime) {
    res.status(400).json({ error: 'Este capítulo ya es de acceso libre' });
    return;
  }

  // ¿Ya está desbloqueado?
  const { data: existing } = await supabaseAdmin
    .from('user_unlocked_chapters')
    .select('unlocked_at')
    .eq('user_id', userId).eq('chapter_id', id).single();

  if (existing) { res.status(400).json({ error: 'Ya tienes acceso a este capítulo' }); return; }

  // Verificar saldo
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('coins_balance').eq('id', userId).single();

  if (!profile || profile.coins_balance < chapter.coin_cost) {
    res.status(402).json({
      error:     'Saldo insuficiente',
      required:  chapter.coin_cost,
      available: profile?.coins_balance ?? 0,
    });
    return;
  }

  const newBalance = profile.coins_balance - chapter.coin_cost;

  // Ejecutar las tres escrituras en paralelo
  const [balRes, unlRes] = await Promise.all([
    supabaseAdmin.from('profiles').update({ coins_balance: newBalance }).eq('id', userId),
    supabaseAdmin.from('user_unlocked_chapters')
      .insert({ user_id: userId, chapter_id: id, coins_spent: chapter.coin_cost }),
    supabaseAdmin.from('coin_transactions').insert({
      user_id:      userId,
      type:         'spend',
      amount:       -chapter.coin_cost,
      balance_after: newBalance,
      description:  `Desbloqueo de capítulo ${id}`,
    }),
  ]);

  if (balRes.error || unlRes.error) {
    res.status(500).json({ error: 'Error al procesar el desbloqueo' });
    return;
  }

  res.json({ success: true, coins_spent: chapter.coin_cost, new_balance: newBalance });
});

// ── POST /api/chapters/:id/progress — guardar progreso ───────────
router.post('/:id/progress', authenticate, async (req: AuthRequest, res) => {
  const { id }             = req.params;
  const { page_number = 1 } = req.body;

  const { error } = await supabaseAdmin
    .from('user_reading_history')
    .upsert(
      { user_id: req.user!.id, chapter_id: id, page_number, read_at: new Date().toISOString() },
      { onConflict: 'user_id,chapter_id' }
    );

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

export default router;

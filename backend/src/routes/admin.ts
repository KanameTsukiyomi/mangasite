import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../services/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';
import { adminOnly, superAdminOnly } from '../middleware/adminOnly';

const router  = Router();
const upload  = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20 MB por imagen
});

// Todos los endpoints de admin requieren auth + rol admin/moderator
router.use(authenticate, adminOnly);

// ── DASHBOARD ────────────────────────────────────────────────────
router.get('/dashboard', async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [
    { count: totalUsers },
    { count: totalSeries },
    { count: totalChapters },
    { data: purchases },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('series').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('chapters').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('coin_transactions')
      .select('amount')
      .eq('type', 'purchase')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo),
  ]);

  // Estimar ingresos: cada moneda ~$0.01 (ajustar según precio real de paquetes)
  const monthlyRevenue = (purchases ?? []).reduce((sum, t) => sum + t.amount * 0.01, 0);

  res.json({ stats: { totalUsers, totalSeries, totalChapters, monthlyRevenue: monthlyRevenue.toFixed(2) } });
});

// ── SERIES ────────────────────────────────────────────────────────
router.get('/series', async (req, res) => {
  const page   = Math.max(1, parseInt((req.query.page as string) ?? '1'));
  const limit  = 20;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('series')
    .select('*, series_translations(title, language)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ series: data ?? [], total: count ?? 0, page });
});

router.get('/series/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('series')
    .select('*, series_translations(*), series_genres(genre_id)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) { res.status(404).json({ error: 'Serie no encontrada' }); return; }
  res.json({ series: data });
});

// Subir portada o banner a Supabase Storage
router.post('/upload', upload.single('file'), async (req: AuthRequest, res) => {
  const file = req.file;
  const folder = req.body.folder === 'banners' ? 'banners' : 'covers';
  if (!file) { res.status(400).json({ error: 'Archivo requerido' }); return; }

  const ext = (file.originalname.match(/\.[^.]+$/) ?? ['.jpg'])[0];
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from('chapter-pages')
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

  if (uploadErr) { res.status(500).json({ error: uploadErr.message }); return; }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('chapter-pages')
    .getPublicUrl(path);

  res.json({ url: publicUrl });
});

router.post('/series', async (req, res) => {
  const { slug, type, status, cover_url, banner_url,
          is_featured, is_hot, translations, genre_ids } = req.body;

  if (!slug || !type || !translations?.length) {
    res.status(400).json({ error: 'slug, type y translations son requeridos' });
    return;
  }

  const { data: series, error } = await supabaseAdmin
    .from('series')
    .insert({ slug, type, status: status ?? 'ongoing', cover_url, banner_url,
              is_featured: is_featured ?? false, is_hot: is_hot ?? false })
    .select().single();

  if (error) { res.status(400).json({ error: error.message }); return; }

  await supabaseAdmin.from('series_translations').insert(
    translations.map((t: any) => ({ series_id: series.id, ...t }))
  );

  if (genre_ids?.length) {
    await supabaseAdmin.from('series_genres').insert(
      genre_ids.map((gid: string) => ({ series_id: series.id, genre_id: gid }))
    );
  }

  res.status(201).json({ series });
});

router.patch('/series/:id', async (req, res) => {
  const { id } = req.params;
  const { slug, type, status, cover_url, banner_url,
          is_featured, is_hot, is_new, translations, genre_ids } = req.body;

  const updates: Record<string, any> = {};
  if (slug        !== undefined) updates.slug        = slug;
  if (type        !== undefined) updates.type        = type;
  if (status      !== undefined) updates.status      = status;
  if (cover_url   !== undefined) updates.cover_url   = cover_url;
  if (banner_url  !== undefined) updates.banner_url  = banner_url;
  if (is_featured !== undefined) updates.is_featured = is_featured;
  if (is_hot      !== undefined) updates.is_hot      = is_hot;
  if (is_new      !== undefined) updates.is_new      = is_new;

  if (Object.keys(updates).length) {
    await supabaseAdmin.from('series').update(updates).eq('id', id);
  }

  if (translations?.length) {
    for (const t of translations) {
      await supabaseAdmin.from('series_translations')
        .upsert({ series_id: id, ...t }, { onConflict: 'series_id,language' });
    }
  }

  if (genre_ids !== undefined) {
    await supabaseAdmin.from('series_genres').delete().eq('series_id', id);
    if (genre_ids.length) {
      await supabaseAdmin.from('series_genres').insert(
        genre_ids.map((gid: string) => ({ series_id: id, genre_id: gid }))
      );
    }
  }

  res.json({ success: true });
});

router.delete('/series/:id', superAdminOnly, async (req, res) => {
  const { error } = await supabaseAdmin.from('series').delete().eq('id', req.params.id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

// ── CAPÍTULOS ────────────────────────────────────────────────────
router.get('/chapters', async (req, res) => {
  const { series_id } = req.query;

  let query = supabaseAdmin
    .from('chapters')
    .select(`*, chapter_translations(title, language),
             series(slug, series_translations(title, language))`)
    .order('published_at', { ascending: false })
    .limit(50);

  if (series_id) query = query.eq('series_id', series_id as string);

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ chapters: data ?? [] });
});

router.post('/chapters', async (req, res) => {
  const { series_id, chapter_number, volume_number,
          is_free, coin_cost, free_after_days, translations } = req.body;

  if (!series_id || chapter_number === undefined) {
    res.status(400).json({ error: 'series_id y chapter_number son requeridos' });
    return;
  }

  const { data: chapter, error } = await supabaseAdmin
    .from('chapters')
    .insert({ series_id, chapter_number, volume_number,
              is_free: is_free ?? true, coin_cost: coin_cost ?? 0, free_after_days })
    .select().single();

  if (error) { res.status(400).json({ error: error.message }); return; }

  if (translations?.length) {
    await supabaseAdmin.from('chapter_translations').insert(
      translations.map((t: any) => ({ chapter_id: chapter.id, ...t }))
    );
  }

  res.status(201).json({ chapter });
});

// Subir páginas de cómic a Supabase Storage
router.post('/chapters/:id/pages',
  upload.array('pages', 500),
  async (req: AuthRequest, res) => {
    const { id }   = req.params;
    const files    = req.files as Express.Multer.File[];
    const startPage = parseInt((req.body.start_page as string) ?? '1');

    if (!files?.length) { res.status(400).json({ error: 'No se enviaron archivos' }); return; }

    const uploaded: Array<{ page_number: number; image_url: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file   = files[i];
      const pageNo = startPage + i;
      const ext    = (file.originalname.match(/\.[^.]+$/) ?? ['.jpg'])[0];
      const path   = `chapters/${id}/${String(pageNo).padStart(4, '0')}${ext}`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from('chapter-pages')
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

      if (uploadErr) {
        res.status(500).json({ error: `Error al subir página ${pageNo}: ${uploadErr.message}` });
        return;
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('chapter-pages').getPublicUrl(path);

      uploaded.push({ page_number: pageNo, image_url: publicUrl });
    }

    const { error: insertErr } = await supabaseAdmin
      .from('chapter_pages')
      .upsert(
        uploaded.map(p => ({ chapter_id: id, ...p })),
        { onConflict: 'chapter_id,page_number' }
      );

    if (insertErr) { res.status(500).json({ error: insertErr.message }); return; }
    res.json({ success: true, pages_uploaded: uploaded.length, pages: uploaded });
  }
);

// Subir texto de novela
router.post('/chapters/:id/novel-content', async (req, res) => {
  const { id } = req.params;
  const { language, content } = req.body;

  if (!language || !content) {
    res.status(400).json({ error: 'language y content son requeridos' });
    return;
  }

  const { error } = await supabaseAdmin
    .from('novel_content')
    .upsert({ chapter_id: id, language, content }, { onConflict: 'chapter_id,language' });

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

router.patch('/chapters/:id', async (req, res) => {
  const { id } = req.params;
  const { is_free, coin_cost, free_after_days, translations } = req.body;

  const updates: Record<string, any> = {};
  if (is_free         !== undefined) updates.is_free         = is_free;
  if (coin_cost       !== undefined) updates.coin_cost       = coin_cost;
  if (free_after_days !== undefined) updates.free_after_days = free_after_days;

  if (Object.keys(updates).length) {
    await supabaseAdmin.from('chapters').update(updates).eq('id', id);
  }

  if (translations?.length) {
    for (const t of translations) {
      await supabaseAdmin.from('chapter_translations')
        .upsert({ chapter_id: id, ...t }, { onConflict: 'chapter_id,language' });
    }
  }

  res.json({ success: true });
});

router.delete('/chapters/:id', superAdminOnly, async (req, res) => {
  const { error } = await supabaseAdmin.from('chapters').delete().eq('id', req.params.id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

// ── USUARIOS ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const page   = Math.max(1, parseInt((req.query.page as string) ?? '1'));
  const limit  = 20;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;

  let query = supabaseAdmin
    .from('profiles')
    .select('id, username, role, coins_balance, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.ilike('username', `%${search}%`);

  const { data, error, count } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ users: data ?? [], total: count ?? 0, page });
});

router.patch('/users/:id/role', superAdminOnly, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'moderator', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Rol inválido' });
    return;
  }
  const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', req.params.id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

router.post('/users/:id/grant-coins', superAdminOnly, async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || amount <= 0) { res.status(400).json({ error: 'amount debe ser positivo' }); return; }

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('coins_balance').eq('id', req.params.id).single();

  if (!profile) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

  const newBalance = profile.coins_balance + amount;

  await Promise.all([
    supabaseAdmin.from('profiles').update({ coins_balance: newBalance }).eq('id', req.params.id),
    supabaseAdmin.from('coin_transactions').insert({
      user_id:      req.params.id,
      type:         'admin_grant',
      amount,
      balance_after: newBalance,
      description:  reason ?? 'Monedas otorgadas por administrador',
    }),
  ]);

  res.json({ success: true, new_balance: newBalance });
});

// ── PAQUETES DE MONEDAS ───────────────────────────────────────────
router.get('/coins/packages', async (_req, res) => {
  const { data } = await supabaseAdmin.from('coin_packages').select('*').order('sort_order');
  res.json({ packages: data ?? [] });
});

router.post('/coins/packages', superAdminOnly, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('coin_packages').insert(req.body).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.status(201).json({ package: data });
});

router.patch('/coins/packages/:id', superAdminOnly, async (req, res) => {
  const { error } = await supabaseAdmin.from('coin_packages').update(req.body).eq('id', req.params.id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

// ── TRANSACCIONES ─────────────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  const page   = Math.max(1, parseInt((req.query.page as string) ?? '1'));
  const limit  = 50;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('coin_transactions')
    .select('*, profiles(username)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ transactions: data ?? [], total: count ?? 0, page });
});

// ── COMENTARIOS ───────────────────────────────────────────────────
router.get('/comments', async (_req, res) => {
  const { data } = await supabaseAdmin
    .from('comments')
    .select('*, profiles(username), series(slug, series_translations(title, language))')
    .order('created_at', { ascending: false })
    .limit(50);
  res.json({ comments: data ?? [] });
});

router.delete('/comments/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('comments').update({ is_deleted: true }).eq('id', req.params.id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

// ── BANNERS ───────────────────────────────────────────────────────
router.get('/banners', async (_req, res) => {
  const { data } = await supabaseAdmin.from('banners').select('*').order('position');
  res.json({ banners: data ?? [] });
});

router.post('/banners', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('banners').insert(req.body).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.status(201).json({ banner: data });
});

router.patch('/banners/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('banners').update(req.body).eq('id', req.params.id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

router.delete('/banners/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('banners').delete().eq('id', req.params.id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

// ── CONFIGURACIÓN DEL SITIO ───────────────────────────────────────
router.get('/settings', async (_req, res) => {
  const { data } = await supabaseAdmin.from('site_settings').select('key, value');
  const settings = (data ?? []).reduce<Record<string, string>>((acc, r) => {
    acc[r.key] = r.value ?? '';
    return acc;
  }, {});
  res.json({ settings });
});

router.patch('/settings', superAdminOnly, async (req, res) => {
  const updates = req.body as Record<string, string>;
  const rows = Object.entries(updates).map(([key, value]) => ({
    key, value, updated_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin
    .from('site_settings').upsert(rows, { onConflict: 'key' });

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

export default router;

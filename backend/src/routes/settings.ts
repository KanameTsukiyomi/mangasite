import { Router } from 'express';
import { supabaseAdmin } from '../services/supabase';

const router = Router();

/**
 * GET /api/settings
 * Devuelve la configuración pública del sitio (colores, nombre, etc.)
 * Usado por el ThemeProvider del frontend para aplicar variables CSS.
 */
router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('key, value');

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const settings = (data ?? []).reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value ?? '';
    return acc;
  }, {});

  res.json({ settings });
});

export default router;

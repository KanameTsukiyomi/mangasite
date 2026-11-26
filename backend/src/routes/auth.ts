import { Router } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/auth/me — perfil del usuario autenticado
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url, role, coins_balance, language, bio, created_at')
    .eq('id', req.user!.id)
    .single();

  if (error) {
    res.status(404).json({ error: 'Perfil no encontrado' });
    return;
  }

  res.json({ profile });
});

export default router;

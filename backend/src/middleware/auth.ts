import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Middleware: verifica el JWT de Supabase en el header Authorization.
 * Adjunta req.user si es válido; devuelve 401 si no.
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Token inválido o expirado' });
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email!,
      role: profile?.role ?? 'user',
    };

    next();
  } catch {
    res.status(401).json({ error: 'Error al verificar el token' });
  }
}

/**
 * Middleware: como authenticate, pero no bloquea si no hay token.
 * Útil para rutas públicas que muestran datos extra si el usuario está autenticado.
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.headers.authorization) {
    next();
    return;
  }
  void authenticate(req, res, next);
}

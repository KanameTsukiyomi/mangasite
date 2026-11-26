import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Requiere rol 'admin' o 'moderator'.
 */
export function adminOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  if (!['admin', 'moderator'].includes(req.user.role)) {
    res.status(403).json({ error: 'Acceso de administrador requerido' });
    return;
  }
  next();
}

/**
 * Requiere rol 'admin' exacto (para acciones destructivas o de configuración).
 */
export function superAdminOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Se requiere rol de super administrador' });
    return;
  }
  next();
}

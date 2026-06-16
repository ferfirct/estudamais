import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from './errorHandler.js';
import type { AuthRequest } from './auth.js';

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Token de autenticação não fornecido.');
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { sub: string; role?: string };
    if (payload.role !== 'admin') throw new HttpError(403, 'Acesso negado. Apenas administradores.');
    req.userId = payload.sub;
    req.userRole = 'admin';
    next();
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, 'Token inválido ou expirado.');
  }
}

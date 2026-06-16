import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from './errorHandler.js';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: 'user' | 'admin';
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Token de autenticação não fornecido.');
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; role?: string };
    req.userId = payload.sub;
    req.userRole = (payload.role as 'user' | 'admin') ?? 'user';
    next();
  } catch {
    throw new HttpError(401, 'Token inválido ou expirado.');
  }
}

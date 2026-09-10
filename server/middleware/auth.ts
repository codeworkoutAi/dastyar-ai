import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'chatbox-secret-key-123') {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Security] FATAL: JWT_SECRET must be explicitly configured with a secure key in production!');
      throw new Error('JWT_SECRET is required and must not be default in production');
    }
    return 'chatbox-secret-key-123';
  }
  return secret;
};

export const JWT_SECRET = getJwtSecret();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  // We assume requireAuth is called before this, so req.user exists
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'عدم دسترسی. این بخش فقط برای مدیران است.' });
  }
  next();
}

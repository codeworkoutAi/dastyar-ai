import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';
export { JWT_SECRET };

export interface TelegramAuthSession {
  token: string;
  status: 'pending' | 'authenticated' | 'expired';
  jwtToken?: string;
  user?: any;
  createdAt: number;
}

export const telegramAuthSessions = new Map<string, TelegramAuthSession>();

// Cleanup sessions older than 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of telegramAuthSessions.entries()) {
    if (now - session.createdAt > 10 * 60 * 1000) {
      telegramAuthSessions.delete(token);
    }
  }
}, 5 * 60 * 1000);

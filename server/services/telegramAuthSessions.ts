import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'chatbox-secret-key-123';

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

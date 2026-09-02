import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// In-Memory Response Cache for normalized identical queries (TTL: 1 hour)

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Nginx / Cloud Run) for accurate IP resolution
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiter for test benchmark endpoint to prevent API quota drain and abuse


import modelsRouter from './routes/models';
import chatRouter from './routes/chat';
import toolsRouter from './routes/tools';
import intentRouter from './routes/intent';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';

import { initializeSchema } from './db/schema';
// Initialize SQLite tables
initializeSchema();

app.use('/', modelsRouter);
app.use('/', chatRouter);
app.use('/', toolsRouter);
app.use('/', intentRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Persian AI Chatbox Server running on http://localhost:${PORT}`);
  });
}

start();

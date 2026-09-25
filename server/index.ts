import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';

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

// Security: Disable X-Powered-By header to prevent fingerprinting
app.disable('x-powered-by');

// Trust reverse proxy (Nginx / Cloud Run / Render) for accurate IP resolution
app.set('trust proxy', 1);

// Generate nonce for inline scripts
// Generate nonce for inline scripts (Disabled to allow unsafe-inline for Google Login)
// app.use((req, res, next) => {
//   res.locals.nonce = crypto.randomBytes(16).toString('base64');
//   next();
// });

// Security Headers Middleware (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",  // Google Identity Services uses inline scripts in popup
        "https://accounts.google.com/",
        "https://accounts.gstatic.com/"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'", "data:", "blob:", "https:",
      ],
      connectSrc: [
        "'self'", "ws:", "wss:", 
        "https://api.groq.com", 
        "https://generativelanguage.googleapis.com",
        "https://api.openai.com",
        "https://api.anthropic.com",
        "https://api.openrouter.ai",
        "https://accounts.google.com/",
        "https://oauth2.googleapis.com/",
        "https://www.googleapis.com/"
      ],
      frameSrc: [
        "'self'", 
        "https://accounts.google.com/"
      ],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.WEB_URL || 'https://dastyarai.com', 'http://localhost', 'capacitor://localhost']
    : ['http://localhost:3000', 'http://localhost', 'capacitor://localhost'],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiter for test benchmark endpoint to prevent API quota drain and abuse


import modelsRouter from './routes/models';
import chatRouter from './routes/chat';
import toolsRouter from './routes/tools';
import intentRouter from './routes/intent';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import storeRouter from './routes/store';
import newsRouter from './routes/news';
import landingRouter from './routes/landing';
import { initNewsCron } from './services/newsCron';
import { startTelegramBot } from './telegram/bot';
import { sitemapHandler } from './seo/sitemap';
import { renderHtmlWithSeo } from './seo/htmlInjector';
import { initializeSchema } from './db/schema';
import db from './db/database';

// Initialize SQLite tables
initializeSchema();

// Start Background Services
initNewsCron();

app.use('/', modelsRouter);
app.use('/', chatRouter);
app.use('/', toolsRouter);
app.use('/', intentRouter);
app.use('/api', landingRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/store', storeRouter);
app.use('/api/news', newsRouter);

app.get('/api/public-settings', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('ui_style') as { value: string } | undefined;
    res.json({ ui_style: row?.value || 'neumorphic' });
  } catch (err) {
    res.json({ ui_style: 'neumorphic' });
  }
});

app.get('/robots.txt', (req, res) => {
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const host = req.get('host');
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /api/auth/
Disallow: /store?tab=dashboard

# AI & LLM Search Engine Crawlers (GEO Optimization)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${protocol}://${host}/sitemap.xml
`);
});

app.get('/sitemap.xml', sitemapHandler);

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/server/data/**', '**/*.db', '**/*.db-*', '**/*.sqlite*']
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      index: false,
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('sw.js') || filePath.endsWith('manifest.webmanifest')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('*', (req, res) => {
      renderHtmlWithSeo(req, res, distPath);
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Persian AI Chatbox Server running on http://localhost:${PORT}`);
    startTelegramBot();
  });
}

start();

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';

dotenv.config();

// In-Memory Response Cache for normalized identical queries (TTL: 1 hour)

// Tracks whether app.listen() has succeeded. Before that point the process cannot serve
// anything, so an uncaught exception means startup is dead: swallowing it leaves a
// zombie process alive with no bound port, and Render then burns the full 15-minute
// health-check window before reporting "Port scan timeout reached, no open ports
// detected" with no clue as to why. Exiting immediately turns that silent hang into an
// explicit crash with the real stack trace. After the server is listening we keep the
// original log-and-continue behaviour so one bad chat stream cannot take the site down.
let serverListening = false;

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
  if (!serverListening) {
    console.error('[Server] FATAL: exception during startup, exiting so the failure is visible.');
    process.exit(1);
  }
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
  if (!serverListening) {
    console.error('[Server] FATAL: rejection during startup, exiting so the failure is visible.');
    process.exit(1);
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Remove trailing slashes (except for root '/')
app.use((req, res, next) => {
  if (req.path.endsWith('/') && req.path.length > 1) {
    const query = req.url.slice(req.path.length);
    res.redirect(301, req.path.slice(0, -1) + query);
  } else {
    next();
  }
});

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
        "https://accounts.gstatic.com/",
        "https://www.googletagmanager.com",
        "https://*.googletagmanager.com"
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
        "https://www.googleapis.com/",
        "https://www.google-analytics.com",
        "https://analytics.google.com",
        "https://*.google-analytics.com",
        "https://*.googletagmanager.com"
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
const allowedOrigins = [
  'https://dastyarai.com',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  'http://localhost:3000',
  process.env.WEB_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiter for test benchmark endpoint to prevent API quota drain and abuse


import modelsRouter, { markStartupReady } from './routes/models';
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

console.log("HELLO RENDER - NODE STARTED SUCCESSFULLY");


// NOTE: initializeSchema() / initNewsCron() deliberately run AFTER app.listen().
// Everything above this line runs at import time, and the libsql embedded-replica
// constructor performs its initial remote sync synchronously. On a fresh container
// with an empty local replica that download can take many minutes, which leaves the
// process alive but not listening -> Render reports "Port scan timeout reached, no
// open ports detected" and fails the deploy after 15 minutes. See AGENTS.md rule 23.
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

app.get('/llms.txt', (req, res) => {
  const filePath = path.join(process.cwd(), process.env.NODE_ENV === 'production' ? 'dist' : 'public', 'llms.txt');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.sendFile(filePath);
  }
  res.status(404).type('text/plain').send('File not found');
});

app.get('/ai-catalog.json', (req, res) => {
  const filePath = path.join(process.cwd(), process.env.NODE_ENV === 'production' ? 'dist' : 'public', 'ai-catalog.json');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.sendFile(filePath);
  }
  res.status(404).json({ error: 'Catalog not found' });
});

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
        } else if (filePath.match(/\.(js|css|woff2?|png|jpe?g|gif|webp|svg)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      // Do not serve HTML for missing static files (prevent MIME type errors on crawlers)
      if (req.path.match(/\.(js|css|json|txt|xml|woff2?|png|jpe?g|gif|webp|svg|ico)$/i)) {
        return res.status(404).type('text/plain').send('Not found');
      }
      renderHtmlWithSeo(req, res, distPath);
    });
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    serverListening = true;
    markStartupReady();
    console.log(`Persian AI Chatbox Server running on http://localhost:${PORT}`);
    console.log('[Startup] Listening. Health check is live; initialising database next.');

    // Deferred startup work, run on a macrotask so the port starts accepting and
    // SERVING requests first. This matters: the libsql replica handshake is a blocking
    // native call, so doing it inline here would freeze the event loop and the health
    // check would still time out even though the port is bound.
    setTimeout(() => {
      try {
        initializeSchema();
      } catch (schemaErr: any) {
        console.error('[Startup] FATAL: initializeSchema() failed:', schemaErr);
      }
      try {
        initNewsCron();
      } catch (cronErr: any) {
        console.error('[Startup] FATAL: initNewsCron() failed:', cronErr);
      }

      try {
        startTelegramBot();
      } catch (tgErr: any) {
        console.error('[Startup] Telegram bot failed to start:', tgErr);
      }
      console.log('[Startup] Ready.');
    }, 0);
  });

  server.on('error', (err: any) => {
    console.error(`[Startup] FATAL: could not bind port ${PORT}:`, err?.message || err);
    process.exit(1);
  });
}

start();

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
import storeRouter from './routes/store';
import newsRouter from './routes/news';
import { startTelegramBot } from './telegram/bot';
import { initNewsCron } from './services/newsCron';

import { initializeSchema } from './db/schema';
import db from './db/database';
// Initialize SQLite tables
initializeSchema();
initNewsCron();

app.use('/', modelsRouter);
app.use('/', chatRouter);
app.use('/', toolsRouter);
app.use('/', intentRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/store', storeRouter);
app.use('/api/news', newsRouter);

app.get('/robots.txt', (req, res) => {
  const protocol = req.protocol === 'https' ? 'https' : 'http';
  const host = req.get('host');
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${protocol}://${host}/sitemap.xml`);
});

app.get('/sitemap.xml', (req, res) => {
  try {
    const protocol = req.protocol === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    const staticPages = ['/', '/blog', '/store'];
    for (const page of staticPages) {
      xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${page === '/' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    }

    // Dynamic Blog pages
    const news = db.prepare('SELECT id, createdAt, tags FROM news ORDER BY createdAt DESC').all() as any[];
    const allTags = new Set<string>();
    
    for (const item of news) {
      const date = item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/blog/${item.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      
      // Collect tags
      if (item.tags) {
        try {
          const parsedTags = JSON.parse(item.tags);
          if (Array.isArray(parsedTags)) {
            parsedTags.forEach(t => allTags.add(t));
          }
        } catch (e) {}
      }
    }

    // Tag pages
    for (const tag of allTags) {
      xml += `  <url>\n    <loc>${baseUrl}/blog/tag/${encodeURIComponent(tag)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    // Dynamic Store pages
    const products = db.prepare('SELECT id, createdAt FROM products ORDER BY createdAt DESC').all() as any[];
    for (const item of products) {
      const date = item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/store/${item.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).end();
  }
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
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Persian AI Chatbox Server running on http://localhost:${PORT}`);
    startTelegramBot();
  });
}

start();

import express from 'express';
import fs from 'fs';
import path from 'path';
import db, { syncDatabase } from '../db/database';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { bot } from '../telegram/bot';
import { clearSitemapCache } from '../seo/sitemap';

const router = express.Router();

// GET /api/news (Public: List all news)
router.get('/', (req, res) => {
  try {
    const news = db.prepare('SELECT * FROM news ORDER BY id DESC').all();
    res.json(news);
  } catch (error) {
    console.error('[News API] Error fetching news:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست اخبار' });
  }
});

// GET /api/news/tag/:tag (Public: Get news by tag)
router.get('/tag/:tag', (req, res) => {
  try {
    const { tag } = req.params;
    const news = db.prepare('SELECT * FROM news WHERE tags LIKE ? ORDER BY id DESC').all(`%"${tag}"%`);
    res.json(news);
  } catch (error) {
    console.error('[News API] Error fetching news by tag:', error);
    res.status(500).json({ error: 'خطا در دریافت اخبار بر اساس تگ' });
  }
});

// GET /api/news/:id (Public: Get single news)
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'خبر پیدا نشد' });
    }
    res.json(item);
  } catch (error) {
    console.error('[News API] Error fetching news item:', error);
    res.status(500).json({ error: 'خطای سرور' });
  }
});

import { sendNewsToTelegram } from '../services/newsCron';

// POST /api/news (Admin: Create news and broadcast to Telegram)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, content, image, tags, rebroadcastTelegram } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'عنوان و متن خبر الزامی است' });
    }

    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' && tags ? tags : '[]');
    const insertStmt = db.prepare('INSERT INTO news (title, content, image, tags) VALUES (?, ?, ?, ?)');
    const info = insertStmt.run(title, content, image || null, tagsJson);
    const newId = Number(info.lastInsertRowid);
    syncDatabase();
    clearSitemapCache();

    // Broadcast to Telegram Channel
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    if (rebroadcastTelegram !== false && bot && channelId) {
      try {
        await sendNewsToTelegram(channelId, bot, {
          id: newId,
          title,
          content,
          image: image || ''
        });
      } catch (tgError) {
        console.error('[News API] Telegram broadcast failed:', tgError);
      }
    }

    res.json({ message: 'خبر با موفقیت منتشر شد', id: newId });
  } catch (error) {
    console.error('[News API] Error creating news:', error);
    res.status(500).json({ error: 'خطا در انتشار خبر' });
  }
});

// PUT /api/news/:id (Admin: Edit news and optional rebroadcast)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image, tags, rebroadcastTelegram } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'عنوان و متن خبر الزامی است' });
    }

    const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'خبر پیدا نشد' });
    }

    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' && tags ? tags : existing.tags || '[]');
    const finalImage = image !== undefined ? (image || null) : existing.image;

    db.prepare('UPDATE news SET title = ?, content = ?, image = ?, tags = ? WHERE id = ?')
      .run(title, content, finalImage, tagsJson, id);
    syncDatabase();
    clearSitemapCache();

    // Broadcast to Telegram Channel if requested
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    if (rebroadcastTelegram && bot && channelId) {
      try {
        await sendNewsToTelegram(channelId, bot, {
          id: Number(id),
          title,
          content,
          image: finalImage || ''
        });
      } catch (tgError) {
        console.error('[News API] Telegram broadcast failed upon edit:', tgError);
      }
    }

    res.json({ message: 'خبر با موفقیت ویرایش شد', id: Number(id) });
  } catch (error) {
    console.error('[News API] Error updating news:', error);
    res.status(500).json({ error: 'خطا در ویرایش خبر' });
  }
});

// DELETE /api/news/:id (Admin: Delete news)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM news WHERE id = ?').run(id);
    syncDatabase();
    clearSitemapCache();
    res.json({ message: 'خبر حذف شد' });
  } catch (error) {
    console.error('[News API] Error deleting news:', error);
    res.status(500).json({ error: 'خطا در حذف خبر' });
  }
});

// GET /api/news/admin/cron-logs (Admin: Get latest bot logs)
router.get('/admin/cron-logs', requireAuth, requireAdmin, (req, res) => {
  try {
    const logPath = path.join(process.cwd(), 'server', 'data', 'news-cron.log');
    if (!fs.existsSync(logPath)) {
      return res.json({ logs: 'هنوز فایلی ثبت نشده است.' });
    }
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.trim().split('\n');
    const recent = lines.slice(-200).join('\n');
    res.json({ logs: recent });
  } catch (error) {
    console.error('[News API] Error reading cron logs:', error);
    res.status(500).json({ error: 'خطا در خواندن فایل لاگ' });
  }
});

export default router;

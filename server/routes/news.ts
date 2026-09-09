import express from 'express';
import fs from 'fs';
import path from 'path';
import db from '../db/database';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { bot } from '../telegram/bot';

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

// POST /api/news (Admin: Create news and broadcast to Telegram)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, content, image } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'عنوان و متن خبر الزامی است' });
    }

    const insertStmt = db.prepare('INSERT INTO news (title, content, image) VALUES (?, ?, ?)');
    const info = insertStmt.run(title, content, image || null);

    // Broadcast to Telegram Channel
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    if (bot && channelId) {
      const baseUrl = process.env.WEB_URL || 'http://localhost:5173';
      const articleUrl = `${baseUrl}/blog`; // We can point to the specific article later if we use routing like /blog/:id
      
      const messageText = `📰 **${title}**\n\n` + 
                          `${content.substring(0, 150)}...\n\n` +
                          `🔗 [مطالعه کامل در سایت](${articleUrl})`;
      
      try {
        if (image) {
          // If image is a base64 string, we might need to handle it differently, 
          // but if it's a URL, sendPhoto works perfectly.
          // For now, assuming base64 or URL, Telegraf handles URLs easily.
          // If it's a massive base64, it might fail. We will just send message for now.
          await bot.telegram.sendMessage(channelId, messageText, { parse_mode: 'Markdown' });
        } else {
          await bot.telegram.sendMessage(channelId, messageText, { parse_mode: 'Markdown' });
        }
      } catch (tgError) {
        console.error('[News API] Telegram broadcast failed:', tgError);
        // Do not throw, just log the error so the news is still created in the DB
      }
    }

    res.json({ message: 'خبر با موفقیت منتشر شد', id: info.lastInsertRowid });
  } catch (error) {
    console.error('[News API] Error creating news:', error);
    res.status(500).json({ error: 'خطا در انتشار خبر' });
  }
});

// DELETE /api/news/:id (Admin: Delete news)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM news WHERE id = ?').run(id);
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

import express from 'express';
import fs from 'fs';
import path from 'path';
import db, { syncDatabase } from '../db/database';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { bot } from '../telegram/bot';
import { clearSitemapCache } from '../seo/sitemap';
import { sendNewsToTelegram } from '../services/newsCron';
import { optimizeImageToWebpDataUrl } from '../services/utils';

const router = express.Router();

// ALL /api/news/cron-trigger (External Cron webhook for cron-job.org or monitoring)
// Must be defined BEFORE /:id so Express doesn't treat 'cron-trigger' as a news article ID
router.all('/cron-trigger', async (req, res) => {
  try {
    const { fetchAndProcessNews } = await import('../services/newsCron');
    fetchAndProcessNews().catch(err => console.error('[News API] cron-trigger background error:', err));
    res.json({ status: 'ok', message: 'عملیات واکشی و انتشار اخبار هوش مصنوعی آغاز شد.' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'خطا در فعال‌سازی واکشی اخبار' });
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

// POST /api/news/admin/trigger (Admin: Trigger immediate news fetch)
router.post('/admin/trigger', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { fetchAndProcessNews } = await import('../services/newsCron');
    await fetchAndProcessNews();
    res.json({ message: 'فرآیند واکشی اخبار با موفقیت اجرا شد و در وبلاگ و کانال تلگرام قرار گرفت.' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'خطا در اجرای واکشی' });
  }
});

// POST /api/news/admin/generate-guide (Admin: Generate AI Educational Guide)
router.post('/admin/generate-guide', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { topic } = req.body || {};
    const { generateEducationalGuide } = await import('../services/guideGenerator');
    const result = await generateEducationalGuide(topic);
    res.json({
      success: true,
      guide: result
    });
  } catch (error: any) {
    console.error('[News API] Error generating educational guide:', error);
    res.status(500).json({ error: error?.message || 'خطا در تولید مقاله هوشمند' });
  }
});

// GET /api/news (Public: List all news)
router.get('/', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const news = db.prepare('SELECT * FROM news ORDER BY id DESC').all();
    res.json(news);
  } catch (error) {
    console.error('[News API] Error fetching news:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست اخبار' });
  }
});

// Helper to normalize and ensure proper JSON tags
function normalizeTagsArray(rawTags: any, defaultSource?: string): string[] {
  let list: string[] = [];
  if (Array.isArray(rawTags)) {
    list = rawTags.map(t => String(t).trim()).filter(Boolean);
  } else if (typeof rawTags === 'string' && rawTags.trim()) {
    const trimmed = rawTags.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr)) {
          list = arr.map(t => String(t).trim()).filter(Boolean);
        }
      } catch {}
    }
    if (list.length === 0) {
      list = trimmed.split(/[,،\n]+/).map(t => t.trim()).filter(Boolean);
    }
  }

  if (defaultSource === 'guide') {
    if (!list.includes('مقالات آموزشی')) list.unshift('مقالات آموزشی');
    if (!list.includes('آموزش')) list.splice(1, 0, 'آموزش');
  }

  return Array.from(new Set(list));
}

// GET /api/news/tag/:tag (Public: Get news by tag)
router.get('/tag/:tag', (req, res) => {
  try {
    const { tag } = req.params;
    let news: any[];
    if (tag === 'مقالات آموزشی' || tag === 'آموزش' || tag === 'guide') {
      news = db.prepare("SELECT * FROM news WHERE source = 'guide' OR tags LIKE '%\"مقالات آموزشی\"%' OR tags LIKE '%\"آموزش\"%' OR tags LIKE '%آموزش%' ORDER BY id DESC").all();
    } else if (tag === 'news' || tag === 'اخبار') {
      news = db.prepare("SELECT * FROM news WHERE (source = 'cron' OR tags LIKE '%\"news\"%' OR tags LIKE '%\"اخبار\"%') AND (source != 'guide') ORDER BY id DESC").all();
    } else {
      news = db.prepare('SELECT * FROM news WHERE tags LIKE ? OR tags LIKE ? ORDER BY id DESC').all(`%"${tag}"%`, `%${tag}%`);
    }
    res.json(news);
  } catch (error) {
    console.error('[News API] Error fetching news by tag:', error);
    res.status(500).json({ error: 'خطا در دریافت اخبار بر اساس تگ' });
  }
});

// GET /api/news/:id (Public: Get single news - numeric ID or slug)
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let item: any;
    if (/^\d+$/.test(id)) {
      item = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
    } else {
      item = db.prepare('SELECT * FROM news WHERE slug = ?').get(id);
    }
    if (!item) {
      return res.status(404).json({ error: 'خبر پیدا نشد' });
    }
    res.json(item);
  } catch (error) {
    console.error('[News API] Error fetching news item:', error);
    res.status(500).json({ error: 'خطای سرور' });
  }
});

function getDefaultNewsCoverDataUrl(): string | null {
  try {
    const coverPath = path.join(process.cwd(), 'public', 'default-news-cover.webp');
    if (fs.existsSync(coverPath)) {
      const b64 = fs.readFileSync(coverPath).toString('base64');
      return `data:image/webp;base64,${b64}`;
    }
  } catch (e) {
    console.warn('[News API] Failed to load default news cover data URL:', e);
  }
  return null;
}

// POST /api/news (Admin: Create news and broadcast to Telegram)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, content, image, tags, slug, source, rebroadcastTelegram } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'عنوان و متن خبر الزامی است' });
    }

    let finalImage = image || null;
    if (finalImage) {
      try {
        const webp = await optimizeImageToWebpDataUrl(finalImage, 800, 75);
        if (webp) finalImage = webp;
      } catch (e) {
        console.warn('[News API] WebP conversion failed, saving raw image:', e);
      }
    } else {
      finalImage = getDefaultNewsCoverDataUrl();
      console.log('[News] manual news without image, using default cover');
    }

    const isEducational = source === 'guide' || (typeof tags === 'string' && (tags.includes('آموزش') || tags.includes('مقالات آموزشی')));
    const postSource = isEducational ? 'guide' : (source === 'news' ? 'cron' : (source || 'manual'));
    const finalTags = normalizeTagsArray(tags, postSource);
    const tagsJson = JSON.stringify(finalTags);

    const finalSlug = (slug || '')
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '') || (postSource === 'guide' ? `guide-${Date.now()}` : `post-${Date.now()}`);

    const insertStmt = db.prepare('INSERT INTO news (title, content, image, tags, source, slug) VALUES (?, ?, ?, ?, ?, ?)');
    const info = insertStmt.run(title, content, finalImage, tagsJson, postSource, finalSlug);
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
          image: finalImage || ''
        });
      } catch (tgError) {
        console.error('[News API] Telegram broadcast failed:', tgError);
      }
    }

    res.json({ message: 'مطلب با موفقیت منتشر شد', id: newId, slug: finalSlug, source: postSource });
  } catch (error) {
    console.error('[News API] Error creating news:', error);
    res.status(500).json({ error: 'خطا در انتشار مطلب' });
  }
});

// PUT /api/news/:id (Admin: Edit news and optional rebroadcast)
router.put('/:id(\\d+)', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image, tags, slug, source, rebroadcastTelegram, imageManuallyCleared } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'عنوان و متن خبر الزامی است' });
    }

    const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'خبر پیدا نشد' });
    }

    const isEducational = source === 'guide' || (typeof tags === 'string' && (tags.includes('آموزش') || tags.includes('مقالات آموزشی')));
    const postSource = isEducational ? 'guide' : (source || existing.source || 'manual');
    const finalTags = normalizeTagsArray(tags !== undefined ? tags : existing.tags, postSource);
    const tagsJson = JSON.stringify(finalTags);

    let finalImage = image !== undefined ? (image || null) : existing.image;
    if (imageManuallyCleared === true) {
      finalImage = null;
    } else if (finalImage && finalImage !== existing.image) {
      try {
        const webp = await optimizeImageToWebpDataUrl(finalImage, 800, 75);
        if (webp) finalImage = webp;
      } catch (e) {
        console.warn('[News API] WebP conversion failed on update, saving raw image:', e);
      }
    } else if (!finalImage) {
      finalImage = getDefaultNewsCoverDataUrl();
      console.log('[News] manual news without image, using default cover');
    }

    const finalSlug = (slug !== undefined ? slug : existing.slug) || (postSource === 'guide' ? `guide-${id}` : `post-${id}`);

    db.prepare('UPDATE news SET title = ?, content = ?, image = ?, tags = ?, source = ?, slug = ? WHERE id = ?')
      .run(title, content, finalImage, tagsJson, postSource, finalSlug, id);
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
router.delete('/:id(\\d+)', requireAuth, requireAdmin, (req, res) => {
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

export default router;

import express from 'express';
import db from '../db/database';

let sitemapCache: { xml: string; expires: number } | null = null;
export const SITEMAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function clearSitemapCache() {
  sitemapCache = null;
}

const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

const safeDate = (val: any): string => {
  if (!val) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

export const sitemapHandler = (req: express.Request, res: express.Response) => {
  try {
    const now = Date.now();
    if (sitemapCache && now < sitemapCache.expires) {
      res.header('Content-Type', 'application/xml');
      return res.send(sitemapCache.xml);
    }

    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = process.env.NODE_ENV === 'production'
      ? (process.env.WEB_URL || 'https://dastyarai.com').replace(/\/$/, '')
      : `${protocol}://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // 1. Static Core Pages
    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/store', priority: '1.0', changefreq: 'daily' },
      { path: '/blog', priority: '0.9', changefreq: 'daily' },
      { path: '/blog/news', priority: '0.7', changefreq: 'daily' },
      { path: '/about', priority: '0.8', changefreq: 'monthly' },
      { path: '/contact', priority: '0.8', changefreq: 'monthly' },
      { path: '/ai-assistant', priority: '0.9', changefreq: 'weekly' },
    ];
    for (const page of staticPages) {
      xml += `  <url>\n    <loc>${escapeXml(baseUrl + page.path)}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    // 2. Dynamic Store Products
    try {
      const storeProducts = db.prepare("SELECT id, title, bannerImage, image, createdAt FROM products WHERE status = 'active' OR status IS NULL ORDER BY id DESC").all() as any[];
      for (const p of storeProducts) {
        const date = safeDate(p.createdAt);
        xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}/store/product/${p.id}`)}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n`;
        const pImg = p.bannerImage || p.image;
        if (pImg && typeof pImg === 'string' && !pImg.startsWith('data:')) {
          const imgUrl = pImg.startsWith('http') ? pImg : `${baseUrl}${pImg}`;
          xml += `    <image:image>\n      <image:loc>${escapeXml(imgUrl)}</image:loc>\n      <image:title><![CDATA[${p.title || ''}]]></image:title>\n    </image:image>\n`;
        }
        xml += `  </url>\n`;
      }
    } catch (prodErr) {
      console.error('[Sitemap] Error fetching products:', prodErr);
    }

    // 3. Dynamic Blog Pages & Tags
    try {
      const news = db.prepare('SELECT id, title, image, createdAt, tags, slug FROM news ORDER BY createdAt DESC').all() as any[];
      const allTags = new Set<string>();

      for (const item of news) {
        let isCronNews = false;
        if (item.tags) {
          try {
            const parsed = JSON.parse(item.tags);
            if (Array.isArray(parsed) && parsed.some((t: string) => typeof t === 'string' && t.toLowerCase() === 'news')) {
              isCronNews = true;
            }
          } catch (e) {}
        }
        const itemPriority = isCronNews ? '0.4' : '0.8';
        const date = safeDate(item.createdAt);
        const postPath = item.slug ? `/blog/${item.slug}` : `/blog/${item.id}`;
        xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}${postPath}`)}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${itemPriority}</priority>\n`;
        if (item.image && typeof item.image === 'string' && !item.image.startsWith('data:')) {
          const imgUrl = item.image.startsWith('http') ? item.image : `${baseUrl}${item.image}`;
          xml += `    <image:image>\n      <image:loc>${escapeXml(imgUrl)}</image:loc>\n      <image:title><![CDATA[${item.title || ''}]]></image:title>\n    </image:image>\n`;
        }
        xml += `  </url>\n`;

        // Collect tags
        if (item.tags) {
          try {
            const parsedTags = JSON.parse(item.tags);
            if (Array.isArray(parsedTags)) {
              parsedTags.forEach(t => {
                if (typeof t === 'string' && t.trim()) allTags.add(t.trim());
              });
            }
          } catch (e) { }
        }
      }

      // 4. Tag Archive Pages
      for (const tag of allTags) {
        xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}/blog/tag/${encodeURIComponent(tag)}`)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      }
    } catch (newsErr) {
      console.error('[Sitemap] Error fetching news:', newsErr);
    }

    xml += `</urlset>`;

    sitemapCache = { xml, expires: now + SITEMAP_CACHE_TTL };

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error('[Sitemap] Error generating sitemap, returning fallback:', err);
    // Bulletproof fallback: Never return 500 to search engines
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = process.env.NODE_ENV === 'production'
      ? (process.env.WEB_URL || 'https://dastyarai.com').replace(/\/$/, '')
      : `${protocol}://${host}`;

    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/blog</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/store</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
</urlset>`;
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(fallbackXml);
  }
};

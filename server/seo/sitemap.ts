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

export const sitemapHandler = (req: express.Request, res: express.Response) => {
  try {
    const now = Date.now();
    if (sitemapCache && now < sitemapCache.expires) {
      res.header('Content-Type', 'application/xml');
      return res.send(sitemapCache.xml);
    }

    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // Static pages
    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/blog', priority: '0.9', changefreq: 'daily' },
      { path: '/store', priority: '0.9', changefreq: 'daily' },
    ];
    for (const page of staticPages) {
      xml += `  <url>\n    <loc>${escapeXml(baseUrl + page.path)}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    // Dynamic Store Products
    const storeProducts = db.prepare('SELECT id, title, bannerImage, image FROM products').all() as any[];
    for (const p of storeProducts) {
      const today = new Date().toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}/store/product/${p.id}`)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n`;
      const pImg = p.bannerImage || p.image;
      if (pImg && !pImg.startsWith('data:')) {
        const imgUrl = pImg.startsWith('http') ? pImg : `${baseUrl}${pImg}`;
        xml += `    <image:image>\n      <image:loc>${escapeXml(imgUrl)}</image:loc>\n      <image:title><![CDATA[${p.title || ''}]]></image:title>\n    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }

    // Dynamic Blog pages
    const news = db.prepare('SELECT id, title, image, createdAt, updatedAt, tags FROM news ORDER BY createdAt DESC').all() as any[];
    const allTags = new Set<string>();

    for (const item of news) {
      const date = item.updatedAt 
        ? new Date(item.updatedAt).toISOString().split('T')[0]
        : (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}/blog/${item.id}`)}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n`;
      if (item.image && !item.image.startsWith('data:')) {
        const imgUrl = item.image.startsWith('http') ? item.image : `${baseUrl}${item.image}`;
        xml += `    <image:image>\n      <image:loc>${escapeXml(imgUrl)}</image:loc>\n      <image:title><![CDATA[${item.title || ''}]]></image:title>\n    </image:image>\n`;
      }
      xml += `  </url>\n`;

      // Collect tags
      if (item.tags) {
        try {
          const parsedTags = JSON.parse(item.tags);
          if (Array.isArray(parsedTags)) {
            parsedTags.forEach(t => allTags.add(t));
          }
        } catch (e) { }
      }
    }

    // Tag pages
    for (const tag of allTags) {
      xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}/blog/tag/${encodeURIComponent(tag)}`)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    // Dynamic Store pages
    const products = db.prepare('SELECT id, title, image, bannerImage, createdAt, updatedAt FROM products ORDER BY createdAt DESC').all() as any[];
    for (const item of products) {
      const date = item.updatedAt 
        ? new Date(item.updatedAt).toISOString().split('T')[0]
        : (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}/store/${item.id}`)}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n`;
      const prodImg = item.bannerImage || item.image;
      if (prodImg && !prodImg.startsWith('data:')) {
        const imgUrl = prodImg.startsWith('http') ? prodImg : `${baseUrl}${prodImg}`;
        xml += `    <image:image>\n      <image:loc>${escapeXml(imgUrl)}</image:loc>\n      <image:title><![CDATA[${item.title || ''}]]></image:title>\n    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    sitemapCache = { xml, expires: now + SITEMAP_CACHE_TTL };

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).end();
  }
};

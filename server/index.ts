import express from 'express';
import path from 'path';
import fs from 'fs';
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

// Security: Disable X-Powered-By header to prevent fingerprinting
app.disable('x-powered-by');

// Trust reverse proxy (Nginx / Cloud Run / Render) for accurate IP resolution
app.set('trust proxy', 1);

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

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

app.get('/sitemap.xml', (req, res) => {
  try {
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
      xml += `  <url>\n    <loc>${baseUrl}${page.path}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    // Dynamic Blog pages
    const news = db.prepare('SELECT id, title, image, createdAt, tags FROM news ORDER BY createdAt DESC').all() as any[];
    const allTags = new Set<string>();

    for (const item of news) {
      const date = item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/blog/${item.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n`;
      if (item.image) {
        const imgUrl = item.image.startsWith('http') ? item.image : `${baseUrl}${item.image}`;
        xml += `    <image:image>\n      <image:loc>${imgUrl}</image:loc>\n      <image:title><![CDATA[${item.title || ''}]]></image:title>\n    </image:image>\n`;
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
      xml += `  <url>\n    <loc>${baseUrl}/blog/tag/${encodeURIComponent(tag)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    // Dynamic Store pages
    const products = db.prepare('SELECT id, title, image, bannerImage, createdAt FROM products ORDER BY createdAt DESC').all() as any[];
    for (const item of products) {
      const date = item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/store/${item.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n`;
      const prodImg = item.bannerImage || item.image;
      if (prodImg) {
        const imgUrl = prodImg.startsWith('http') ? prodImg : `${baseUrl}${prodImg}`;
        xml += `    <image:image>\n      <image:loc>${imgUrl}</image:loc>\n      <image:title><![CDATA[${item.title || ''}]]></image:title>\n    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).end();
  }
});

function escapeHtml(str?: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderHtmlWithSeo(req: express.Request, res: express.Response, distPath: string) {
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  try {
    let html = fs.readFileSync(indexPath, 'utf-8');
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const urlPath = req.path;

    let pageTitle = 'دستیار هوشمند | چت با هوش مصنوعی رایگان، فارسی و پیشرفته';
    let pageDesc = 'چت‌باکس هوش مصنوعی فارسی با پشتیبانی از مدل‌های برتر (ChatGPT, Claude, Gemini)، جستجوی زنده وب، تولید تصویر، مجله اخبار هوش مصنوعی و فروشگاه اختصاصی.';
    let pageImage = `${baseUrl}/pwa-512x512.png`;
    let pageType = 'website';
    let canonicalUrl = `${baseUrl}${urlPath}`;
    let structuredData: any = null;

    let extraMetaTags = '';

    // Check /blog/:id
    const blogMatch = urlPath.match(/^\/blog\/(\d+)$/);
    if (blogMatch) {
      const blogId = blogMatch[1];
      const post = db.prepare('SELECT * FROM news WHERE id = ?').get(blogId) as any;
      if (post) {
        pageTitle = `${post.title} | مجله هوش مصنوعی`;
        const rawText = (post.content || '').replace(/[#*`_\[\]()\-!>]/g, '').trim();
        pageDesc = rawText.slice(0, 160) || pageDesc;
        if (post.image) {
          pageImage = post.image.startsWith('http') ? post.image : `${baseUrl}${post.image}`;
        }
        pageType = 'article';

        let parsedKeywords: string[] = [];
        if (post.tags) {
          try {
            const parsed = JSON.parse(post.tags);
            if (Array.isArray(parsed)) parsedKeywords = parsed;
          } catch {}
        }

        const tagsMeta = parsedKeywords.map(k => `  <meta property="article:tag" content="${escapeHtml(k)}" />`).join('\n');
        extraMetaTags += `\n  <meta property="article:published_time" content="${escapeHtml(post.createdAt)}" />\n  <meta property="article:modified_time" content="${escapeHtml(post.createdAt)}" />\n  <meta property="article:author" content="دستیار هوشمند" />\n${tagsMeta}`;

        structuredData = {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: post.title,
              description: pageDesc,
              image: [pageImage],
              datePublished: post.createdAt,
              dateModified: post.createdAt,
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': canonicalUrl
              },
              keywords: parsedKeywords.length > 0 ? parsedKeywords.join(', ') : 'هوش مصنوعی, اخبار فناوری',
              inLanguage: 'fa-IR',
              author: {
                '@type': 'Organization',
                name: 'دستیار هوشمند'
              },
              publisher: {
                '@type': 'Organization',
                name: 'دستیار هوشمند',
                logo: {
                  '@type': 'ImageObject',
                  url: `${baseUrl}/pwa-512x512.png`
                }
              }
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'خانه', item: `${baseUrl}/` },
                { '@type': 'ListItem', position: 2, name: 'مجله هوش مصنوعی', item: `${baseUrl}/blog` },
                { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl }
              ]
            }
          ]
        };
      }
    } else if (urlPath.startsWith('/blog/tag/')) {
      const rawTag = decodeURIComponent(urlPath.replace('/blog/tag/', ''));
      const tag = rawTag.replace(/[<>"'`;()]/g, '').trim().slice(0, 80);
      pageTitle = `مقالات برچسب ${tag} | مجله هوش مصنوعی`;
      pageDesc = `مجموعه اخبار و مقالات آموزشی هوش مصنوعی مرتبط با ${tag} در مجله هوش مصنوعی دستیار هوشمند.`;
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: pageTitle,
        description: pageDesc,
        url: canonicalUrl
      };
    } else if (urlPath === '/blog') {
      pageTitle = 'مجله و اخبار هوش مصنوعی | تازه‌ترین رویدادها، مدل‌ها و آموزش‌ها';
      pageDesc = 'آخرین اخبار دنیای هوش مصنوعی، بررسی مدل‌های جدید زبان طبیعی، مقالات و آموزش‌های تخصصی هوش مصنوعی به زبان فارسی.';
      structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Blog',
            name: 'مجله و اخبار هوش مصنوعی دستیار هوشمند',
            description: pageDesc,
            url: canonicalUrl,
            inLanguage: 'fa-IR',
            publisher: {
              '@type': 'Organization',
              name: 'دستیار هوشمند',
              logo: { '@type': 'ImageObject', url: `${baseUrl}/pwa-512x512.png` }
            }
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'خانه', item: `${baseUrl}/` },
              { '@type': 'ListItem', position: 2, name: 'مجله هوش مصنوعی', item: canonicalUrl }
            ]
          }
        ]
      };
    } else {
      // Check /store/:id
      const storeMatch = urlPath.match(/^\/store\/(\d+)$/);
      if (storeMatch) {
        const prodId = storeMatch[1];
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(prodId) as any;
        if (product) {
          pageTitle = `خرید ${product.title} | فروشگاه هوش مصنوعی`;
          const priceText = product.price ? `${product.price.toLocaleString('fa-IR')} تومان` : 'رایگان';
          pageDesc = `خرید آنلاین ${product.title} - قیمت: ${priceText}. تحویل فوری و پشتیبانی آنلاین در دستیار هوشمند.`;
          const prodImg = product.bannerImage || product.image;
          if (prodImg) {
            pageImage = prodImg.startsWith('http') ? prodImg : `${baseUrl}${prodImg}`;
          }
          pageType = 'product';

          const priceRials = (product.price || 0) * 10;
          extraMetaTags += `\n  <meta property="product:price:amount" content="${priceRials}" />\n  <meta property="product:price:currency" content="IRR" />\n  <meta property="product:availability" content="in stock" />`;

          structuredData = {
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Product',
                name: product.title,
                description: product.description || product.title,
                image: [pageImage],
                sku: `AI-PROD-${product.id}`,
                brand: {
                  '@type': 'Brand',
                  name: 'دستیار هوشمند'
                },
                offers: {
                  '@type': 'Offer',
                  price: priceRials,
                  priceCurrency: 'IRR',
                  availability: 'https://schema.org/InStock',
                  url: canonicalUrl,
                  seller: {
                    '@type': 'Organization',
                    name: 'دستیار هوشمند'
                  }
                }
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'خانه', item: `${baseUrl}/` },
                  { '@type': 'ListItem', position: 2, name: 'فروشگاه', item: `${baseUrl}/store` },
                  { '@type': 'ListItem', position: 3, name: product.title, item: canonicalUrl }
                ]
              }
            ]
          };
        }
      } else if (urlPath === '/store') {
        pageTitle = 'فروشگاه هوش مصنوعی | خرید اکانت ChatGPT Plus، کلیدهای API و آموزش‌ها';
        pageDesc = 'فروشگاه خدمات و ابزارهای هوش مصنوعی: خرید اکانت پرمیوم ChatGPT Plus، کلیدهای API معتبر و پکیج‌های آموزشی تخصصی با پرداخت ریالی و تحویل فوری.';
        
        const storeProducts = db.prepare('SELECT id, title, price FROM products ORDER BY id DESC LIMIT 12').all() as any[];
        structuredData = {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Store',
              name: 'فروشگاه هوش مصنوعی دستیار هوشمند',
              description: pageDesc,
              url: canonicalUrl,
              image: `${baseUrl}/pwa-512x512.png`,
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'محصولات دیجیتال و اشتراک‌های هوش مصنوعی',
                itemListElement: storeProducts.map(p => ({
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Product',
                    name: p.title,
                    url: `${baseUrl}/store/${p.id}`
                  },
                  price: (p.price || 0) * 10,
                  priceCurrency: 'IRR'
                }))
              }
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'خانه', item: `${baseUrl}/` },
                { '@type': 'ListItem', position: 2, name: 'فروشگاه', item: canonicalUrl }
              ]
            }
          ]
        };
      } else if (urlPath === '/') {
        // Home page FAQPage Schema for GEO / AI Answer Engines
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'آیا چت با هوش مصنوعی در دستیار هوشمند رایگان است؟',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'بله، استفاده از مدل‌های پیشرفته هوش مصنوعی در دستیار هوشمند کاملاً رایگان است و کاربران بدون نیاز به فیلترشکن یا شماره خارجی می‌توانند به گفت‌وگو بپردازند.'
              }
            },
            {
              '@type': 'Question',
              name: 'دستیار هوشمند از چه مدل‌های هوش مصنوعی پشتیبانی می‌کند؟',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'دستیار هوشمند از مدل‌های برتر دنیا نظیر ChatGPT (GPT-4o)، Claude 3.5 Sonnet، Gemini 2.0 Flash و DeepSeek پشتیبانی می‌کند و قابلیت انتخاب دستی یا مسیریابی هوشمند (Smart Routing) را دارد.'
              }
            },
            {
              '@type': 'Question',
              name: 'آیا امکان جستجوی آنلاین در وب و ساخت عکس با هوش مصنوعی وجود دارد؟',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'بله، این پلتفرم مجهز به جستجوی زنده وب (Google Search Grounding) برای دسترسی به اخبار و داده‌های روز و استودیوی تولید تصویر با مدل‌های Flux و Stable Diffusion است.'
              }
            },
            {
              '@type': 'Question',
              name: 'فروشگاه هوش مصنوعی چه خدماتی ارائه می‌دهد؟',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'در فروشگاه دستیار هوشمند، اشتراک‌های قانونی ChatGPT Plus، کلیدهای اختصاصی API و آموزش‌های تخصصی هوش مصنوعی با امکان پرداخت ریالی و تحویل آنی عرضه می‌شوند.'
              }
            }
          ]
        };
      }
    }

    const safeTitle = escapeHtml(pageTitle);
    const safeDesc = escapeHtml(pageDesc);
    const safeCanonical = escapeHtml(canonicalUrl);
    const safeImage = escapeHtml(pageImage);
    const safeType = escapeHtml(pageType);

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${safeTitle}</title>`);

    // Replace Meta Description
    html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${safeDesc}" />`);

    // Replace Canonical
    html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, `<link rel="canonical" href="${safeCanonical}" />`);

    // Replace Open Graph Tags
    html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${safeTitle}" />`);
    html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${safeDesc}" />`);
    html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, `<meta property="og:image" content="${safeImage}" />`);
    html = html.replace(/<meta\s+property="og:type"\s+content=".*?"\s*\/?>/i, `<meta property="og:type" content="${safeType}" />`);

    // Replace Twitter Tags
    html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${safeTitle}" />`);
    html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${safeDesc}" />`);
    html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${safeImage}" />`);

    // Inject Dynamic JSON-LD Schema & extra meta tags
    if (extraMetaTags) {
      html = html.replace('</head>', `${extraMetaTags}\n</head>`);
    }
    if (structuredData) {
      const schemaTag = `\n  <script type="application/ld+json" id="server-injected-schema">\n  ${JSON.stringify(structuredData, null, 2)}\n  </script>\n</head>`;
      html = html.replace('</head>', schemaTag);
    }

    // Defer render-blocking KaTeX CSS using print media onload trick
    html = html.replace(
      /(<link\s+rel="stylesheet"\s+crossorigin\s+href="\/assets\/katex-[^"]+\.css")>/gi,
      `$1 media="print" onload="this.media='all'">`
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('[Server SEO] Error injecting metadata:', err);
    res.sendFile(path.join(distPath, 'index.html'));
  }
}

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

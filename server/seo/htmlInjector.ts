import express from 'express';
import path from 'path';
import fs from 'fs';
import db from '../db/database';

const TEMPLATE_CACHE = new Map<string, string>();
const INTERNAL_NAV_CACHE = new Map<string, { itemsHtml: string; expiresAt: number }>();
const STATIC_HTML_CACHE = new Map<string, { html: string; expiresAt: number }>();

const INTERNAL_NAV_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STATIC_HTML_TTL_MS = 2 * 60 * 1000;  // 2 minutes
const STATIC_SEO_PATHS = new Set(['/', '/landing', '/chat', '/about', '/contact', '/ai-assistant']);

export function invalidateSeoHtmlCache(): void {
  TEMPLATE_CACHE.clear();
  INTERNAL_NAV_CACHE.clear();
  STATIC_HTML_CACHE.clear();
}

function getCachedTemplate(indexPath: string, useCache: boolean): string | null {
  if (useCache && TEMPLATE_CACHE.has(indexPath)) {
    return TEMPLATE_CACHE.get(indexPath)!;
  }
  if (!fs.existsSync(indexPath)) {
    return null;
  }
  const content = fs.readFileSync(indexPath, 'utf-8');
  if (useCache) {
    TEMPLATE_CACHE.set(indexPath, content);
  }
  return content;
}

function getCachedNavItemsHtml(baseUrl: string): string {
  const now = Date.now();
  const cached = INTERNAL_NAV_CACHE.get(baseUrl);
  if (cached && cached.expiresAt > now) {
    return cached.itemsHtml;
  }

  let itemsHtml = '';
  try {
    const topProducts = db.prepare("SELECT id, title FROM products WHERE status = 'active' OR status IS NULL ORDER BY id DESC LIMIT 8").all() as any[];
    const topNews = db.prepare("SELECT id, title FROM news ORDER BY createdAt DESC LIMIT 8").all() as any[];

    const bannedRegex = /(gemini|claude|deepseek|gpt|mistral|بدون کارت بانکی|بدون فیلترشکن)/i;
    const productItems = topProducts
      .filter(p => !bannedRegex.test(p.title || ''))
      .map(p => `<li><a href="${baseUrl}/store/product/${p.id}">خرید ${escapeHtml(p.title)}</a></li>`)
      .join('');
    const newsItems = topNews
      .filter(n => !bannedRegex.test(n.title || ''))
      .map(n => `<li><a href="${baseUrl}/blog/${n.id}">${escapeHtml(n.title)}</a></li>`)
      .join('');
    itemsHtml = `${productItems}${newsItems}`;
    INTERNAL_NAV_CACHE.set(baseUrl, { itemsHtml, expiresAt: now + INTERNAL_NAV_TTL_MS });
  } catch {
    // Return stale cache if DB fails transiently
    if (cached) return cached.itemsHtml;
  }
  return itemsHtml;
}

export function escapeHtml(str?: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function renderHtmlWithSeo(req: express.Request, res: express.Response, distPath: string, vite?: any) {
  const indexPath = path.join(distPath, 'index.html');
  const useProdCache = !vite;

  try {
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = process.env.NODE_ENV === 'production' ? (process.env.WEB_URL || 'https://dastyarai.com') : `${protocol}://${host}`;
    const urlPath = req.path;

    // Anti-cache header helper to prevent stale HTML & stuck caches on mobile / older Android WebViews
    const setHtmlNoCacheHeaders = () => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    };

    // Fast path: serve pre-rendered SEO HTML from RAM for static public routes in production
    if (useProdCache && STATIC_SEO_PATHS.has(urlPath)) {
      const cacheKey = `${baseUrl}|${urlPath}`;
      const cachedPage = STATIC_HTML_CACHE.get(cacheKey);
      if (cachedPage && cachedPage.expiresAt > Date.now()) {
        setHtmlNoCacheHeaders();
        return res.send(cachedPage.html);
      }
    }

    let html = getCachedTemplate(indexPath, useProdCache);
    if (!html) {
      return res.sendFile(indexPath);
    }
    if (vite) {
      try {
        html = await vite.transformIndexHtml(req.originalUrl || req.url, html);
      } catch (viteErr) {
        console.warn('[Server SEO] vite.transformIndexHtml error:', viteErr);
      }
    }

    let pageTitle = 'Dastyar AI | دستیار هوش مصنوعی فارسی — چت، کد، اسناد';
    let pageDesc = 'با Dastyar AI رایگان شروع کنید: چت رایگان و نامحدود با مدل‌های پایه + پرداخت به‌ازای مصرف برای مدل‌های پیشرفته. چت، برنامه‌نویسی، تحلیل اسناد و تصویر به فارسی.';
    let pageImage = `${baseUrl}/pwa-512x512.png`;
    let pageType = 'website';
    let canonicalUrl = `${baseUrl}${urlPath}`;
    let structuredData: any = null;
    let postContent = '';

    let extraMetaTags = '';

    // Check /blog/:id or /blog/:slug
    const blogMatch = urlPath.match(/^\/blog\/([a-zA-Z0-9\-_]+)$/);
    const productMatch = urlPath.match(/^\/store\/product\/(\d+)$/);
    
    if (productMatch) {
      const pId = parseInt(productMatch[1], 10);
      try {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(pId) as any;
        if (product) {
          pageTitle = `خرید ${product.title} | Dastyar AI`;
          pageDesc = product.description || product.title;
          pageType = 'product';
          pageImage = product.bannerImage || product.image || pageImage;
          
          let parsedFaqs = [];
          try { if (product.faqs) parsedFaqs = JSON.parse(product.faqs); } catch (e) {}

          const isAvailable = (product.stock == null || product.stock > 0 || product.category === 'plan' || product.category === 'package') ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
          
          structuredData = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            image: pageImage,
            description: pageDesc,
            sku: `AI-PROD-${pId}`,
            brand: {
              '@type': 'Brand',
              name: 'فروشگاه هوش مصنوعی'
            },
            offers: {
              '@type': 'Offer',
              url: canonicalUrl,
              priceCurrency: 'IRR',
              price: (product.price || 0) * 10,
              availability: isAvailable,
              itemCondition: 'https://schema.org/NewCondition'
            }
          };

          if (parsedFaqs.length > 0) {
            extraMetaTags = `\n  <script type="application/ld+json">\n  ${JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: parsedFaqs.map((f: any) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a }
              }))
            }, null, 2)}\n  </script>`;
          }
        }
      } catch (err) {}
    } else if (blogMatch && blogMatch[1] !== 'news' && blogMatch[1] !== 'tag') {
      const identifier = blogMatch[1];
      let post: any;
      try {
        if (/^\d+$/.test(identifier)) {
          post = db.prepare('SELECT * FROM news WHERE id = ?').get(identifier) as any;
        } else {
          post = db.prepare('SELECT * FROM news WHERE slug = ?').get(identifier) as any;
        }
      } catch (e) {
        post = db.prepare('SELECT * FROM news WHERE id = ?').get(identifier) as any;
      }
      if (post) {
        if (post.slug) {
          canonicalUrl = `${baseUrl}/blog/${post.slug}`;
        }
        pageTitle = `${post.title} | Dastyar AI`;
        postContent = post.content || '';
        if (post.description) {
          pageDesc = post.description;
        } else {
          const rawText = postContent
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/^>\s*/gm, '')
            .replace(/[*_#`~\[\]()\-!>]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          pageDesc = rawText.slice(0, 160) || pageDesc;
        }
        if (post.image) {
          pageImage = post.image.startsWith('http') ? post.image : `${baseUrl}${post.image}`;
        }
        pageType = 'article';

        let parsedKeywords: string[] = [];
        try {
          if (post.tags) {
            parsedKeywords = JSON.parse(post.tags);
          }
        } catch (e) {}

        const authorName = post.author || (post.source === 'manual' ? 'Dastyar AI Team' : 'دستیار هوشمند');
        const datePublished = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
        const dateModified = post.updatedAt ? new Date(post.updatedAt).toISOString() : datePublished;

        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: pageTitle,
          description: pageDesc,
          image: pageImage,
          datePublished: datePublished,
          dateModified: dateModified,
          author: {
            '@type': 'Organization',
            name: authorName
          },
          publisher: {
            '@type': 'Organization',
            name: 'دستیار هوشمند',
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/pwa-512x512.png`
            }
          },
          mainEntityOfPage: canonicalUrl,
          articleSection: parsedKeywords.length > 0 ? parsedKeywords[0] : 'هوش مصنوعی',
          inLanguage: 'fa-IR',
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'خانه', item: `${baseUrl}/` },
              { '@type': 'ListItem', position: 2, name: 'مجله هوش مصنوعی', item: `${baseUrl}/blog` },
              { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl }
            ]
          }
        };

        if (parsedKeywords.length > 0) {
          extraMetaTags += `<meta name="keywords" content="${escapeHtml(parsedKeywords.join(', '))}" />\n`;
          structuredData.keywords = parsedKeywords.join(', ');
        }
      }
    } else {
      // Check /blog/tag/:tag
      const tagMatch = urlPath.match(/^\/blog\/tag\/(.+)$/);
      if (tagMatch) {
        const decodedTag = decodeURIComponent(tagMatch[1]);
        const safeTag = escapeHtml(decodedTag);
        pageTitle = `مقالات برچسب ${safeTag} | Dastyar AI`;
        pageDesc = `جدیدترین اخبار، مقالات و آموزش‌های هوش مصنوعی مرتبط با ${safeTag} را در مجله دستیار هوشمند بخوانید.`;
      } else if (urlPath === '/blog/news') {
        pageTitle = 'اخبار هوش مصنوعی | Dastyar AI';
        pageDesc = 'جدیدترین اخبار، تحولات و رویدادهای روز هوش مصنوعی ایران و جهان به زبان فارسی در مجله Dastyar AI.';
      } else if (urlPath === '/blog') {
        pageTitle = 'مجله اخبار و مقالات هوش مصنوعی | Dastyar AI';
        pageDesc = 'آخرین اخبار هوش مصنوعی، آموزش پرامپت نویسی، معرفی ابزارها و مقالات تخصصی AI به زبان فارسی در مجله دستیار هوشمند.';
      } else if (urlPath.startsWith('/store/')) {
        const storeMatch = urlPath.match(/^\/store\/(\d+)$/);
        if (storeMatch) {
          const productId = storeMatch[1];
          const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
          if (product) {
            pageTitle = `خرید ${product.title} | Dastyar AI`;
            const rawText = (product.description || '').replace(/[#*`_\\[\\]()\\-!>]/g, '').trim();
            pageDesc = rawText.slice(0, 160) || pageDesc;
            const prodImg = product.bannerImage || product.image;
            if (prodImg) {
              pageImage = prodImg.startsWith('http') ? prodImg : `${baseUrl}${prodImg}`;
            }
            
            structuredData = {
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Product',
                  name: product.title,
                  description: pageDesc,
                  image: pageImage,
                  sku: `PROD-${product.id}`,
                  offers: {
                    '@type': 'Offer',
                    price: (product.price || 0) * 10,
                    priceCurrency: 'IRR',
                    availability: 'https://schema.org/InStock',
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
        }
      } else if (urlPath === '/store') {
          pageTitle = 'فروشگاه اکانت و ابزارهای هوش مصنوعی | Dastyar AI';
          pageDesc = 'فروشگاه خدمات و ابزارهای هوش مصنوعی: ابزارهای پیشرفته، کلیدهای API معتبر و پکیج‌های آموزشی تخصصی با پرداخت ریالی و تحویل فوری.';
          
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
        } else if (urlPath === '/chat') {
          pageTitle = 'چت با هوش مصنوعی فارسی رایگان و نامحدود | Dastyar AI';
          pageDesc = 'سوال دارید؟ همین حالا رایگان و نامحدود با هوش مصنوعی فارسی چت کنید؛ ۱۵ پیام بدون ثبت‌نام، پاسخ آنی به فارسی روان و دسترسی مستقیم از ایران.';
          canonicalUrl = `${baseUrl}/chat`;
          structuredData = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'آیا چت با Dastyar AI رایگان است؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله. چت با مدل‌های پایه پس از ورود کاملاً رایگان و نامحدود است؛ برای مدل‌های پیشرفته از پرداخت به‌ازای مصرف استفاده می‌شود.'
                }
              },
              {
                '@type': 'Question',
                name: 'آیا باید ثبت‌نام کنم؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'برای ۱۵ پیام اول نیازی نیست. برای ادامه گفتگوی نامحدود و ذخیره تاریخچه، ثبت‌نام با شماره موبایل یا گوگل.'
                }
              },
              {
                '@type': 'Question',
                name: 'آیا می‌توانم هر سوالی به فارسی بپرسم؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله، هر سوالی دارید کافیست به فارسی بنویسید تا دستیار هوشمند پاسخ دقیق، مستقیم و روان به زبان فارسی ارائه دهد.'
                }
              },
              {
                '@type': 'Question',
                name: 'آیا پاسخ‌ها به فارسی هستند؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله. پاسخ‌ها به فارسی روان ارائه می‌شوند.'
                }
              },
              {
                '@type': 'Question',
                name: 'آیا از ایران قابل دسترسی است؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله، بدون محدودیت تحریمی.'
                }
              },
              {
                '@type': 'Question',
                name: 'آیا می‌توانم تاریخچه گفتگو را ذخیره کنم؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله، با ورود به حساب کاربری.'
                }
              }
            ]
          };
        } else if (urlPath === '/' || urlPath === '/landing') {
          // Home / Landing page FAQPage Schema for GEO / AI Answer Engines
          structuredData = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'آیا چت با هوش مصنوعی در دستیار هوشمند رایگان است؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله، استفاده از مدل‌های پیشرفته هوش مصنوعی در دستیار هوشمند کاملاً رایگان است و کاربران بدون محدودیت‌های تحریم یا شماره خارجی می‌توانند به گفت‌وگو بپردازند.'
                }
              },
              {
                '@type': 'Question',
                name: 'دستیار هوشمند از چه قابلیت‌هایی پشتیبانی می‌کند؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'دستیار هوشمند از قابلیت‌های پیشرفته گفتگو، برنامه‌نویسی، تحلیل اسناد و بینایی به زبان فارسی پشتیبانی می‌کند و قابلیت انتخاب دستی یا مسیریابی هوشمند (Smart Routing) را دارد.'
                }
              },
              {
                '@type': 'Question',
                name: 'آیا امکان جستجوی آنلاین در وب و ساخت عکس با هوش مصنوعی وجود دارد؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله، این پلتفرم مجهز به جستجوی زنده وب (Google Search Grounding) برای دسترسی به اخبار و داده‌های روز و استودیوی تولید تصویر است.'
                }
              },
              {
                '@type': 'Question',
                name: 'فروشگاه هوش مصنوعی چه خدماتی ارائه می‌دهد؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'در فروشگاه دستیار هوشمند، خدمات شارژ کیف پول، بسته‌های اعتباری و ابزارهای تخصصی با امکان پرداخت امن و تحویل آنی عرضه می‌شوند.'
                }
              }
            ]
          };
        } else if (urlPath === '/about') {
          pageTitle = 'درباره Dastyar AI | دستیار هوش مصنوعی فارسی';
          pageDesc = 'Dastyar AI چیست، چرا ساخته شد، و چرا رایگان است. دستیار هوش مصنوعی فارسی با چت رایگان نامحدود روی مدل‌های پایه و پرداخت به‌ازای مصرف برای مدل‌های پیشرفته.';
          pageType = 'article';
        } else if (urlPath === '/contact') {
          pageTitle = 'تماس با Dastyar AI';
          pageDesc = 'راه‌های تماس با تیم Dastyar AI — ایمیل، تلگرام، و فرم تماس.';
          pageType = 'website';
        } else if (urlPath === '/ai-assistant') {
          pageTitle = 'دستیار هوش مصنوعی چیست؟ راهنمای کامل | Dastyar AI';
          pageDesc = 'دستیار هوش مصنوعی چیست، چه کارهایی انجام می‌دهد و چطور از آن استفاده کنیم؟ راهنمای کامل + معرفی Dastyar AI.';
          pageType = 'article';
          structuredData = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'دستیار هوش مصنوعی چیست؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'برنامه‌ای است که با مدل‌های زبانی پیشرفته به سوالات شما پاسخ می‌دهد، متن می‌نویسد و در کارهای روزمره کمک می‌کند.'
                }
              },
              {
                '@type': 'Question',
                name: 'تفاوت دستیار هوش مصنوعی با موتور جستجو چیست؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'موتور جستجو لینک نشان می‌دهد، اما دستیار هوش مصنوعی پاسخ مستقیم و متناسب با موقعیت شما ارائه می‌دهد.'
                }
              },
              {
                '@type': 'Question',
                name: 'آیا Dastyar AI رایگان است؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله. چت با مدل‌های پایه پس از ورود کاملاً رایگان و نامحدود است (و پیش از ورود ۱۵ پیام مهمان دارید). برای مدل‌های پیشرفته از پرداخت به‌ازای مصرف با کیف پول استفاده می‌شود.'
                }
              },
              {
                '@type': 'Question',
                name: 'آیا Dastyar AI به فارسی پاسخ می‌دهد؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله. تمام پاسخ‌ها به فارسی روان ارائه می‌شوند.'
                }
              },
              {
                '@type': 'Question',
                name: 'آیا از ایران قابل دسترسی است؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله. برای دسترسی مستقیم از ایران طراحی شده است.'
                }
              }
            ]
          };
        }
      }

    // Adapt app-shell initial H1 and H2 for SSR / View Source
    if (urlPath === '/about') {
      html = html.replace(/<h1[^>]*>.*?<\/h1>/, '<h1 style="font-size:20px;font-weight:700;margin:0 0 8px 0;color:#f8fafc;">درباره Dastyar AI</h1>');
      html = html.replace(/<h2[^>]*>.*?<\/h2>/, '');
    } else if (urlPath === '/contact') {
      html = html.replace(/<h1[^>]*>.*?<\/h1>/, '<h1 style="font-size:20px;font-weight:700;margin:0 0 8px 0;color:#f8fafc;">تماس با Dastyar AI</h1>');
      html = html.replace(/<h2[^>]*>.*?<\/h2>/, '');
    } else if (urlPath === '/ai-assistant') {
      html = html.replace(/<h1[^>]*>.*?<\/h1>/, '<h1 style="font-size:20px;font-weight:700;margin:0 0 8px 0;color:#f8fafc;">دستیار هوش مصنوعی چیست؟</h1>');
      html = html.replace(/<h2[^>]*>.*?<\/h2>/, '');
    } else if (urlPath === '/chat') {
      html = html.replace(/<h1[^>]*>.*?<\/h1>/, '<h1 style="font-size:20px;font-weight:700;margin:0 0 8px 0;color:#f8fafc;">چت با هوش مصنوعی فارسی رایگان</h1>');
      html = html.replace(/<h2[^>]*>.*?<\/h2>/, '');
    }

    const safeTitle = escapeHtml(pageTitle);
    const safeDesc = escapeHtml(pageDesc);
    const safeCanonical = escapeHtml(canonicalUrl);
    const safeImage = escapeHtml(pageImage);
    const safeType = escapeHtml(pageType);

    // Generate crawlable internal links and semantic outline for search engine bots (5-min RAM cache)
    const dynamicNavItems = getCachedNavItemsHtml(baseUrl);
    const internalNavHtml = `
      <section aria-label="پیوندهای مفید سایت" class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">
        <h2>دستیار هوشمند | دسترسی سریع به بخش‌های اصلی و مقالات هوش مصنوعی</h2>
        <nav aria-label="پیوندهای مفید سایت">
          <ul>
            <li><a href="${baseUrl}/">چت هوش مصنوعی رایگان فارسی</a></li>
            <li><a href="${baseUrl}/store">فروشگاه ابزارها و اکانت‌های هوش مصنوعی</a></li>
            <li><a href="${baseUrl}/blog">مجله آموزش و اخبار هوش مصنوعی</a></li>
            <li><a href="${baseUrl}/about">درباره Dastyar AI</a></li>
            <li><a href="${baseUrl}/contact">تماس با ما</a></li>
            <li><a href="${baseUrl}/ai-assistant">دستیار هوش مصنوعی چیست؟</a></li>
            <li><a href="${baseUrl}/blog/news">اخبار هوش مصنوعی</a></li>
            ${dynamicNavItems}
          </ul>
        </nav>
        <p>${safeDesc}</p>
        <p>دستیار هوشمند پلتفرم جامع چت هوش مصنوعی فارسی با پشتیبانی از هوش مصنوعی پیشرفته گفتگو، کدنویسی و تحلیل اسناد با اتصال مستقیم و پایدار از سراسر ایران است.</p>
      </section>`;

    const ssrHeading = `<div class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">${safeTitle}</div>`;
    const ssrArticle = postContent ? `<article class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">${escapeHtml(postContent)}</article>` : '';

    let chatSsrContent = '';
    if (urlPath === '/chat') {
      chatSsrContent = `
      <section aria-label="راهنمای چت هوش مصنوعی فارسی" class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">
        <h2>چت هوش مصنوعی چیست؟</h2>
        <p>چت هوش مصنوعی یک گفتگوی متنی بین شما و یک مدل زبانی پیشرفته است. شما سوال می‌پرسید، درخواست می‌کنید، یا متنی می‌فرستید؛ و هوش مصنوعی پاسخ می‌دهد. برخلاف جستجوی معمولی که فقط لینک نشان می‌دهد، چت هوش مصنوعی پاسخ مستقیم و متناسب با موقعیت شما ارائه می‌دهد.</p>
        <p>چت با هوش مصنوعی فارسی رایگان همان تجربه گفتگوی هوشمند را به زبان فارسی روان فراهم می‌کند: بدون نیاز به انگلیسی، بدون ترجمه دستی، و با درک اصطلاحات و لحن رایج فارسی. در Dastyar AI با ۱۵ پیام مهمان بدون ثبت‌نام شروع می‌کنید و پس از ورود به چت رایگان و نامحدود با مدل‌های پایه دسترسی دارید.</p>

        <h2>چطور کار می‌کند؟</h2>
        <ol>
          <li>درخواستتان را به فارسی بنویسید — هرچه دقیق‌تر، پاسخ بهتر.</li>
          <li>پاسخ را بخوانید — می‌توانید بپرسید «بیشتر توضیح بده».</li>
          <li>گفتگو را ادامه دهید — هوش مصنوعی زمینه را به خاطر می‌سپارد.</li>
          <li>نتیجه را کپی کنید — پاسخ را در کار، ایمیل، یا پروژه‌تان استفاده کنید.</li>
        </ol>

        <h2>نمونه پرامپت‌ها</h2>
        <ul>
          <li><a href="${baseUrl}/chat?prompt=%DB%8C%DA%A9%20%D8%A7%DB%8C%D9%85%DB%8C%D9%84%20%D8%B1%D8%B3%D9%85%DB%8C%20%D8%A8%D8%B1%D8%A7%DB%8C%20%D8%AF%D8%B1%D8%AE%D9%88%D8%A7%D8%B3%D8%AA%20%D9%85%D8%B1%D8%AE%D8%B5%DB%8C%20%D8%A8%D9%86%D9%88%DB%8C%D8%B3.">یک ایمیل رسمی برای درخواست مرخصی بنویس.</a></li>
          <li><a href="${baseUrl}/chat?prompt=%D8%A7%DB%8C%D9%86%20%D9%BE%D8%A7%D8%B1%D8%A7%DA%AF%D8%B1%D8%A7%D9%81%20%D8%B1%D8%A7%20%D8%AE%D9%84%D8%A7%D8%B5%D9%87%20%DA%A9%D9%86%3A%20%5B%D9%85%D8%AA%D9%86%5D">این پاراگراف را خلاصه کن: [متن]</a></li>
          <li><a href="${baseUrl}/chat?prompt=%DB%8C%DA%A9%20%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D9%87%20%D8%AA%D9%85%D8%B1%DB%8C%D9%86%DB%8C%20%D9%87%D9%81%D8%AA%DA%AF%DB%8C%20%D8%A8%D8%B1%D8%A7%DB%8C%20%D9%85%D8%A8%D8%AA%D8%AF%DB%8C%E2%80%8C%D9%87%D8%A7%20%D8%A8%D8%AF%D9%87.">یک برنامه تمرینی هفتگی برای مبتدی‌ها بده.</a></li>
          <li><a href="${baseUrl}/chat?prompt=%D8%A8%D8%B1%D8%A7%DB%8C%20%D8%B4%D8%B1%D9%88%D8%B9%20%DB%8C%DA%A9%20%DA%A9%D8%B3%D8%A8%E2%80%8C%D9%88%DA%A9%D8%A7%D8%B1%20%DA%A9%D9%88%DA%86%DA%A9%D8%8C%20%D9%BE%D9%86%D8%AC%20%D8%A7%DB%8C%D8%AF%D9%87%20%D8%A8%D8%AF%D9%87.">برای شروع یک کسب‌وکار کوچک، پنج ایده بده.</a></li>
          <li><a href="${baseUrl}/chat?prompt=%D8%A7%DB%8C%D9%86%20%D8%AC%D9%85%D9%84%D9%87%20%D8%B1%D8%A7%20%D8%A8%D9%87%20%D8%A7%D9%86%DA%AF%D9%84%DB%8C%D8%B3%DB%8C%20%D8%B1%D9%88%D8%A7%D9%86%20%D8%AA%D8%B1%D8%AC%D9%85%D9%87%20%DA%A9%D9%86%3A%20%5B%D9%85%D8%AA%D9%86%5D">این جمله را به انگلیسی روان ترجمه کن: [متن]</a></li>
        </ul>

        <h2>سوالات متداول</h2>
        <dl>
          <dt>آیا چت با Dastyar AI رایگان است؟</dt>
          <dd>بله. چت با مدل‌های پایه پس از ورود کاملاً رایگان و نامحدود است؛ برای مدل‌های پیشرفته از پرداخت به‌ازای مصرف استفاده می‌شود.</dd>
          <dt>آیا باید ثبت‌نام کنم؟</dt>
          <dd>برای ۱۵ پیام اول نیازی نیست. برای ادامه گفتگوی نامحدود و ذخیره تاریخچه، ثبت‌نام با شماره موبایل یا گوگل.</dd>
          <dt>آیا می‌توانم هر سوالی به فارسی بپرسم؟</dt>
          <dd>بله، هر سوالی دارید کافیست به فارسی بنویسید تا دستیار هوشمند پاسخ دقیق، مستقیم و روان به زبان فارسی ارائه دهد.</dd>
          <dt>آیا پاسخ‌ها به فارسی هستند؟</dt>
          <dd>بله. پاسخ‌ها به فارسی روان ارائه می‌شوند.</dd>
          <dt>آیا از ایران قابل دسترسی است؟</dt>
          <dd>بله، بدون محدودیت تحریمی.</dd>
          <dt>آیا می‌توانم تاریخچه گفتگو را ذخیره کنم؟</dt>
          <dd>بله، با ورود به حساب کاربری.</dd>
        </dl>
      </section>`;
    }

    const ssrHtml = `<div id="ssr-content">
        ${ssrHeading}
        ${ssrArticle}
        ${chatSsrContent}
        ${internalNavHtml}
      </div>`;
    html = html.replace('</body>', `  ${ssrHtml}\n</body>`);

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
    html = html.replace(/<meta\s+property="og:locale"\s+content=".*?"\s*\/?>/i, `<meta property="og:locale" content="fa_IR" />`);
    html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, `<meta property="og:url" content="${safeCanonical}" />`);

    // Replace Hreflang to self-reference current canonical URL
    html = html.replace(/<link\s+rel="alternate"\s+hreflang="fa"\s+href=".*?"\s*\/?>/i, `<link rel="alternate" hreflang="fa" href="${safeCanonical}" />`);
    html = html.replace(/<link\s+rel="alternate"\s+hreflang="x-default"\s+href=".*?"\s*\/?>/i, `<link rel="alternate" hreflang="x-default" href="${safeCanonical}" />`);

    // Replace Twitter Tags
    html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${safeTitle}" />`);
    html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${safeDesc}" />`);
    html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${safeImage}" />`);

    // Ensure absolute og:image / twitter:image URLs (relative → absolute)
    html = html.replace(/content="\/pwa-512x512\.png"/g, `content="${baseUrl}/pwa-512x512.png"`);

    // Inject Dynamic JSON-LD Schema & extra meta tags
    if (extraMetaTags) {
      html = html.replace('</head>', `${extraMetaTags}\n</head>`);
    }
    if (urlPath === '/ai-assistant') {
      // User prompt requirement: فقط FAQPage در این صفحه. هیچ Organization یا WebApplication تکراری در این صفحه نگذار.
      html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, '');
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

    if (useProdCache && STATIC_SEO_PATHS.has(urlPath)) {
      STATIC_HTML_CACHE.set(`${baseUrl}|${urlPath}`, {
        html,
        expiresAt: Date.now() + STATIC_HTML_TTL_MS,
      });
    }

    setHtmlNoCacheHeaders();
    res.send(html);
  } catch (err) {
    console.error('[Server SEO] Error injecting metadata:', err);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.sendFile(path.join(distPath, 'index.html'));
  }
}

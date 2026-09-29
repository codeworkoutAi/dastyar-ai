import express from 'express';
import path from 'path';
import fs from 'fs';
import db from '../db/database';

export function escapeHtml(str?: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderHtmlWithSeo(req: express.Request, res: express.Response, distPath: string) {
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  try {
    let html = fs.readFileSync(indexPath, 'utf-8');
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = process.env.NODE_ENV === 'production' ? (process.env.WEB_URL || 'https://dastyarai.com') : `${protocol}://${host}`;
    const urlPath = req.path;

    let pageTitle = 'دستیار هوشمند | چت با هوش مصنوعی رایگان و پیشرفته';
    let pageDesc = 'چت با هوش مصنوعی رایگان فارسی با مدل‌های ChatGPT، Claude و Gemini. جستجوی زنده وب، تولید تصویر و فروشگاه ابزارهای AI بدون نیاز به فیلترشکن.';
    let pageImage = `${baseUrl}/pwa-512x512.png`;
    let pageType = 'website';
    let canonicalUrl = `${baseUrl}${urlPath}`;
    let structuredData: any = null;
    let postContent = '';

    let extraMetaTags = '';

    // Check /blog/:id
    const blogMatch = urlPath.match(/^\/blog\/(\d+)$/);
    const productMatch = urlPath.match(/^\/store\/product\/(\d+)$/);
    
    if (productMatch) {
      const pId = parseInt(productMatch[1], 10);
      try {
        const product = db.prepare("SELECT title, description, longDescription, price, stock, category, image, bannerImage, faqs FROM products WHERE id = ?").get(pId) as any;
        if (product) {
          pageTitle = `خرید ${product.title} | فروشگاه هوش مصنوعی`;
          pageDesc = product.description || product.title;
          pageType = 'product';
          pageImage = product.bannerImage || product.image || pageImage;
          
          let parsedFaqs = [];
          try { if (product.faqs) parsedFaqs = JSON.parse(product.faqs); } catch (e) {}

          const isAvailable = (product.stock > 0 || product.category === 'plan' || product.category === 'package') ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
          
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
    } else if (blogMatch) {
      const blogId = blogMatch[1];
      const post = db.prepare('SELECT * FROM news WHERE id = ?').get(blogId) as any;
      if (post) {
        pageTitle = `${post.title} | مجله هوش مصنوعی`;
        postContent = post.content || '';
        const rawText = postContent.replace(/[#*`_\\[\\]()\\-!>]/g, '').trim();
        pageDesc = rawText.slice(0, 160) || pageDesc;
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

        const authorName = post.author || 'دستیار هوشمند';
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
        pageTitle = `اخبار و مقالات: ${safeTag} | مجله هوش مصنوعی`;
        pageDesc = `جدیدترین اخبار، مقالات و آموزش‌های هوش مصنوعی مرتبط با ${safeTag} را در مجله دستیار هوشمند بخوانید.`;
      } else if (urlPath === '/blog') {
        pageTitle = 'مجله هوش مصنوعی | اخبار، آموزش و مقالات ChatGPT و هوش مصنوعی';
        pageDesc = 'آخرین اخبار هوش مصنوعی، آموزش پرامپت نویسی، معرفی ابزارها و مقالات تخصصی AI به زبان فارسی در مجله دستیار هوشمند.';
      } else if (urlPath.startsWith('/store/')) {
        const storeMatch = urlPath.match(/^\/store\/(\d+)$/);
        if (storeMatch) {
          const productId = storeMatch[1];
          const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
          if (product) {
            pageTitle = `${product.title} | خرید از فروشگاه هوش مصنوعی`;
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
        } else if (urlPath === '/store') {
          pageTitle = 'فروشگاه ابزارهای هوش مصنوعی | دستیار هوشمند';
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
        } else if (urlPath === '/' || urlPath === '/landing' || urlPath === '/chat') {
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
    }

    const safeTitle = escapeHtml(pageTitle);
    const safeDesc = escapeHtml(pageDesc);
    const safeCanonical = escapeHtml(canonicalUrl);
    const safeImage = escapeHtml(pageImage);
    const safeType = escapeHtml(pageType);

    const ssrHeading = `<h1 class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">${safeTitle}</h1>`;
    if (postContent) {
      const ssrHtml = `<div id="ssr-content" style="display:none;" aria-hidden="true">
        ${ssrHeading}
        <article>${escapeHtml(postContent)}</article>
      </div>`;
      html = html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${ssrHtml}`);
    } else {
      const ssrHtml = `<div id="ssr-content" style="display:none;" aria-hidden="true">\n        ${ssrHeading}\n      </div>`;
      html = html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${ssrHtml}`);
    }

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

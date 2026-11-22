import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import db, { syncDatabase } from '../db/database';
import { requireAuth, JWT_SECRET } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { bot } from '../telegram/bot';
import { requestZarinpalPayment, verifyZarinpalPayment, getZarinpalConfig } from '../services/zarinpalService';
import { 
  initBazaarCheckout, 
  traceBazaarPayment, 
  commitBazaarPayment, 
  getBazaarPayConfig 
} from '../services/bazaarPayService';
import { depositWallet, getPlanCreditAmount } from '../services/walletService';
import { notifyOrderSuccessBySms } from '../services/kavenegarService';
import { 
  getGeminiClient, 
  getGeminiKeyFromPool, 
  getGroqKeyFromPool,
  blacklistKey,
  extractCleanErrorMessage
} from '../services/utils';

const router = express.Router();

function getSafeBaseUrl(req: express.Request): string {
  const configuredUrl = (process.env.APP_URL || process.env.WEBSITE_URL || process.env.WEB_URL || '').trim().replace(/\/+$/, '');
  if (configuredUrl) return configuredUrl;
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

export function getWalletTopupProductId(): number {
  try {
    const existing = db.prepare("SELECT id FROM products WHERE category = 'wallet_topup' LIMIT 1").get() as any;
    if (existing && existing.id) return existing.id;
    const ins = db.prepare(`
      INSERT INTO products (title, description, price, category) 
      VALUES ('شارژ کیف پول', 'افزایش موجودی کیف پول حساب کاربری', 0, 'wallet_topup')
    `).run();
    return Number(ins.lastInsertRowid);
  } catch (err) {
    console.error('[Store] getWalletTopupProductId error:', err);
    return 1;
  }
}

export function calculateWalletCredit(orderAmount: number, isWalletTopup: boolean, product: any): { creditAmount: number; bonus: number; descSuffix: string } {
  const isPlan = product?.category === 'plan';
  if (isPlan) {
    return { creditAmount: getPlanCreditAmount(product), bonus: 0, descSuffix: '' };
  }
  if (isWalletTopup && orderAmount >= 100000) {
    const bonus = Math.round(orderAmount * 0.20);
    return { 
      creditAmount: orderAmount + bonus, 
      bonus, 
      descSuffix: ` (شامل ۲۰٪ بونوس هدیه: ${bonus.toLocaleString('fa-IR')} تومان)` 
    };
  }
  return { creditAmount: orderAmount, bonus: 0, descSuffix: '' };
}

export function notifyAdminWalletTopup(orderId: string, userId: number, amount: number, method: string, refId?: string) {
  try {
    const adminId = process.env.TELEGRAM_ADMIN_ID;
    if (adminId && bot) {
      const user = db.prepare('SELECT email, phone, name FROM users WHERE id = ?').get(userId) as any;
      const userIdentifier = user?.name || user?.phone || user?.email || `کاربر #${userId}`;
      const amountToman = Number(amount).toLocaleString('fa-IR');
      const msg = 
        `💰 <b>شارژ موفق کیف پول کاربر</b>\n\n` +
        `👤 <b>کاربر:</b> ${userIdentifier}\n` +
        `💵 <b>مبلغ شارژ:</b> ${amountToman} تومان\n` +
        `🔢 <b>شناسه سفارش:</b> <code>${orderId}</code>\n` +
        `💳 <b>روش پرداخت:</b> ${method}\n` +
        (refId ? `🧾 <b>کد رهگیری:</b> <code>${refId}</code>\n` : '') +
        `\n✅ کیف پول کاربر به صورت آنی شارژ شد و نیاز به اقدام یا لایسنس ندارد.`;
      bot.telegram.sendMessage(adminId, msg, { parse_mode: 'HTML' }).catch((e) => {
        console.error('[Store] Failed to notify admin of wallet topup:', e);
      });
    }
  } catch (err) {
    console.error('[Store] notifyAdminWalletTopup error:', err);
  }
}

export function fulfillDigitalOrder(
  orderId: string, 
  order: any, 
  product: any, 
  paymentMethod: string, 
  authority?: string, 
  refId?: string, 
  cardPan?: string
) {
  let licenseId: number | null = null;
  let fulfillmentStatus = 'preparing';
  let deliveredLicenseKey = '';

  try {
    const availableLicense = db.prepare(
      "SELECT id, key FROM licenses WHERE productId = ? AND status = 'available' ORDER BY id ASC LIMIT 1"
    ).get(order.productId) as any;

    if (availableLicense) {
      licenseId = availableLicense.id;
      deliveredLicenseKey = availableLicense.key;
      fulfillmentStatus = 'delivered';
      db.prepare("UPDATE licenses SET status = 'sold' WHERE id = ?").run(availableLicense.id);
    }
  } catch (e) {
    console.error('[Store] Error checking license in fulfillDigitalOrder:', e);
  }

  const updateRes = db.prepare(
    "UPDATE orders SET paymentStatus = 'success', paymentMethod = ?, licenseId = ?, fulfillmentStatus = ?, authority = ?, refId = ?, cardPan = ? WHERE id = ? AND paymentStatus != 'success'"
  ).run(paymentMethod, licenseId, fulfillmentStatus, authority || null, refId || null, cardPan || null, orderId);

  if (updateRes.changes === 1) {
    syncDatabase();

    // Notify Admin on Telegram
    try {
      const adminId = process.env.TELEGRAM_ADMIN_ID;
      if (adminId && bot) {
        const user = db.prepare('SELECT email, phone, name FROM users WHERE id = ?').get(order.userId) as any;
        const userIdentifier = user?.name || user?.phone || user?.email || `کاربر #${order.userId}`;
        const isAutoDelivered = Boolean(licenseId);
        const adminMsg = 
          `🛍️ <b>سفارش جدید پرداخت شد</b>\n\n` +
          `📦 <b>محصول:</b> ${product?.title || ''}\n` +
          `👤 <b>خریدار:</b> ${userIdentifier}\n` +
          `💰 <b>مبلغ:</b> ${Number(order.amount).toLocaleString('fa-IR')} تومان\n` +
          `🔢 <b>شماره سفارش:</b> <code>${orderId}</code>\n` +
          `💳 <b>روش پرداخت:</b> ${paymentMethod}\n` +
          (refId ? `🧾 <b>کد رهگیری:</b> <code>${refId}</code>\n` : '') +
          (order.selectedPeriod ? `⏳ <b>پلن/دوره:</b> ${order.selectedPeriod}\n` : '') +
          (isAutoDelivered 
            ? `\n⚡ <b>تحویل آنی انجام شد:</b> لایسنس به صورت خودکار به کاربر تحویل گردید.` 
            : `\n⚠️ <b>نیازمند اقدام ادمین:</b> لطفاً در پنل ادمین برای این سفارش لایسنس/اکانت ثبت کنید.`);
        bot.telegram.sendMessage(adminId, adminMsg, { parse_mode: 'HTML' }).catch(() => {});
      }
    } catch (e) {}

    // Telegram delivery notification to buyer
    try {
      const orderUser = db.prepare('SELECT telegramId FROM users WHERE id = ?').get(order.userId) as any;
      if (orderUser?.telegramId && bot) {
        let msg = `✅ **سفارش شما با موفقیت ثبت و پرداخت شد!**\n\n` +
                  `📦 **محصول:** ${product?.title || ''}\n` +
                  `🔢 **شماره سفارش:** \`${orderId}\`\n` +
                  (refId ? `🧾 **کد پیگیری:** \`${refId}\`\n` : '') +
                  `💰 **مبلغ پرداخت شده:** ${Number(order.amount).toLocaleString('fa-IR')} تومان\n\n`;
        if (deliveredLicenseKey) {
          msg += `⚡ **اطلاعات اکانت / لایسنس شما:**\n\`${deliveredLicenseKey}\`\n\nاین اطلاعات در پنل کاربری شما در سایت نیز ثبت شد.`;
        } else {
          msg += `⏳ سفارش شما در حال آماده‌سازی است و ظرف ۱ تا ۲۴ ساعت آینده مشخصات اکانت در داشبورد کاربری شما قرار می‌گیرد.`;
        }
        bot.telegram.sendMessage(orderUser.telegramId, msg, { parse_mode: 'Markdown' }).catch(() => {});
      }
    } catch (tgErr) {
      console.error('[Store] Telegram buyer notify error:', tgErr);
    }

    // SMS notification
    notifyOrderSuccessBySms(orderId, licenseId);
  }

  return { licenseId, fulfillmentStatus, deliveredLicenseKey };
}

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 checkout requests per window
  message: { error: 'تعداد درخواست‌های پرداخت بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const advisorLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 messages per 10 mins per IP
  message: { error: 'تعداد درخواست‌های شما به مشاور هوشمند بیش از حد مجاز است. لطفاً چند دقیقه دیگر امتحان کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/store/advisor (Lightweight Shopping Advisor for customers)
router.post('/advisor', advisorLimiter, async (req, res) => {
  try {
    const { message, history, currentProductId } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'متن پیام الزامی است.' });
    }

    const cleanMsg = message.trim().slice(0, 500);

    // Fetch active products safely
    const products = db.prepare(`
      SELECT id, title, category, price, variations, description, features, deliveryTime, badge
      FROM products
      WHERE status = 'active' OR status IS NULL
    `).all() as any[];

    const catalogSummary = products.map(p => {
      let vars = '';
      try {
        if (p.variations) {
          const parsed = typeof p.variations === 'string' ? JSON.parse(p.variations) : p.variations;
          if (Array.isArray(parsed)) {
            vars = parsed.map((v: any) => `${v.title}: ${Number(v.price).toLocaleString('fa-IR')} تومان`).join(' | ');
          }
        }
      } catch (_) {}
      return `- [ID: ${p.id}] «${p.title}» (دسته: ${p.category}) - قیمت پایه: ${Number(p.price).toLocaleString('fa-IR')} تومان ${vars ? `[پلن‌ها: ${vars}]` : ''} - زمان تحویل: ${p.deliveryTime || '۱ تا ۲۴ ساعت'} - ویژگی‌ها: ${(p.features || p.description || '').replace(/\n/g, ' ')}`;
    }).join('\n');

    let currentContext = '';
    if (currentProductId) {
      const cur = products.find(p => p.id === Number(currentProductId));
      if (cur) {
        currentContext = `\nتوجه: کاربر هم‌اکنون در صفحه محصول «${cur.title}» با شناسه ${cur.id} حضور دارد.`;
      }
    }

    // Validation helper to reject prompt leaks, rule checks or non-Persian garbage
    const isValidAdvisorReply = (text: string): boolean => {
      if (!text || typeof text !== 'string') return false;
      const trimmed = text.trim();
      if (trimmed.length < 25) return false;
      const persianChars = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
      if (persianChars < 12) return false;
      const leakPatterns = [
        /formatting\s*rules/i,
        /rule\s*check/i,
        /system\s*instruction/i,
        /check\s*&/i,
        /no\s*[*`]+\s*anywhere/i,
        /as\s*an\s*ai\s*language\s*model/i
      ];
      return !leakPatterns.some(pat => pat.test(trimmed));
    };

    const cleanAdvisorArtifacts = (raw: string): string => {
      if (!raw) return '';
      return raw
        .replace(/^[:\s\-*#]*(?:formatting\s*rules\s*check|rule\s*check|guidelines\s*check|check\s*&)[\s\S]*?\n+/gi, '')
        .replace(/no\s*[*`]+\s*anywhere!?/gi, '')
        .trim();
    };

    const systemInstruction = `شما «مشاور هوشمند فروشگاه Dastyar AI» هستید. وظیفه شما راهنمایی تخصصی و خرید آسان برای مشتریان فروشگاه است.

کاتالوگ محصولات فعال فروشگاه:
${catalogSummary}
${currentContext}

دستورالعمل‌ها:
۱. پاسخ را کاملاً به زبان فارسی صمیمی، حرفه‌ای و روان بنویسید (حداکثر ۲ تا ۳ پاراگراف کوتاه و کاربردی).
۲. مستقیماً به سوال مشتری پاسخ دهید و بهترین اکانت یا ابزار متناسب با نیازش را از کاتالوگ معرفی کنید.
۳. برای هر محصولی که پیشنهاد می‌دهید، تگ [RECOMMEND:ID] آن محصول را درج کنید تا کارت خرید نمایش داده شود.
۴. ویژگی‌های برجسته مانند زمان تحویل، ضمانت و نوع پلن را واضح توضیح دهید.
۵. پاسخ را فوراً با متن فارسی شروع کنید و از درج هرگونه عبارت انگلیسی، متادیتا یا بررسی قوانین خودداری کنید.`;

    let reply = '';

    // 1. Try Gemini Pool with candidate models
    const geminiCandidates = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
    for (const cand of geminiCandidates) {
      if (reply) break;
      let poolKey: string | null = null;
      try {
        try {
          poolKey = getGeminiKeyFromPool([], cand);
        } catch (_) {}

        if (poolKey) {
          const ai = getGeminiClient(poolKey, false);
          const contents: any[] = [];
          if (Array.isArray(history)) {
            for (const h of history.slice(-6)) {
              if (h.role === 'user') contents.push({ role: 'user', parts: [{ text: h.content }] });
              else if (h.role === 'assistant') contents.push({ role: 'model', parts: [{ text: h.content }] });
            }
          }
          contents.push({ role: 'user', parts: [{ text: cleanMsg }] });

          const result = await ai.models.generateContent({
            model: cand,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          });
          const candidateReply = cleanAdvisorArtifacts(result.text?.trim() || '');
          if (isValidAdvisorReply(candidateReply)) {
            reply = candidateReply;
          } else {
            console.warn(`[Advisor] Gemini ${cand} returned invalid or leaked output:`, result.text?.slice(0, 100));
          }
        }
      } catch (geminiErr: any) {
        console.warn(`[Advisor] Gemini ${cand} failed:`, geminiErr?.message || geminiErr);
        const errMsg = extractCleanErrorMessage(geminiErr);
        const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
        const is401 = errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('Invalid API Key');
        const is403 = errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID');
        if (poolKey && (is429 || is401 || is403)) {
          blacklistKey(poolKey, is429 ? '429' : (is401 ? '401' : '403'), undefined, cand);
        }
      }
    }

    // 2. Try Groq Pool if Gemini was not available
    if (!reply) {
      try {
        const groqKey = getGroqKeyFromPool([]);
        if (groqKey) {
          const messages = [
            { role: 'system', content: systemInstruction },
            ...(Array.isArray(history) ? history.slice(-6).map((h: any) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })) : []),
            { role: 'user', content: cleanMsg }
          ];
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages,
              max_tokens: 1000,
              temperature: 0.7
            })
          });
          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const candidateReply = cleanAdvisorArtifacts(groqData.choices?.[0]?.message?.content?.trim() || '');
            if (isValidAdvisorReply(candidateReply)) {
              reply = candidateReply;
            } else {
              console.warn('[Advisor] Groq returned invalid output:', candidateReply.slice(0, 100));
            }
          } else {
            console.warn('[Advisor] Groq HTTP error:', groqRes.status);
            if (groqRes.status === 429 || groqRes.status === 401) {
              blacklistKey(groqKey, groqRes.status === 429 ? '429' : '401');
            }
          }
        }
      } catch (groqErr) {
        console.warn('[Advisor] Groq fallback failed:', groqErr);
      }
    }

    // 3. Dynamic grounded smart fallback if all LLM network requests failed
    if (!reply) {
      const q = cleanMsg.toLowerCase();
      const findProd = (kw: string) => products.find(p => p.title.toLowerCase().includes(kw.toLowerCase()));

      if (/برنامه|کد|پایتون|جاوا|فرانت|react|python|code|developer|vscode|cursor/i.test(q)) {
        const claude = findProd('Claude') || findProd('کلود');
        const gpt = findProd('ChatGPT') || findProd('چت‌جی‌پی‌تی');
        const recTags = [claude?.id, gpt?.id].filter(Boolean).map(id => `[RECOMMEND:${id}]`).join(' ');
        reply = `برای برنامه‌نویسی و توسعه نرم‌افزار، اکانت‌های (Claude Pro) (بهترین گزینه برای درک کدهای طولانی، ریفکتور و معماری) و (ChatGPT Plus) (با دسترسی به تحلیل داده‌ها و کدنویسی پیشرفته) بیشترین بازدهی را دارند. هر دو سرویس به صورت کاملاً قانونی فعال‌سازی می‌شوند و در تمام طول دوره اشتراک ضمانت دارند.\n\n${recTags}`;
      } else if (/عکس|تصویر|طراحی|گرافیک|بنر|لوگو|میدجورنی|image|art|photo|midjourney|leonardo/i.test(q)) {
        const mid = findProd('Midjourney') || findProd('میدجورنی') || findProd('Leonardo');
        const gpt = findProd('ChatGPT');
        const recTags = [mid?.id, gpt?.id].filter(Boolean).map(id => `[RECOMMEND:${id}]`).join(' ');
        reply = `برای طراحی گرافیک و تولید تصاویر خلاقانه، سرویس (Midjourney) باکیفیت‌ترین خروجی فوتورئال و هنری را ارائه می‌دهد. همچنین اکانت (ChatGPT Plus) دارای مولد تصویر DALL-E 3 بوده و برای بنرهای تبلیغاتی و ایده‌پردازی گرافیکی عالی است.\n\n${recTags}`;
      } else if (/متن|مقاله|دانشگاه|تحقیق|تولید محتوا|ترجمه|نویسند|word|write|research/i.test(q)) {
        const gpt = findProd('ChatGPT') || findProd('چت‌جی‌پی‌تی');
        const claude = findProd('Claude') || findProd('کلود');
        const recTags = [gpt?.id, claude?.id].filter(Boolean).map(id => `[RECOMMEND:${id}]`).join(' ');
        reply = `برای تولید محتوا، مقاله‌نویسی، ترجمه تخصصی و کارهای دانشگاهی، اکانت (ChatGPT Plus) و (Claude Pro) بهترین انتخاب‌ها هستند. نگارش روان به زبان فارسی و امکان آپلود و تحلیل فایل‌های متنی و PDF از مهم‌ترین ویژگی‌های این سرویس‌ها است.\n\n${recTags}`;
      } else if (/ترید|مالی|بورس|ارز|کریپتو|trade|crypto/i.test(q)) {
        const gpt = findProd('ChatGPT') || findProd('چت‌جی‌پی‌تی');
        const recTags = [gpt?.id].filter(Boolean).map(id => `[RECOMMEND:${id}]`).join(' ');
        reply = `برای تحلیل تکنیکال، ترید و بررسی بازارهای مالی، اکانت (ChatGPT Plus) به دلیل قابلیت بارگذاری و تحلیل چارت‌های مالی، اکسل‌های معاملاتی و داده‌های آماری بیشترین کاربرد را برای تحلیل‌گران دارد.\n\n${recTags}`;
      } else if (/قیمت|هزینه|چنده|تومان|ارزان|تخفیف/i.test(q)) {
        const priceList = products.slice(0, 4).map(p => `• (${p.title}): از ${Number(p.price).toLocaleString('fa-IR')} تومان`).join('\n');
        const recTags = products.slice(0, 2).map(p => `[RECOMMEND:${p.id}]`).join(' ');
        reply = `قیمت محبوب‌ترین اکانت‌های هوش مصنوعی ما به شرح زیر است:\n\n${priceList}\n\nتمامی پرداخت‌ها از طریق درگاه امن بانکی شاپرک انجام می‌شود و اکانت‌ها تضمین اصالت دارند.\n\n${recTags}`;
      } else if (/تحویل|گارانتی|ضمانت|اعتماد|چقدر طول|ساعت|زمان/i.test(q)) {
        reply = `کلیه اکانت‌های فروشگاه قانونی بوده و مشخصات فعال‌سازی بین (۱ تا ۲۴ ساعت کاری) پس از ثبت سفارش ارسال می‌گردد. همچنین تمام اکانت‌ها تا آخرین روز اشتراک دارای (ضمانت و پشتیبانی تعویض) می‌باشند.`;
      } else if (/اختصاصی|اشتراکی|تفاوت/i.test(q)) {
        reply = `در فروشگاه ما، اکانت‌ها به صورت (اختصاصی روی ایمیل شما) فعال می‌شوند. مزیت اکانت اختصاصی این است که سابقه چت‌های شما کاملاً محرمانه است، هیچ محدودیتی از طرف کاربران دیگر روی مصرف شما اعمال نمی‌شود و قطعی نخواهید داشت.`;
      } else if (currentProductId) {
        const cur = products.find(p => p.id === Number(currentProductId));
        if (cur) {
          reply = `درباره اکانت «${cur.title}»: این سرویس با قیمت پایه (${Number(cur.price).toLocaleString('fa-IR')} تومان) و تحویل (${cur.deliveryTime || '۱ تا ۲۴ ساعت'}) ارائه می‌شود. در صورت تمایل می‌توانید با زدن دکمه خرید سریع در همین صفحه سفارش خود را نهایی کنید. [RECOMMEND:${cur.id}]`;
        }
      }

      if (!reply) {
        const recTags = products.slice(0, 2).map(p => `[RECOMMEND:${p.id}]`).join(' ');
        reply = `سلام! 👋 من مشاور هوشمند فروشگاه Dastyar AI هستم. برای اینکه دقیق‌ترین ابزار یا اکانت را به شما پیشنهاد دهم، بفرمایید برای چه کاری (برنامه‌نویسی، تولید محتوا، ترید یا کارهای گرافیکی) نیاز به هوش مصنوعی دارید؟\n\n${recTags}`;
      }
    }

    // Parse recommended products
    const recommendedProductIds: number[] = [];
    const strippedReply = reply.replace(/\[(?:RECOMMEND|PRODUCT):(\d+)\]/gi, (_, id) => {
      const parsedId = Number(id);
      if (!recommendedProductIds.includes(parsedId)) {
        recommendedProductIds.push(parsedId);
      }
      return '';
    }).trim();

    // Standardize bold/emphasized markers into clean parenthesized text or clean Persian format
    const cleanReply = strippedReply
      .replace(/\*\*([^*]+)\*\*/g, '($1)')
      .replace(/(?:^|\s)\*([^*\n]+)\*(?:\s|$)/g, ' ($1) ')
      .replace(/[*_~`]/g, '')
      .replace(/[ ]{2,}/g, ' ')
      .trim();

    const recommendedProducts = products
      .filter(p => recommendedProductIds.includes(p.id))
      .map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        badge: p.badge,
        category: p.category,
        deliveryTime: p.deliveryTime
      }));

    res.json({
      reply: cleanReply,
      products: recommendedProducts
    });

  } catch (error: any) {
    console.error('[Advisor API Error]:', error);
    res.status(500).json({ error: 'خطایی در برقراری ارتباط با مشاور هوشمند رخ داد.' });
  }
});

// GET /api/store/products
router.get('/products', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const products = db.prepare(`
      SELECT 
        p.*,
        COUNT(CASE WHEN l.status = 'available' THEN 1 END) as stock
      FROM products p 
      LEFT JOIN licenses l ON p.id = l.productId
      WHERE p.category IS NULL OR p.category != 'wallet_topup'
      GROUP BY p.id
      ORDER BY p.id DESC
    `).all();
    res.json(products);
  } catch (error) {
    console.error('[Store API] Error fetching products:', error);
    res.status(500).json({ error: 'خطای سرور' });
  }
});

// GET /api/store/products/:id
router.get('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = db.prepare(`
      SELECT 
        p.*,
        COUNT(CASE WHEN l.status = 'available' THEN 1 END) as stock
      FROM products p 
      LEFT JOIN licenses l ON p.id = l.productId
      WHERE p.id = ?
      GROUP BY p.id
    `).get(id);

    if (!product) {
      return res.status(404).json({ error: 'محصول پیدا نشد' });
    }
    res.json(product);
  } catch (error) {
    console.error('[Store API] Error fetching product:', error);
    res.status(500).json({ error: 'خطای سرور' });
  }
});

// POST /api/store/validate-coupon
router.post('/validate-coupon', requireAuth, (req: any, res) => {
  try {
    const { code, productId, variationId } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'کد تخفیف الزامی است' });
    }

    const cleanCode = code.trim().toUpperCase();
    const promo = db.prepare("SELECT * FROM promo_codes WHERE code = ? AND isActive = 1 AND type = 'discount_percent'").get(cleanCode) as any;

    if (!promo) {
      return res.status(404).json({ error: 'کد تخفیف نامعتبر است یا منقضی شده است' });
    }

    if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
      return res.status(400).json({ error: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است' });
    }

    let basePrice = 0;
    if (productId) {
      const product = db.prepare('SELECT price, variations FROM products WHERE id = ?').get(productId) as any;
      if (product) {
        basePrice = Number(product.price) || 0;
        if (variationId && product.variations) {
          try {
            const parsed = JSON.parse(product.variations);
            const match = parsed.find((v: any) => v.id === variationId);
            if (match && typeof match.price === 'number') {
              basePrice = match.price;
            }
          } catch (_) {}
        }
      }
    }

    const discountPercent = Math.min(100, Math.max(1, Number(promo.value) || 0));
    const discountAmount = basePrice > 0 ? Math.round(basePrice * (discountPercent / 100)) : 0;
    const finalPrice = Math.max(0, basePrice - discountAmount);

    res.json({
      valid: true,
      code: promo.code,
      discountPercent,
      discountAmount,
      finalPrice
    });
  } catch (err) {
    console.error('[Store API] Validate coupon error:', err);
    res.status(500).json({ error: 'خطای سرور در اعتبارسنجی کد تخفیف' });
  }
});

// POST /api/store/checkout
router.post('/checkout', checkoutLimiter, requireAuth, async (req: any, res) => {
  try {
    const { productId, variationId, selectedPeriod, couponCode } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ error: 'شناسه محصول نامعتبر است' });
    }

    // Check if product exists and check stock
    const product = db.prepare(`
      SELECT 
        p.*,
        COUNT(CASE WHEN l.status = 'available' THEN 1 END) as stock
      FROM products p 
      LEFT JOIN licenses l ON p.id = l.productId
      WHERE p.id = ?
      GROUP BY p.id
    `).get(productId) as any;

    if (!product) {
      return res.status(404).json({ error: 'محصول پیدا نشد' });
    }

    if (product.status === 'out_of_stock' || product.status === 'inactive') {
      return res.status(400).json({ error: 'این محصول در حال حاضر غیرفعال یا ناموجود است' });
    }

    if (product.deliveryType === 'instant' && product.stock <= 0) {
      return res.status(400).json({ error: 'موجودی لایسنس آنی این محصول به اتمام رسیده است' });
    }

    // Calculate final price and period based on variations if specified
    let finalPrice = product.price;
    let finalPeriod = selectedPeriod || null;
    if (product.variations) {
      try {
        const parsed = JSON.parse(product.variations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const matched = parsed.find((v: any) => v.id === variationId || v.title === selectedPeriod);
          if (matched && typeof matched.price === 'number') {
            finalPrice = matched.price;
            finalPeriod = matched.title;
          }
        }
      } catch (e) {}
    }

    // Apply promo code discount if provided
    let promoIdToIncrement: number | null = null;
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const promo = db.prepare("SELECT * FROM promo_codes WHERE code = ? AND isActive = 1 AND type = 'discount_percent'").get(cleanCode) as any;
      if (promo && (promo.maxUses === 0 || promo.currentUses < promo.maxUses)) {
        const discountPct = Math.min(100, Math.max(1, Number(promo.value) || 0));
        const discountAmount = Math.round(finalPrice * (discountPct / 100));
        finalPrice = Math.max(0, finalPrice - discountAmount);
        promoIdToIncrement = promo.id;
      }
    }

    // Create an order
    const orderId = 'ORD-' + crypto.randomUUID().split('-')[0].toUpperCase();
    const insertStmt = db.prepare(`
      INSERT INTO orders (id, userId, productId, amount, paymentStatus, paymentMethod, selectedPeriod) 
      VALUES (?, ?, ?, ?, 'pending', 'online', ?)
    `);
    
    insertStmt.run(orderId, userId, productId, finalPrice, finalPeriod);
    if (promoIdToIncrement) {
      db.prepare('UPDATE promo_codes SET currentUses = currentUses + 1 WHERE id = ?').run(promoIdToIncrement);
    }
    syncDatabase();

    const userRow = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as any;
    const isBazaar = req.body.gateway === 'bazaarpay' || 
                     req.headers['x-app-environment'] === 'bazaar' || 
                     req.get('user-agent')?.includes('BazaarVersion') || 
                     Boolean(userRow?.email?.endsWith('@bazaar.guest'));

    const baseUrl = getSafeBaseUrl(req);
    let paymentUrl = `${baseUrl}/api/store/pay?orderId=${orderId}`;
    if (isBazaar) {
      const bazaar = getBazaarPayConfig();
      paymentUrl = bazaar.enabled 
        ? `${baseUrl}/api/store/bazaarpay/pay?orderId=${orderId}` 
        : `${baseUrl}/api/store/mock-payment?orderId=${orderId}&gateway=bazaarpay`;
    } else {
      const zarinpal = getZarinpalConfig();
      if (!zarinpal.enabled) {
        paymentUrl = `${baseUrl}/api/store/mock-payment?orderId=${orderId}`;
      }
    }

    res.json({ message: 'فاکتور ایجاد شد', orderId, paymentUrl });

  } catch (error) {
    console.error('[Store API] Checkout error:', error);
    res.status(500).json({ error: 'خطای سرور در ایجاد فاکتور' });
  }
});

// POST /api/store/wallet-topup
router.post('/wallet-topup', checkoutLimiter, requireAuth, async (req: any, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    const numAmount = parseInt(amount, 10);

    if (isNaN(numAmount) || numAmount < 5000) {
      return res.status(400).json({ error: 'حداقل مبلغ شارژ کیف پول ۵,۰۰۰ تومان است.' });
    }
    if (numAmount > 50_000_000) {
      return res.status(400).json({ error: 'حداکثر مبلغ شارژ ۵۰,۰۰۰,۰۰۰ تومان است.' });
    }

    const productId = getWalletTopupProductId();
    const orderId = 'TOP-' + crypto.randomUUID().split('-')[0].toUpperCase();

    db.prepare(`
      INSERT INTO orders (id, userId, productId, amount, paymentStatus, paymentMethod) 
      VALUES (?, ?, ?, ?, 'pending', 'online')
    `).run(orderId, userId, productId, numAmount);
    syncDatabase();

    const userRow = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as any;
    const isBazaar = req.body.gateway === 'bazaarpay' || 
                     req.headers['x-app-environment'] === 'bazaar' || 
                     req.get('user-agent')?.includes('BazaarVersion') || 
                     Boolean(userRow?.email?.endsWith('@bazaar.guest'));

    const baseUrl = getSafeBaseUrl(req);
    let paymentUrl = `${baseUrl}/api/store/pay?orderId=${orderId}`;
    if (isBazaar) {
      const bazaar = getBazaarPayConfig();
      paymentUrl = bazaar.enabled 
        ? `${baseUrl}/api/store/bazaarpay/pay?orderId=${orderId}` 
        : `${baseUrl}/api/store/mock-payment?orderId=${orderId}&gateway=bazaarpay`;
    } else {
      const zarinpal = getZarinpalConfig();
      if (!zarinpal.enabled) {
        paymentUrl = `${baseUrl}/api/store/mock-payment?orderId=${orderId}`;
      }
    }

    res.json({ message: 'فاکتور شارژ ایجاد شد', orderId, paymentUrl });

  } catch (err) {
    console.error('[Store API] Wallet topup error:', err);
    res.status(500).json({ error: 'خطای سرور در ایجاد فاکتور شارژ' });
  }
});

// POST /api/store/checkout-manual
router.post('/checkout-manual', checkoutLimiter, requireAuth, (req: any, res) => {
  try {
    const { productId, trackingNumber, variationId, selectedPeriod } = req.body;
    const userId = req.user.id;

    if (!productId) return res.status(400).json({ error: 'شناسه محصول نامعتبر است' });
    if (!trackingNumber) return res.status(400).json({ error: 'شماره پیگیری نامعتبر است' });

    const product = db.prepare(`
      SELECT p.*, COUNT(CASE WHEN l.status = 'available' THEN 1 END) as stock
      FROM products p LEFT JOIN licenses l ON p.id = l.productId
      WHERE p.id = ? GROUP BY p.id
    `).get(productId) as any;

    if (!product) return res.status(404).json({ error: 'محصول پیدا نشد' });
    if (product.status === 'out_of_stock' || product.status === 'inactive') {
      return res.status(400).json({ error: 'این محصول در حال حاضر غیرفعال یا ناموجود است' });
    }
    if (product.deliveryType === 'instant' && product.stock <= 0) {
      return res.status(400).json({ error: 'موجودی لایسنس آنی این محصول به اتمام رسیده است' });
    }

    // Calculate final price and period based on variations if specified
    let finalPrice = product.price;
    let finalPeriod = selectedPeriod || null;
    if (product.variations) {
      try {
        const parsed = JSON.parse(product.variations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const matched = parsed.find((v: any) => v.id === variationId || v.title === selectedPeriod);
          if (matched && typeof matched.price === 'number') {
            finalPrice = matched.price;
            finalPeriod = matched.title;
          }
        }
      } catch (e) {}
    }

    const orderId = 'ORD-' + crypto.randomUUID().split('-')[0].toUpperCase();
    
    const insertStmt = db.prepare(`
      INSERT INTO orders (id, userId, productId, amount, paymentStatus, paymentMethod, trackingNumber, selectedPeriod) 
      VALUES (?, ?, ?, ?, 'pending', 'card', ?, ?)
    `);
    
    insertStmt.run(orderId, userId, productId, finalPrice, trackingNumber, finalPeriod);
    syncDatabase();

    res.json({ message: 'فاکتور ایجاد شد', orderId, amount: finalPrice });

  } catch (error) {
    console.error('[Store API] Manual Checkout error:', error);
    res.status(500).json({ error: 'خطای سرور در ثبت پرداخت کارت به کارت' });
  }
});

// GET /api/store/pay (Handles generating payment from a browser to send a strict-origin-when-cross-origin Referer)
router.get('/pay', async (req: any, res) => {
  try {
    const rawOrderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
    if (!rawOrderId || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawOrderId)) {
      return res.status(400).send('شماره سفارش نامعتبر است');
    }
    const orderId = rawOrderId;
    const order = db.prepare(`
      SELECT o.id, o.amount, o.paymentStatus, o.userId, p.title, u.email, u.phone 
      FROM orders o 
      LEFT JOIN products p ON o.productId = p.id
      LEFT JOIN users u ON o.userId = u.id
      WHERE o.id = ?
    `).get(orderId) as any;

    if (!order || order.paymentStatus !== 'pending') {
      return res.redirect('/dashboard?payment=invalid_or_paid');
    }

    const zarinpal = getZarinpalConfig();
    const baseUrl = getSafeBaseUrl(req);

    if (zarinpal.enabled) {
      const zpResult = await requestZarinpalPayment({
        amountToman: order.amount,
        description: `خرید ${order.title || ''} - ${orderId}`,
        callbackUrl: `${baseUrl}/api/store/zarinpal/callback?orderId=${orderId}`,
        mobile: order.phone,
        email: order.email
      });

      if (zpResult.success && zpResult.authority && zpResult.paymentUrl) {
        db.prepare('UPDATE orders SET authority = ? WHERE id = ?').run(zpResult.authority, orderId);
        syncDatabase();
        // Render an HTML page that auto-redirects with strict Referrer-Policy
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="referrer" content="strict-origin-when-cross-origin">
              <title>در حال انتقال به درگاه...</title>
            </head>
            <body>
              <div style="font-family: Tahoma, sans-serif; text-align: center; margin-top: 50px;">
                <p>در حال انتقال به درگاه پرداخت زرین‌پال، لطفاً منتظر بمانید...</p>
                <a id="zarinpalLink" href="${zpResult.paymentUrl}" style="display:none;">پرداخت</a>
              </div>
              <script>
                document.getElementById('zarinpalLink').click();
              </script>
            </body>
          </html>
        `);
      }
    }

    // Fallback to mock payment
    res.redirect(`/api/store/mock-payment?orderId=${orderId}`);
  } catch (error) {
    console.error('[Store API] Pay proxy error:', error);
    res.status(500).send('خطای سرور');
  }
});

// GET /api/store/bazaarpay/pay (Initiate BazaarPay checkout flow)
router.get('/bazaarpay/pay', async (req: any, res) => {
  try {
    const rawOrderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
    if (!rawOrderId || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawOrderId)) {
      return res.status(400).send('شماره سفارش نامعتبر است');
    }
    const orderId = rawOrderId;
    const order = db.prepare(`
      SELECT o.id, o.amount, o.paymentStatus, o.userId, p.title, u.email, u.phone 
      FROM orders o 
      LEFT JOIN products p ON o.productId = p.id
      LEFT JOIN users u ON o.userId = u.id
      WHERE o.id = ?
    `).get(orderId) as any;

    if (!order || order.paymentStatus !== 'pending') {
      return res.redirect('/dashboard?payment=invalid_or_paid');
    }

    const bazaarConfig = getBazaarPayConfig();
    const baseUrl = getSafeBaseUrl(req);

    if (bazaarConfig.enabled) {
      const initResult = await initBazaarCheckout({
        amountToman: order.amount,
        serviceName: `خرید ${order.title || 'شارژ کیف پول'} - ${orderId}`,
        phone: order.phone,
        redirectUrl: `${baseUrl}/api/store/bazaarpay/callback?orderId=${orderId}`
      });

      if (initResult.success && initResult.checkoutToken && initResult.paymentUrl) {
        db.prepare("UPDATE orders SET authority = ?, paymentMethod = 'bazaarpay' WHERE id = ?").run(initResult.checkoutToken, orderId);
        syncDatabase();

        // Redirect directly to BazaarPay payment page
        return res.redirect(initResult.paymentUrl);
      } else {
        console.warn('[Store API] BazaarPay init failed:', initResult.error);
      }
    }

    // Fallback to mock payment with Bazaar branding if credentials are not yet set
    res.redirect(`/api/store/mock-payment?orderId=${orderId}&gateway=bazaarpay`);
  } catch (error) {
    console.error('[Store API] BazaarPay pay error:', error);
    res.status(500).send('خطای سرور');
  }
});

// GET /api/store/mock-payment (Dummy gateway to simulate successful payment)
router.get('/mock-payment', (req: any, res) => {
  const rawOrderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
  const gateway = typeof req.query.gateway === 'string' ? req.query.gateway : 'zarinpal';
  if (!rawOrderId || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawOrderId)) {
    return res.status(400).send('شماره سفارش نامعتبر است');
  }
  const order = db.prepare('SELECT id, amount, paymentStatus, userId, productId FROM orders WHERE id = ?').get(rawOrderId) as any;
  if (!order || order.paymentStatus !== 'pending') {
    return res.status(404).send(`
      <html dir="rtl" lang="fa">
        <head><meta charset="UTF-8"><title>وضعیت سفارش</title></head>
        <body style="font-family: Tahoma, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f4f4f5;">
          <div style="background: white; padding: 30px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h3 style="color: #ef4444;">سفارش یافت نشد یا قبلاً پرداخت شده است.</h3>
            <a href="/dashboard" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">بازگشت به داشبورد</a>
          </div>
        </body>
      </html>
    `);
  }
  const safeOrderId = encodeURIComponent(rawOrderId);
  const formattedAmount = (order.amount || 0).toLocaleString('fa-IR');
  const isBazaar = gateway === 'bazaarpay';
  
  // Create an authentic, beautiful HTML dummy payment page
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isBazaar ? 'درگاه پرداخت بازارپی (محیط آزمایشی کافه‌بازار)' : 'درگاه پرداخت اینترنتی شاپرک (محیط تستی)'}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Tahoma, 'Vazirmatn', sans-serif; background: #0f172a; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); max-width: 440px; width: 100%; overflow: hidden; }
          .header { background: ${isBazaar ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #1e3a8a, #3b82f6)'}; color: white; padding: 24px; text-align: center; }
          .header h2 { margin: 0 0 6px 0; font-size: 18px; font-weight: 800; }
          .header p { margin: 0; font-size: 12px; opacity: 0.85; }
          .body { padding: 24px; }
          .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .info-label { color: #64748b; font-weight: 500; }
          .info-val { font-weight: 700; color: #0f172a; }
          .amount-val { color: #059669; font-size: 18px; font-weight: 900; }
          .badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; display: inline-block; margin-top: 12px; }
          .actions { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
          .btn { display: block; text-align: center; padding: 14px; border-radius: 14px; font-weight: 800; font-size: 14px; text-decoration: none; cursor: pointer; transition: all 0.2s; }
          .btn-success { background: ${isBazaar ? '#10b981' : '#059669'}; color: white; box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.3); }
          .btn-success:hover { background: #047857; transform: translateY(-1px); }
          .btn-danger { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
          .btn-danger:hover { background: #fee2e2; color: #dc2626; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; padding: 0 24px 20px 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2>${isBazaar ? 'درگاه پرداخت مستقیم بازارپی' : 'درگاه پرداخت اینترنتی'}</h2>
            <p>${isBazaar ? 'سرویس پرداخت درون‌برنامه‌ای کافه‌بازار (شبیه‌ساز تستی)' : 'شبکه الکترونیکی پرداخت کارت (شاپرک) - شبیه‌ساز امن'}</p>
          </div>
          <div class="body">
            <div class="info-row">
              <span class="info-label">پذیرنده:</span>
              <span class="info-val">دستیار هوشمند (Fa-Chatbox)</span>
            </div>
            <div class="info-row">
              <span class="info-label">شماره سفارش:</span>
              <span class="info-val" style="font-family: monospace; letter-spacing: 0.5px;">${safeOrderId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">مبلغ قابل پرداخت:</span>
              <span class="amount-val">${formattedAmount} تومان</span>
            </div>
            <div style="text-align: center;">
              <span class="badge">⚡ حالت آزمایشی / شبیه‌ساز پرداخت</span>
            </div>
            <div class="actions">
              <a href="/api/store/mock-callback?orderId=${safeOrderId}&gateway=${encodeURIComponent(gateway)}&status=success" class="btn btn-success">
                ✓ تایید و پرداخت موفقیت‌آمیز ${isBazaar ? '(بازارپی)' : ''}
              </a>
              <a href="/api/store/mock-callback?orderId=${safeOrderId}&gateway=${encodeURIComponent(gateway)}&status=failed" class="btn btn-danger">
                انصراف و بازگشت
              </a>
            </div>
          </div>
          <div class="footer">
            ${isBazaar ? 'اتصال امن زیرساخت بازارپی کافه‌بازار' : 'اتصال امن رمزنگاری‌شده شاپرک'}
          </div>
        </div>
      </body>
    </html>
  `);
});

// GET /api/store/mock-callback (Handles the return from Dummy gateway)
router.get('/mock-callback', async (req: any, res) => {
  const rawOrderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const gateway = typeof req.query.gateway === 'string' ? req.query.gateway : 'zarinpal';
  
  if (!rawOrderId || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawOrderId)) {
    return res.redirect('/dashboard?payment=failed');
  }
  const orderId = rawOrderId;

  if (status === 'success') {
    try {
      const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?');
      const order = orderStmt.get(orderId) as any;
      
      if (!order || order.paymentStatus !== 'pending') {
        return res.redirect('/dashboard?payment=already_processed');
      }

      const refId = gateway === 'bazaarpay' ? 'MOCK-BAZAARPAY' : 'MOCK-SHAPARAK';
      const payMethod = gateway === 'bazaarpay' ? 'bazaarpay' : 'online';

      // Check if wallet top-up or digital pricing plan
      const isWalletTopup = order.id.startsWith('TOP-') || order.productId === getWalletTopupProductId();
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(order.productId) as any;
      const isPlan = product?.category === 'plan';

      if (isWalletTopup || isPlan) {
        const { creditAmount, descSuffix } = calculateWalletCredit(order.amount, isWalletTopup, product);
        const desc = isPlan 
          ? `خرید ${product?.title || 'بسته تعرفه'} - سفارش ${orderId}`
          : `شارژ آنلاین کیف پول کاربری (${gateway === 'bazaarpay' ? 'بازارپی' : 'شاپرک'}) - سفارش ${orderId}${descSuffix}`;

        const updateRes = db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = ?, refId = ? WHERE id = ? AND paymentStatus != 'success'").run(payMethod, refId, orderId);
        if (updateRes.changes === 1) {
          depositWallet(order.userId, creditAmount, desc);
          syncDatabase();
          notifyAdminWalletTopup(orderId, order.userId, creditAmount, gateway === 'bazaarpay' ? 'بازارپی' : 'درگاه پرداخت آنلاین', refId);
        }
        if (gateway === 'bazaarpay') {
          return res.redirect(`/?payment=success&orderId=${orderId}&refId=${refId}&amount=${creditAmount}`);
        }
        return res.redirect(`/dashboard?tab=wallet&payment=success&orderId=${orderId}&refId=${refId}&amount=${creditAmount}`);
      }

      // Digital store product
      fulfillDigitalOrder(orderId, order, product, payMethod, undefined, refId);
      res.redirect('/dashboard?payment=success&orderId=' + orderId);
    } catch (err) {
      console.error(err);
      if (gateway === 'bazaarpay') {
        return res.redirect('/?payment=failed');
      }
      res.redirect('/dashboard?payment=failed');
    }
  } else {
    // Failed payment
    const payMethod = gateway === 'bazaarpay' ? 'bazaarpay' : 'online';
    db.prepare('UPDATE orders SET paymentStatus = ?, paymentMethod = ? WHERE id = ?').run('failed', payMethod, orderId);
    syncDatabase();
    if (gateway === 'bazaarpay') {
      return res.redirect('/?payment=cancelled');
    }
    res.redirect('/dashboard?payment=cancelled');
  }
});

// GET /api/store/zarinpal/callback (Handles the return from real Zarinpal gateway)
router.get('/zarinpal/callback', async (req, res) => {
  const rawOrderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
  const authority = typeof req.query.Authority === 'string' ? req.query.Authority : '';
  const status = typeof req.query.Status === 'string' ? req.query.Status : '';

  if (!rawOrderId || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawOrderId)) {
    return res.redirect('/store?payment=failed&msg=invalid_order');
  }
  const orderId = rawOrderId;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) {
    return res.redirect('/store?payment=failed&msg=order_not_found');
  }

  // Already verified and successful
  if (order.paymentStatus === 'success') {
    if (order.id.startsWith('TOP-') || order.productId === getWalletTopupProductId()) {
      return res.redirect(`/store?tab=wallet&payment=success&orderId=${orderId}&refId=${order.refId || ''}`);
    }
    return res.redirect(`/store?payment=success&orderId=${orderId}&refId=${order.refId || ''}`);
  }

  // User cancelled or payment not OK
  if (status !== 'OK' || !authority) {
    db.prepare("UPDATE orders SET paymentStatus = 'failed', paymentMethod = 'zarinpal' WHERE id = ?").run(orderId);
    syncDatabase();
    return res.redirect(`/store?payment=failed&orderId=${orderId}`);
  }

  try {
    const verifyRes = await verifyZarinpalPayment({
      amountToman: order.amount,
      authority
    });

    if (verifyRes.success && (verifyRes.code === 100 || verifyRes.code === 101)) {
      const refId = String(verifyRes.refId || '');
      const cardPan = verifyRes.cardPan || '';

      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(order.productId) as any;
      const isWalletTopup = order.id.startsWith('TOP-') || order.productId === getWalletTopupProductId();
      const isPlan = product?.category === 'plan';

      if (isWalletTopup || isPlan) {
        const { creditAmount, descSuffix } = calculateWalletCredit(order.amount, isWalletTopup, product);
        const desc = isPlan 
          ? `خرید آنلاین ${product?.title || 'بسته تعرفه'} - شماره تراکنش: ${refId}`
          : `شارژ آنلاین کیف پول از طریق زرین‌پال - شماره تراکنش: ${refId}${descSuffix}`;

        const updateRes = db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = 'zarinpal', authority = ?, refId = ?, cardPan = ? WHERE id = ? AND paymentStatus != 'success'")
          .run(authority, refId, cardPan, orderId);

        if (updateRes.changes === 1) {
          depositWallet(order.userId, creditAmount, desc);
          syncDatabase();
          notifyAdminWalletTopup(orderId, order.userId, creditAmount, 'زرین‌پال (شاپرک)', refId);

          // Telegram delivery notification
          try {
            const orderUser = db.prepare('SELECT telegramId FROM users WHERE id = ?').get(order.userId) as any;
            if (orderUser?.telegramId && bot) {
              let msg = `✅ **پرداخت شما با موفقیت انجام شد!**\n\n` +
                        `📦 **پلن خریداری‌شده:** ${product?.title || ''}\n` +
                        `💰 **اعتبار شارژشده به کیف پول:** ${creditAmount.toLocaleString('fa-IR')} تومان\n` +
                        `🔢 **شماره سفارش:** \`${orderId}\`\n` +
                        `🧾 **کد پیگیری شاپرک:** \`${refId}\`\n\n` +
                        `اعتبار این بسته بلافاصله به کیف پول شما اضافه شد و در محیط چت فعال است.`;
              bot.telegram.sendMessage(orderUser.telegramId, msg, { parse_mode: 'Markdown' }).catch(() => {});
            }
          } catch (tgErr) {}

          // SMS notification
          notifyOrderSuccessBySms(orderId, null);
        }

        return res.redirect(`/dashboard?tab=wallet&payment=success&orderId=${orderId}&refId=${refId}&amount=${creditAmount}`);
      }

      // Digital store product
      fulfillDigitalOrder(orderId, order, product, 'zarinpal', authority, refId, cardPan);
      return res.redirect(`/dashboard?payment=success&orderId=${orderId}&refId=${refId}`);
    } else {
      db.prepare("UPDATE orders SET paymentStatus = 'failed', paymentMethod = 'zarinpal', authority = ? WHERE id = ?")
        .run(authority, orderId);
      syncDatabase();
      const errMsg = encodeURIComponent(verifyRes.error || 'پرداخت مورد تایید قرار نگرفت');
      return res.redirect(`/store?payment=failed&orderId=${orderId}&msg=${errMsg}`);
    }
  } catch (err: any) {
    console.error('[Store] Error in Zarinpal callback:', err);
    return res.redirect(`/store?payment=failed&orderId=${orderId}`);
  }
});

// GET /api/store/bazaarpay/callback (Handles the return from BazaarPay checkout)
router.get('/bazaarpay/callback', async (req: any, res) => {
  const rawOrderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
  const checkoutToken = typeof req.query.checkout_token === 'string' 
    ? req.query.checkout_token 
    : typeof req.query.token === 'string' 
      ? req.query.token 
      : '';

  if (!rawOrderId || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawOrderId)) {
    return res.redirect('/store?payment=failed&msg=invalid_order');
  }
  const orderId = rawOrderId;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) {
    return res.redirect('/store?payment=failed&msg=order_not_found');
  }

  // Already verified and successful
  if (order.paymentStatus === 'success') {
    if (order.id.startsWith('TOP-') || order.productId === getWalletTopupProductId()) {
      return res.redirect(`/store?tab=wallet&payment=success&orderId=${orderId}&refId=${order.refId || ''}`);
    }
    return res.redirect(`/store?payment=success&orderId=${orderId}&refId=${order.refId || ''}`);
  }

  const tokenToTrace = checkoutToken || order.authority;
  if (!tokenToTrace) {
    db.prepare("UPDATE orders SET paymentStatus = 'failed', paymentMethod = 'bazaarpay' WHERE id = ?").run(orderId);
    syncDatabase();
    return res.redirect(`/store?payment=failed&orderId=${orderId}&msg=missing_token`);
  }

  try {
    const traceRes = await traceBazaarPayment(tokenToTrace);

    if (!traceRes.success) {
      db.prepare("UPDATE orders SET paymentStatus = 'failed', paymentMethod = 'bazaarpay' WHERE id = ?").run(orderId);
      syncDatabase();
      const errMsg = encodeURIComponent(traceRes.error || 'استعلام پرداخت با خطا مواجه شد');
      return res.redirect(`/store?payment=failed&orderId=${orderId}&msg=${errMsg}`);
    }

    // Check trace status
    // 'paid_committed': already committed
    // 'paid_not_committed': paid, merchant must commit now!
    if (traceRes.status === 'paid_committed' || traceRes.status === 'paid_not_committed') {
      if (traceRes.status === 'paid_not_committed') {
        const commitRes = await commitBazaarPayment(tokenToTrace);
        if (!commitRes.success) {
          console.error('[Store] BazaarPay commit failed for order:', orderId, commitRes.error);
          db.prepare("UPDATE orders SET paymentStatus = 'failed', paymentMethod = 'bazaarpay' WHERE id = ?").run(orderId);
          syncDatabase();
          return res.redirect(`/store?payment=failed&orderId=${orderId}&msg=commit_failed`);
        }
      }

      const refId = String(tokenToTrace);
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(order.productId) as any;
      const isWalletTopup = order.id.startsWith('TOP-') || order.productId === getWalletTopupProductId();
      const isPlan = product?.category === 'plan';

      if (isWalletTopup || isPlan) {
        const { creditAmount, descSuffix } = calculateWalletCredit(order.amount, isWalletTopup, product);
        const desc = isPlan 
          ? `خرید آنلاین ${product?.title || 'بسته تعرفه'} از طریق بازارپی - شماره پیگیری: ${refId}`
          : `شارژ آنلاین کیف پول از طریق بازارپی کافه‌بازار - شماره پیگیری: ${refId}${descSuffix}`;

        const updateRes = db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = 'bazaarpay', authority = ?, refId = ? WHERE id = ? AND paymentStatus != 'success'")
          .run(tokenToTrace, refId, orderId);

        if (updateRes.changes === 1) {
          depositWallet(order.userId, creditAmount, desc);
          syncDatabase();
          notifyAdminWalletTopup(orderId, order.userId, creditAmount, 'بازارپی', refId);

          // Telegram delivery notification
          try {
            const orderUser = db.prepare('SELECT telegramId FROM users WHERE id = ?').get(order.userId) as any;
            if (orderUser?.telegramId && bot) {
              let msg = `✅ **پرداخت از طریق بازارپی با موفقیت انجام شد!**\n\n` +
                        `📦 **پلن/خدمت:** ${product?.title || 'شارژ کیف پول'}\n` +
                        `💰 **اعتبار شارژشده به کیف پول:** ${creditAmount.toLocaleString('fa-IR')} تومان\n` +
                        `🔢 **شماره سفارش:** \`${orderId}\`\n` +
                        `🧾 **کد پیگیری بازارپی:** \`${refId}\`\n\n` +
                        `اعتبار بلافاصله به کیف پول شما در کافه‌بازار افزوده شد.`;
              bot.telegram.sendMessage(orderUser.telegramId, msg, { parse_mode: 'Markdown' }).catch(() => {});
            }
          } catch (tgErr) {}

          // SMS notification
          notifyOrderSuccessBySms(orderId, null);
        }

        // Generate auto-login JWT token for WebView session persistence
        let authTokenParam = '';
        try {
          const orderUser = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(order.userId) as any;
          if (orderUser) {
            const jwtToken = jwt.sign(
              { id: orderUser.id, email: orderUser.email, name: orderUser.name, role: orderUser.role },
              JWT_SECRET,
              { expiresIn: '30d' }
            );
            authTokenParam = `&auth_token=${encodeURIComponent(jwtToken)}`;
          }
        } catch (_) {}

        return res.redirect(`/store?tab=wallet&payment=success&orderId=${orderId}&refId=${refId}&amount=${creditAmount}${authTokenParam}`);
      }

      // Digital store product
      fulfillDigitalOrder(orderId, order, product, 'bazaarpay', tokenToTrace, refId);
      return res.redirect(`/store?payment=success&orderId=${orderId}&refId=${refId}`);

    } else {
      // Payment failed/unpaid/cancelled
      db.prepare("UPDATE orders SET paymentStatus = 'failed', paymentMethod = 'bazaarpay', authority = ? WHERE id = ?")
        .run(tokenToTrace, orderId);
      syncDatabase();
      const statusNote = traceRes.status === 'unpaid' ? 'پرداخت انجام نشد یا لغو شد' : `وضعیت: ${traceRes.status}`;
      return res.redirect(`/store?payment=failed&orderId=${orderId}&msg=${encodeURIComponent(statusNote)}`);
    }

  } catch (err: any) {
    console.error('[Store] Error in BazaarPay callback:', err);
    return res.redirect(`/store?payment=failed&orderId=${orderId}`);
  }
});

// GET /api/store/purchases
router.get('/purchases', requireAuth, (req: any, res) => {
  try {
    const userId = req.user.id;
    const purchases = db.prepare(`
      SELECT 
        o.id as orderId,
        o.amount,
        o.paymentStatus,
        o.paymentMethod,
        o.fulfillmentStatus,
        o.selectedPeriod,
        o.refId,
        o.trackingNumber,
        o.createdAt as orderDate,
        p.id as productId,
        p.title,
        p.category,
        p.image,
        p.description,
        p.deliveryGuide,
        p.deliveryTime,
        l.key as licenseKey
      FROM orders o
      JOIN products p ON o.productId = p.id
      LEFT JOIN licenses l ON o.licenseId = l.id
      WHERE o.userId = ?
      ORDER BY o.createdAt DESC
    `).all(userId);
    
    res.json(purchases);
  } catch (error) {
    console.error('[Store API] Error fetching purchases:', error);
    res.status(500).json({ error: 'خطای سرور' });
  }
});

// POST /api/store/redeem
router.post('/redeem', requireAuth, (req: any, res) => {
  try {
    const { licenseKey } = req.body;
    const userId = req.user.id;

    if (!licenseKey || typeof licenseKey !== 'string') {
      return res.status(400).json({ error: 'کد لایسنس نامعتبر است' });
    }

    // Find the license
    const license = db.prepare('SELECT * FROM licenses WHERE key = ?').get(licenseKey.trim()) as any;
    if (!license) {
      return res.status(404).json({ error: 'لایسنس یافت نشد' });
    }

    // Find the associated order if any
    const order = db.prepare("SELECT * FROM orders WHERE licenseId = ? AND paymentStatus = 'success'").get(license.id) as any;

    if (order) {
      if (order.userId === userId) {
        return res.status(400).json({ error: 'این لایسنس قبلاً در حساب شما ثبت شده است' });
      }
      // Transfer the order to this user (they are linking their purchase to their web account)
      db.prepare('UPDATE orders SET userId = ? WHERE id = ?').run(userId, order.id);
      syncDatabase();
      return res.json({ message: 'لایسنس با موفقیت به حساب شما متصل شد' });
    } else {
      // If it's an 'available' license that was never sold (e.g. admin gave it directly)
      if (license.status === 'available') {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(license.productId) as any;
        const orderId = 'RDM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        
        try {
          db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run('sold', license.id);
          db.prepare(`
            INSERT INTO orders (id, userId, productId, licenseId, amount, paymentStatus) 
            VALUES (?, ?, ?, ?, ?, 'success')
          `).run(orderId, userId, license.productId, license.id, product ? product.price : 0);
          syncDatabase();
          return res.json({ message: 'لایسنس با موفقیت فعال و در حساب شما ثبت شد' });
        } catch (err) {
          throw err;
        }
      } else {
        return res.status(400).json({ error: 'وضعیت لایسنس نامشخص است یا لایسنس معتبر نیست.' });
      }
    }
  } catch (error) {
    console.error('[Store API] Error redeeming license:', error);
    res.status(500).json({ error: 'خطای سرور در فعال‌سازی کد' });
  }
});

// ==================== PRODUCT REVIEWS (ANTI-SPAM) ====================

// GET /api/store/products/:id/reviews (Public approved reviews)
router.get('/products/:id/reviews', (req, res) => {
  try {
    const { id } = req.params;
    const reviews = db.prepare(`
      SELECT 
        r.id, r.rating, r.comment, r.reply, r.createdAt, r.userId,
        u.name as userName, u.email as userEmail
      FROM product_reviews r
      LEFT JOIN users u ON r.userId = u.id
      WHERE r.productId = ? AND r.status = 'approved'
      ORDER BY r.id DESC
      LIMIT 50
    `).all(id) as any[];

    // Check verified buyer for each review
    const verifiedStmt = db.prepare(`
      SELECT COUNT(*) as c FROM orders 
      WHERE userId = ? AND productId = ? AND paymentStatus = 'success'
    `);

    const sanitized = reviews.map(r => {
      const isVerified = (verifiedStmt.get(r.userId, id) as any)?.c > 0;
      const displayName = r.userName?.trim() || (r.userEmail ? r.userEmail.split('@')[0] : 'کاربر دستیار');
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reply: r.reply,
        createdAt: r.createdAt,
        userName: displayName,
        isVerifiedBuyer: isVerified
      };
    });

    res.json(sanitized);
  } catch (error) {
    console.error('[Store API] Error fetching product reviews:', error);
    res.status(500).json({ error: 'خطای سرور در دریافت دیدگاه‌ها' });
  }
});

// GET /api/store/products/:id/rating-summary
router.get('/products/:id/rating-summary', (req, res) => {
  try {
    const { id } = req.params;
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalReviews,
        AVG(rating) as averageRating
      FROM product_reviews
      WHERE productId = ? AND status = 'approved'
    `).get(id) as any;

    res.json({
      totalReviews: stats?.totalReviews || 0,
      averageRating: stats?.averageRating ? Number(Number(stats.averageRating).toFixed(1)) : 5.0
    });
  } catch (error) {
    console.error('[Store API] Error fetching rating summary:', error);
    res.status(500).json({ totalReviews: 0, averageRating: 5.0 });
  }
});

// POST /api/store/products/:id/reviews (Auth required, anti-spam protected, pending moderation)
router.post('/products/:id/reviews', requireAuth, (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'امتیاز باید عددی بین ۱ تا ۵ باشد.' });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
      return res.status(400).json({ error: 'متن دیدگاه باید حداقل ۵ کاراکتر باشد.' });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({ error: 'متن دیدگاه نمی‌تواند بیش از ۱۰۰۰ کاراکتر باشد.' });
    }

    // Anti-spam link detector
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|t\.me\/[^\s]+|[a-zA-Z0-9_-]+\.(com|ir|org|net|io|me))/i;
    if (urlPattern.test(comment)) {
      return res.status(400).json({ error: 'درج هرگونه لینک یا نشانی وبسایت و تلگرام در متن دیدگاه غیرمجاز است.' });
    }

    // Rate-limiting per user per product (1 review per 10 minutes)
    const recent = db.prepare(`
      SELECT id FROM product_reviews 
      WHERE productId = ? AND userId = ? AND createdAt >= datetime('now', '-10 minutes')
    `).get(id, userId);

    if (recent) {
      return res.status(429).json({ error: 'شما به تازگی یک دیدگاه ثبت کرده‌اید. لطفاً چند دقیقه دیگر تلاش کنید.' });
    }

    db.prepare(`
      INSERT INTO product_reviews (productId, userId, rating, comment, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(id, userId, numRating, comment.trim());

    syncDatabase();

    res.json({
      success: true,
      message: 'دیدگاه شما با موفقیت ثبت شد و پس از بررسی و تایید تیم پشتیبانی در سایت نمایش داده خواهد شد.'
    });

  } catch (error) {
    console.error('[Store API] Error submitting product review:', error);
    res.status(500).json({ error: 'خطای سرور در ثبت دیدگاه' });
  }
});

export default router;

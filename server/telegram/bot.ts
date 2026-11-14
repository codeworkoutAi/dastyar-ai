import { Telegraf, Markup } from 'telegraf';
import crypto from 'crypto';
import db, { syncDatabase } from '../db/database';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import jwt from 'jsonwebtoken';
import { telegramAuthSessions, JWT_SECRET } from '../services/telegramAuthSessions';
import { getZarinpalConfig } from '../services/zarinpalService';

export let bot: Telegraf<any> | null = null;

export function getTelegramBot(): Telegraf<any> | null {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    startTelegramBot();
  }
  return bot;
}
const RLM = '\u200F';
const pendingCheckouts = new Map<string, string>(); // tgId -> productId
// pendingReceipts now persisted in DB (telegram_pending_receipts table)
const activeSupportUsers = new Set<string>(); // Users currently in support mode
const adminMessageMap = new Map<number, string>(); // Maps admin message IDs to user telegram IDs

// Helper functions for pending receipts (DB-backed)
async function setPendingReceipt(tgId: string, orderId: string) {
  try {
    db.prepare('INSERT OR REPLACE INTO telegram_pending_receipts (tgId, orderId) VALUES (?, ?)').run(tgId, orderId);
    syncDatabase();
  } catch (e) {
    console.error('[Telegram] Failed to set pending receipt:', e);
  }
}

async function getPendingReceipt(tgId: string): Promise<string | null> {
  try {
    const row = db.prepare('SELECT orderId FROM telegram_pending_receipts WHERE tgId = ?').get(tgId) as any;
    return row?.orderId || null;
  } catch (e) {
    console.error('[Telegram] Failed to get pending receipt:', e);
    return null;
  }
}

async function deletePendingReceipt(tgId: string) {
  try {
    db.prepare('DELETE FROM telegram_pending_receipts WHERE tgId = ?').run(tgId);
    syncDatabase();
  } catch (e) {
    console.error('[Telegram] Failed to delete pending receipt:', e);
  }
}

export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log('[Telegram] TELEGRAM_BOT_TOKEN not provided, bot is disabled.');
    return;
  }

  const rawProxy = (process.env.PROXY_URL || '').trim();
  const isProduction = process.env.NODE_ENV === 'production';
  // In production (Render), skip proxies pointing to localhost — they only work in local dev
  const isLocalProxy = rawProxy.includes('127.0.0.1') || rawProxy.includes('localhost') || rawProxy.includes('::1');
  const proxyUrl = (rawProxy && !(isProduction && isLocalProxy)) ? rawProxy : '';

  let agent;
  if (proxyUrl) {
    console.log(`[Telegram] Using proxy: ${proxyUrl}`);
    if (proxyUrl.startsWith('socks')) {
      agent = new SocksProxyAgent(proxyUrl);
    } else {
      agent = new HttpsProxyAgent(proxyUrl);
    }
  } else {
    if (rawProxy && isProduction && isLocalProxy) {
      console.log('[Telegram] PROXY_URL points to localhost — skipped in production, connecting directly.');
    } else {
      console.log('[Telegram] No proxy configured, connecting directly.');
    }
  }

  bot = new Telegraf(token, {
    telegram: {
      agent: agent
    }
  });

  // Global Middleware to ensure user exists in DB before any action
  bot.use(async (ctx, next) => {
    if (ctx.from && ctx.from.id) {
      const tgId = ctx.from.id.toString();
      const name = ctx.from.first_name || 'کاربر';
      try {
        const existingUser = db.prepare('SELECT id FROM users WHERE telegramId = ?').get(tgId);
        if (!existingUser) {
          db.prepare("INSERT INTO users (telegramId, name, source) VALUES (?, ?, 'telegram')").run(tgId, name);
          // Fire and forget sync
          syncDatabase();
        }
      } catch (err) {
        console.error('[Bot] Middleware DB error:', err);
      }
    }
    await next();
  });

  // Start Command
  bot.start(async (ctx) => {
    const tgId = ctx.from.id.toString();
    const name = ctx.from.first_name || 'کاربر';

    // Reset support/other interactive state on start
    try {
      db.prepare("UPDATE users SET botState = 'normal' WHERE telegramId = ?").run(tgId);
    } catch (e) { }

    // Check if start payload is for Web Login confirmation
    const payload = (ctx as any).payload || (ctx.message && 'text' in ctx.message ? (ctx.message.text as string).split(' ')[1] : '') || '';
    if (payload && payload.startsWith('auth_')) {
      const sessionToken = payload.replace('auth_', '').trim();
      const session = telegramAuthSessions.get(sessionToken);
      if (!session || Date.now() - session.createdAt > 5 * 60 * 1000) {
        return ctx.reply('⚠️ <b>این لینک ورود منقضی شده است.</b>\nلطفاً به وب‌سایت بازگردید و مجدداً روی ورود با تلگرام کلیک کنید.', { parse_mode: 'HTML' });
      }

      return ctx.reply(
        `🔐 <b>درخواست ورود به وب‌سایت دستیار هوشمند</b>\n\n` +
        `سلام ${ctx.from.first_name || 'کاربر'} عزیز،\nآیا تایید می‌کنید که با این حساب تلگرام وارد حساب کاربری خود در وب‌سایت شوید؟`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ تایید و ورود به سایت', callback_data: `tg_auth_confirm_${sessionToken}` }],
              [{ text: '❌ انصراف', callback_data: `tg_auth_cancel_${sessionToken}` }]
            ]
          }
        }
      );
    }

    const welcomeMsg =
      `${RLM}🌟 <b>سلام ${name} عزیز، به دستیار هوشمند خوش آمدید!</b>\n\n` +
      `${RLM}مرجع تخصصی خدمات و دسترسی به برترین ابزارها و مدل‌های هوش مصنوعی.\n\n` +
      `${RLM}📌 <b>امکانات در دسترس شما:</b>\n` +
      `${RLM}🛍 <b>محصولات هوش مصنوعی:</b> مشاهده و خرید آنی اکانت، لایسنس و کلید API\n` +
      `${RLM}💬 <b>چت هوشمند:</b> گفتگو با قوی‌ترین مدل‌های هوش مصنوعی در وب‌سایت\n` +
      `${RLM}🌐 <b>فروشگاه وب‌سایت:</b> دسترسی به فروشگاه کامل در وب‌سایت\n` +
      `${RLM}📰 <b>وبلاگ و آموزش‌ها:</b> جدیدترین مقالات، آموزش‌ها و اخبار هوش مصنوعی\n\n` +
      `${RLM}👇 برای شروع یکی از گزینه‌های زیر را انتخاب کنید:`;

    await ctx.reply(welcomeMsg, {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: '🛍 محصولات هوش مصنوعی' }, { text: '💬 چت با هوش مصنوعی' }],
          [{ text: '🌐 فروشگاه وب‌سایت' }, { text: '📰 وبلاگ و آموزش‌ها' }],
          [{ text: '📢 عضویت در کانال ما' }, { text: '☎️ ارتباط با پشتیبانی' }]
        ],
        resize_keyboard: true
      }
    });
  });

  // Reset Command for testing
  bot.command('reset', async (ctx) => {
    const tgId = ctx.from.id.toString();
    const dummyEmail = `tg_${tgId}@telegram.local`;
    db.prepare('UPDATE users SET email = ?, phone = NULL WHERE telegramId = ?').run(dummyEmail, tgId);
    pendingCheckouts.delete(tgId);
    activeSupportUsers.delete(tgId);
    await ctx.reply('🔄 اطلاعات تماس شما (ایمیل و شماره موبایل) و وضعیت‌های ربات پاک شد. می‌توانید فرآیند خرید یا تست را مجدداً آغاز کنید.');
  });


  function getWebsiteUrl(): string {
    const envUrl = (process.env.WEBSITE_URL || process.env.WEB_URL || process.env.APP_URL || '').trim();
    if (envUrl && envUrl.startsWith('http') && !envUrl.includes('MY_APP_URL')) {
      return envUrl.replace(/\/$/, '');
    }
    return 'http://localhost:3000';
  }

  function getProductPhotoSource(p: any): any {
    // Prioritize square 1:1 image so all Telegram card photos are uniform and consistent
    const img = p.image || p.bannerImage;
    if (img && typeof img === 'string') {
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img;
      }
      if (img.startsWith('data:image/')) {
        const base64Data = img.replace(/^data:image\/\w+;base64,/, '');
        return { source: Buffer.from(base64Data, 'base64') };
      }
    }
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
  }

  async function sendStoreShowcase(ctx: any, page: number = 0, isEdit: boolean = false) {
    try {
      const products = db.prepare(`
      SELECT p.*, COUNT(CASE WHEN l.status = 'available' THEN 1 END) as stock
      FROM products p 
      LEFT JOIN licenses l ON p.id = l.productId
      GROUP BY p.id
      ORDER BY p.id DESC
    `).all() as any[];

      if (products.length === 0) {
        const emptyMsg = 'در حال حاضر محصولی در فروشگاه موجود نیست.';
        if (isEdit) await ctx.editMessageText(emptyMsg).catch(() => { });
        else await ctx.reply(emptyMsg);
        return;
      }

      // Ensure page is within bounds
      if (page < 0) page = products.length - 1;
      if (page >= products.length) page = 0;

      const p = products[page];
      const priceFa = Number(p.price || 0).toLocaleString('fa-IR');
      const isOutOfStock = p.category !== 'package' && (p.stock || 0) <= 0;
      const stockText = p.category !== 'package'
        ? (p.stock > 0 ? `${Number(p.stock).toLocaleString('fa-IR')} عدد موجود` : 'اتمام موجودی ❌')
        : 'نامحدود ♾';
      const catText = p.category === 'api' ? 'کلید API' : p.category === 'account' ? 'اکانت پرمیوم' : 'پکیج آموزشی';

      const caption = `${RLM}🏪 <b>ویترین فروشگاه محصولات</b>\n\n` +
        `${RLM}📦 <b>${p.title}</b>\n` +
        `${RLM}🏷 <b>دسته:</b> ${catText}  |  📊 <b>موجودی:</b> ${stockText}\n` +
        `${RLM}💰 <b>قیمت:</b> <b>${priceFa} تومان</b>\n\n` +
        `${RLM}محصول ${page + 1} از ${products.length}`;

      const buyButton = isOutOfStock
        ? [Markup.button.callback('❌ این محصول ناموجود است', 'noop')]
        : [Markup.button.callback('💳 خرید و دریافت لایسنس', `buy_${p.id}`)];

      const keyboard = [buyButton];

      if (products.length > 1) {
        keyboard.push([
          Markup.button.callback('➡️ بعدی', `store_page_${(page + 1) % products.length}`),
          Markup.button.callback('⬅️ قبلی', `store_page_${(page - 1 + products.length) % products.length}`)
        ]);
      }

      const photoSource = getProductPhotoSource(p);

      if (isEdit) {
        try {
          await ctx.editMessageMedia(
            { type: 'photo', media: photoSource, caption, parse_mode: 'HTML' },
            { reply_markup: { inline_keyboard: keyboard } }
          );
        } catch (editErr) {
          // If edit fails (e.g. same content), just ignore or re-send
          // But usually it's fine unless they click the same button
        }
        ctx.answerCbQuery().catch(() => { });
      } else {
        try {
          await ctx.replyWithPhoto(photoSource, {
            caption,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard }
          });
        } catch (photoErr) {
          await ctx.reply(caption, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard }
          });
        }
      }
    } catch (err: any) {
      console.error('[Telegram] Store showcase error:', err);
      ctx.reply('خطا در بارگذاری فروشگاه: ' + (err.message || err)).catch(() => { });
    }
  }

  // Main Menu Handlers
  bot.hears(['🛍 محصولات هوش مصنوعی', '🛍 فروشگاه محصولات', 'فروشگاه'], async (ctx) => {
    await sendStoreShowcase(ctx, 0, false);
  });

  bot.hears(['🌐 فروشگاه وب‌سایت', '🌐 فروشگاه سایت', 'فروشگاه سایت'], (ctx) => {
    const siteUrl = getWebsiteUrl();
    ctx.reply(
      `${RLM}🏪 <b>فروشگاه آنلاین وب‌سایت</b>\n\n` +
      `${RLM}برای مشاهده تمامی محصولات، پکیج‌ها و خرید مستقیم از طریق وب‌سایت، روی دکمه زیر کلیک کنید:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.url('🌐 ورود مستقیم به فروشگاه سایت', `${siteUrl}/store`)]
          ]
        }
      }
    );
  });

  bot.hears(['📰 وبلاگ و آموزش‌ها', '📰 وبلاگ سایت', 'وبلاگ'], (ctx) => {
    const siteUrl = getWebsiteUrl();
    ctx.reply(
      `${RLM}📰 <b>وبلاگ و مجله تخصصی هوش مصنوعی</b>\n\n` +
      `${RLM}برای مطالعه جدیدترین مقالات، اخبار و آموزش‌های کاربردی هوش مصنوعی، روی دکمه زیر کلیک کنید:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.url('📖 ورود به وبلاگ و مقالات', `${siteUrl}/blog`)]
          ]
        }
      }
    );
  });

  bot.hears('📢 عضویت در کانال ما', (ctx) => {
    const channel = process.env.TELEGRAM_CHANNEL_ID || '@MyChannel';
    const channelLink = channel.startsWith('@') ? `https://t.me/${channel.substring(1)}` : channel;

    ctx.reply(`برای اطلاع از آخرین اخبار، مقالات و اطلاعیه‌ها، به کانال رسمی ما بپیوندید:\n\n${channelLink}`, {
      reply_markup: {
        inline_keyboard: [
          [Markup.button.url('عضویت در کانال', channelLink)]
        ]
      }
    });
  });

  const getMainMenuMarkup = () => ({
    keyboard: [
      [{ text: '🛍 محصولات هوش مصنوعی' }, { text: '💬 چت با هوش مصنوعی' }],
      [{ text: '🌐 فروشگاه وب‌سایت' }, { text: '📰 وبلاگ و آموزش‌ها' }],
      [{ text: '📢 عضویت در کانال ما' }, { text: '☎️ ارتباط با پشتیبانی' }]
    ],
    resize_keyboard: true
  });

  bot.hears('💬 چت با هوش مصنوعی', (ctx) => {
    const webUrl = getWebsiteUrl();
    ctx.reply(
      `💬 <b>چت با دستیار هوشمند Dastyar AI</b>\n\n` +
      `شما می‌توانید در وب‌سایت به صورت مستقیم با هوش مصنوعی گفتگو کنید، برنامه‌نویسی کنید و فایل‌ها و اسناد خود را تحلیل نمایید.\n\n` +
      `✨ <b>چت برای همه کاربران ثبت‌نامی کاملاً نامحدود و رایگان است!</b>\n` +
      `کاربران مهمان نیز می‌توانند تا ۱۵ پیام رایگان چت کنند.\n\n` +
      `👇 برای شروع روی دکمه زیر کلیک کنید:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 شروع چت هوشمند در وب‌سایت', url: `${webUrl}/chat` }]
          ]
        }
      }
    );
  });

  bot.hears('☎️ ارتباط با پشتیبانی', (ctx) => {
    const tgId = ctx.from?.id.toString();
    if (!tgId) return;
    try {
      db.prepare("UPDATE users SET botState = 'support' WHERE telegramId = ?").run(tgId);
    } catch (e) { }
    ctx.reply(
      `${RLM}🎧 **ارتباط مستقیم با پشتیبانی**\n\n` +
      `${RLM}شما به بخش پشتیبانی متصل شدید. لطفاً سوال یا مشکل خود را به صورت پیام متنی، صوتی و یا تصویر ارسال کنید.\n` +
      `${RLM}پیام‌های ارسالی شما مستقیماً به مدیریت تحویل داده خواهد شد.\n\n` +
      `${RLM}⚠️ **برای پایان گفتگو و بازگشت به منوی ربات، هر زمان می‌توانید روی «❌ پایان پشتیبانی» کلیک کنید.**`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '❌ پایان پشتیبانی' }]
          ],
          resize_keyboard: true,
          is_persistent: true
        }
      }
    );
  });

  const handleExitSupport = async (ctx: any) => {
    const tgId = ctx.from?.id.toString();
    if (tgId) {
      try {
        db.prepare("UPDATE users SET botState = 'normal' WHERE telegramId = ?").run(tgId);
      } catch (e) { }
    }

    await ctx.reply('✅ از حالت پشتیبانی خارج شدید. چطور می‌توانم کمکتان کنم؟', {
      reply_markup: getMainMenuMarkup()
    });
  };

  bot.hears(['❌ پایان پشتیبانی', 'پایان پشتیبانی', 'پایان', 'خروج'], handleExitSupport);
  bot.command(['cancel', 'end', 'exit', 'stop'], handleExitSupport);

  bot.action('end_support', async (ctx) => {
    const tgId = ctx.from?.id.toString();
    if (tgId) {
      try {
        db.prepare("UPDATE users SET botState = 'normal' WHERE telegramId = ?").run(tgId);
      } catch (e) { }
    }
    try {
      await ctx.answerCbQuery('گفتگو با پشتیبانی پایان یافت.');
    } catch (e) { }
    await ctx.reply('✅ از حالت پشتیبانی خارج شدید و به منوی اصلی بازگشتید.', {
      reply_markup: getMainMenuMarkup()
    });
  });

  // Show individual product details when clicked from grid
  bot.action(/show_prod_(\d+)/, async (ctx) => {
    const productId = ctx.match[1];
    try {
      const product = db.prepare(`
        SELECT p.*, COUNT(CASE WHEN l.status = 'available' THEN 1 END) as stock
        FROM products p 
        LEFT JOIN licenses l ON p.id = l.productId
        WHERE p.id = ?
        GROUP BY p.id
      `).get(productId) as any;

      if (!product) return ctx.answerCbQuery('محصول پیدا نشد!');

      const priceFa = Number(product.price || 0).toLocaleString('fa-IR');
      const isOutOfStock = product.category !== 'package' && (product.stock || 0) <= 0;
      const stockText = product.category !== 'package'
        ? (product.stock > 0 ? `${product.stock.toLocaleString('fa-IR')} عدد موجود` : 'ناموجود ❌')
        : 'نامحدود (پکیج)';

      const categoryName = product.category === 'api' ? 'کلید API' : product.category === 'account' ? 'اکانت پرمیوم' : 'پکیج آموزشی';

      const caption = `${RLM}📦 <b>${product.title}</b>\n` +
        `${RLM}🏷 <b>دسته:</b> ${categoryName}\n\n` +
        `${RLM}📝 <b>توضیحات:</b>\n${product.description || 'توضیحی ثبت نشده است.'}\n\n` +
        `${RLM}💰 <b>قیمت:</b> ${priceFa} تومان\n` +
        `${RLM}📊 <b>موجودی:</b> ${stockText}`;

      const buyButton = isOutOfStock
        ? [Markup.button.callback('❌ این محصول در حال حاضر ناموجود است', 'noop')]
        : [Markup.button.callback('💳 خرید و دریافت فاکتور', `buy_${product.id}`)];

      const keyboard = [
        buyButton,
        [Markup.button.callback('🔙 بازگشت به ویترین فروشگاه', 'back_to_store')]
      ];

      const photoSource = getProductPhotoSource(product);

      await ctx.deleteMessage().catch(() => { });
      await ctx.replyWithPhoto(photoSource, {
        caption,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
      ctx.answerCbQuery();
    } catch (err) {
      console.error('[Telegram] Show product error:', err);
      ctx.answerCbQuery('خطا در نمایش محصول!');
    }
  });

  // No-op for indicator buttons
  bot.action('noop', (ctx) => {
    ctx.answerCbQuery().catch(() => { });
  });

  bot.action('back_to_store', async (ctx) => {
    await sendStoreShowcase(ctx, 0, true);
  });

  bot.action(/store_page_(\d+)/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10);
    await sendStoreShowcase(ctx, page, true);
  });

  // Buy Product (Create Order & Send Payment Link)
  bot.action(/buy_(\d+)/, async (ctx) => {
    const productId = ctx.match[1];
    const tgId = ctx.from?.id.toString();

    if (!tgId) return ctx.answerCbQuery('خطا در شناسایی کاربر!');

    try {
      const user = db.prepare('SELECT * FROM users WHERE telegramId = ?').get(tgId) as any;
      if (!user) return ctx.answerCbQuery('لطفا ابتدا ربات را /start کنید.');

      const product = db.prepare(`
        SELECT p.*, COUNT(CASE WHEN l.status = 'available' THEN 1 END) as stock
        FROM products p 
        LEFT JOIN licenses l ON p.id = l.productId
        WHERE p.id = ?
        GROUP BY p.id
      `).get(productId) as any;

      if (!product) return ctx.answerCbQuery('محصول پیدا نشد!');
      if (product.category !== 'package' && product.stock <= 0) {
        return ctx.answerCbQuery('موجودی محصول به اتمام رسیده است.', { show_alert: true });
      }

      const hasRealContact = (user.email && !user.email.endsWith('@telegram.local')) || user.phone;
      if (!hasRealContact) {
        pendingCheckouts.set(tgId, productId);
        try {
          await ctx.deleteMessage().catch(() => { });
        } catch (_) { }
        return ctx.reply(
          'جهت ثبت سفارش، لطفاً **ایمیل** معتبر خود را در همین چت تایپ کرده و ارسال کنید و یا از طریق دکمه زیر شماره موبایل خود را به اشتراک بگذارید:',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: [
                [{ text: '📱 ارسال شماره موبایل', request_contact: true }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
      }

      await createOrderAndSendInvoice(ctx, user, product);
    } catch (err) {
      console.error('[Telegram] Buy error:', err);
      ctx.answerCbQuery('خطا در صدور فاکتور!');
    }
  });

  async function createOrderAndSendInvoice(ctx: any, user: any, product: any) {
    // Create Order
    const orderId = 'ORD-' + crypto.randomUUID().split('-')[0].toUpperCase();
    const insertStmt = db.prepare(`
      INSERT INTO orders (id, userId, productId, amount, paymentStatus) 
      VALUES (?, ?, ?, ?, 'pending')
    `);
    insertStmt.run(orderId, user.id, product.id, product.price);
    syncDatabase();

    // Determine environment URL (Custom Domain, Render, Production, or Localhost)
    const rawUrl = getWebsiteUrl();
    const isOnlineUrl = Boolean(
      rawUrl &&
      rawUrl.startsWith('http') &&
      !rawUrl.includes('localhost') &&
      !rawUrl.includes('127.0.0.1')
    );

    const priceFa = Number(product.price || 0).toLocaleString('fa-IR');
    const invoiceText = `${RLM}🧾 **فاکتور خرید محصول**\n\n` +
      `${RLM}📦 **محصول:** ${product.title}\n` +
      `${RLM}🔢 **شماره سفارش:** \`${orderId}\`\n` +
      `${RLM}💰 **مبلغ قابل پرداخت:** ${priceFa} تومان\n\n` +
      (isOnlineUrl
        ? `جهت پرداخت، روی دکمه درگاه پرداخت کلیک کنید:`
        : `جهت ثبت فاکتور و ارسال به پنل مدیریت برای بررسی و تأیید، روی دکمه زیر بزنید:`);

    const keyboardButtons: any[] = [];

    if (isOnlineUrl) {
      let paymentUrl = `${rawUrl}/api/store/pay?orderId=${orderId}`;
      const zarinpal = getZarinpalConfig();
      if (!zarinpal.enabled) {
        paymentUrl = `${rawUrl}/api/store/mock-payment?orderId=${orderId}`;
      }
      keyboardButtons.push([Markup.button.url('💳 پرداخت آنلاین (زرین‌پال / شتاب)', paymentUrl)]);
      keyboardButtons.push([Markup.button.callback('💳 پرداخت کارت به کارت', `c2c_${orderId}`)]);
    } else {
      // Local/Direct request submission button
      keyboardButtons.push([Markup.button.callback('📤 ثبت و ارسال به مدیریت جهت تأیید', `submit_order_${orderId}`)]);
    }
    keyboardButtons.push([Markup.button.callback('🔙 بازگشت به فروشگاه', 'back_to_store')]);

    try {
      await ctx.reply(invoiceText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboardButtons
        }
      });
    } catch (sendError) {
      // Fallback in case Telegram rejects URL button
      console.warn('[Telegram] Falling back to text invoice due to:', sendError);
      await ctx.reply(invoiceText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('📤 ثبت و ارسال به مدیریت جهت تأیید', `submit_order_${orderId}`)],
            [Markup.button.callback('🔙 بازگشت به فروشگاه', 'back_to_store')]
          ]
        }
      });
    }
  }

  // Handler for submitting order for admin approval (both submit_order and simpay)
  bot.action(/(?:submit_order|simpay)_(.+)/, async (ctx) => {
    const orderId = ctx.match[1];
    try {
      const order = db.prepare(`
        SELECT o.*, p.title as productTitle, p.price as productPrice 
        FROM orders o 
        LEFT JOIN products p ON o.productId = p.id 
        WHERE o.id = ?
      `).get(orderId) as any;

      if (!order) {
        return ctx.answerCbQuery('سفارش یافت نشد!');
      }

      if (order.paymentStatus === 'success') {
        return ctx.answerCbQuery('این سفارش قبلاً تایید شده است.');
      }

      const priceFa = Number(order.productPrice || 0).toLocaleString('fa-IR');
      const pendingMsg = `${RLM}⏳ **درخواست خرید شما با موفقیت ثبت شد.**\n\n` +
        `${RLM}📦 **محصول:** ${order.productTitle || 'سفارش شما'}\n` +
        `${RLM}🔢 **شماره سفارش:** \`${orderId}\`\n` +
        `${RLM}💰 **مبلغ:** ${priceFa} تومان\n` +
        `${RLM}📋 **وضعیت:** 🟡 **در انتظار تأیید مدیریت**\n\n` +
        `💡 *سفارش شما در سیستم ثبت شد و برای مدیریت ارسال گردید. به محض بررسی و تأیید توسط ادمین در پنل، کد لایسنس به صورت خودکار در همین چت تلگرام برای شما ارسال خواهد شد.*`;

      await ctx.editMessageText(pendingMsg, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('🛍 بازگشت به فروشگاه', 'back_to_store')]
          ]
        }
      });

      ctx.answerCbQuery('درخواست شما برای بررسی مدیریت ثبت شد ✅');
    } catch (err) {
      console.error('[Telegram] Submit order error:', err);
      ctx.answerCbQuery('خطا در ثبت درخواست!');
    }
  });

  // Handler for Card to Card payment
  bot.action(/^c2c_(.+)$/, async (ctx) => {
    const orderId = ctx.match[1];
    const tgId = ctx.from.id.toString();
    await setPendingReceipt(tgId, orderId);

    const c2cMessage =
      `💳 **پرداخت کارت به کارت**\n\n` +
      `لطفاً مبلغ فاکتور را به شماره کارت زیر واریز نمایید:\n\n` +
      `💳 \`5894-6311-1590-7644\`\n` +
      `👤 به نام: علی ابراهیمی قرخلو (بانک رفاه)\n\n` +
      `📸 **پس از واریز، لطفاً عکس فیش واریزی خود را دقیقاً در همین چت ارسال کنید.**`;

    await ctx.reply(c2cMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[Markup.button.callback('انصراف و بازگشت', 'back_to_store')]]
      }
    });
    await ctx.answerCbQuery();
  });

  // Handler for Web Login Confirmation
  bot.action(/^tg_auth_confirm_(.+)$/, async (ctx) => {
    try {
      const sessionToken = ctx.match[1];
      const session = telegramAuthSessions.get(sessionToken);

      if (!session || Date.now() - session.createdAt > 5 * 60 * 1000) {
        await ctx.answerCbQuery('این نشست ورود منقضی شده است. لطفاً دوباره از سایت اقدام کنید.', { show_alert: true });
        return ctx.editMessageText('⚠️ <b>نشست ورود منقضی شده است.</b> لطفاً از وب‌سایت مجدداً تلاش کنید.', { parse_mode: 'HTML' });
      }

      if (session.status === 'authenticated') {
        await ctx.answerCbQuery('این نشست قبلاً تایید شده است.');
        return;
      }

      const tgId = ctx.from.id.toString();
      const name = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || 'کاربر تلگرام';
      const username = ctx.from.username;

      let user = db.prepare('SELECT * FROM users WHERE telegramId = ?').get(tgId) as any;
      if (!user) {
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
        const { count } = countStmt.get() as { count: number };
        const role = count === 0 ? 'admin' : 'user';
        const email = username ? `${username}@telegram.local` : `tg_${tgId}@telegram.local`;
        const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${tgId}`;

        const insertStmt = db.prepare("INSERT INTO users (telegramId, email, name, avatar, role, source) VALUES (?, ?, ?, ?, ?, 'telegram')");
        const info = insertStmt.run(tgId, email, name, defaultAvatar, role);
        syncDatabase();
        user = { id: info.lastInsertRowid, telegramId: tgId, email, name, avatar: defaultAvatar, role, source: 'telegram' };
      }

      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      session.status = 'authenticated';
      session.jwtToken = jwtToken;
      session.user = { id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role };

      await ctx.answerCbQuery('✅ ورود شما با موفقیت تایید شد!');
      await ctx.editMessageText(
        `✅ <b>ورود شما با موفقیت تأیید شد!</b>\n\nاکنون می‌توانید به مرورگر خود بازگردید؛ به طور خودکار وارد حساب کاربری خود شده‌اید.`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error('[Telegram] Auth confirmation error:', err);
      await ctx.answerCbQuery('خطا در تایید ورود.');
    }
  });

  // Handler for Web Login Cancel
  bot.action(/^tg_auth_cancel_(.+)$/, async (ctx) => {
    try {
      const sessionToken = ctx.match[1];
      telegramAuthSessions.delete(sessionToken);
      await ctx.answerCbQuery('درخواست ورود لغو شد.');
      await ctx.editMessageText('❌ <b>درخواست ورود لغو شد.</b>', { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[Telegram] Auth cancel error:', err);
      await ctx.answerCbQuery('خطا در لغو درخواست.');
    }
  });

  bot.command('chatid', (ctx) => {
    ctx.reply(`آیدی این چت/گروه:\n\`${ctx.chat.id}\``, { parse_mode: 'Markdown' });
  });

  bot.on('message', async (ctx: any) => {
    const tgId = ctx.from?.id.toString();
    if (!tgId) return;

    const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';

    // Check if waiting for receipt photo
    const pendingOrderId = await getPendingReceipt(tgId);
    if (pendingOrderId) {
      if (ctx.message.photo || ctx.message.document) {
        await deletePendingReceipt(tgId);

        if (ADMIN_ID) {
          const order = db.prepare('SELECT o.*, p.title as productTitle, p.price as productPrice FROM orders o LEFT JOIN products p ON o.productId = p.id WHERE o.id = ?').get(pendingOrderId) as any;
          const priceFa = Number(order?.productPrice || 0).toLocaleString('fa-IR');

          await ctx.telegram.sendMessage(ADMIN_ID, `🧾 **فیش واریزی جدید (کارت به کارت)**\n\n📦 **محصول:** ${order?.productTitle}\n💰 **مبلغ:** ${priceFa} تومان\n🔢 **سفارش:** \`${pendingOrderId}\`\n👤 **کاربر:** ${ctx.from.first_name}\n🆔 **آیدی:** \`${tgId}\``, { parse_mode: 'Markdown' });
          await ctx.telegram.copyMessage(ADMIN_ID, ctx.chat.id, ctx.message.message_id);
        }

        return ctx.reply('✅ فیش واریزی شما دریافت شد و جهت بررسی برای مدیریت ارسال گردید.\n\nپس از تایید مدیریت در پنل ادمین، لایسنس شما به صورت خودکار ارسال خواهد شد.');
      } else {
        return ctx.reply('لطفاً فقط عکس فیش واریزی را ارسال کنید.');
      }
    }

    // Check if the sender is admin replying to a support message
    const isAdminChat = ctx.chat.id.toString() === ADMIN_ID;

    if (ADMIN_ID && isAdminChat && ctx.message.reply_to_message) {
      let targetUserId = adminMessageMap.get(ctx.message.reply_to_message.message_id);

      // Fallback: If bot restarted and map was cleared, try to extract ID from the replied text
      if (!targetUserId && ctx.message.reply_to_message.text) {
        const match = ctx.message.reply_to_message.text.match(/آیدی:\s*(\d+)/);
        if (match && match[1]) {
          targetUserId = match[1];
        }
      }

      // Fallback 2: If replied to the forwarded message directly and user privacy allows
      if (!targetUserId && ctx.message.reply_to_message.forward_from) {
        targetUserId = ctx.message.reply_to_message.forward_from.id.toString();
      }

      if (targetUserId) {
        try {
          await ctx.telegram.copyMessage(targetUserId, ctx.chat.id, ctx.message.message_id);
          return ctx.reply('✅ پاسخ شما به کاربر ارسال شد.', { reply_to_message_id: ctx.message.message_id });
        } catch (err) {
          console.error('[Telegram] Failed to send reply to user:', err);
          return ctx.reply('❌ ارسال پاسخ ناموفق بود (ممکن است کاربر ربات را بلاک کرده باشد).');
        }
      }
    }

    // If this is an admin group (not a private chat), ignore other text messages so the bot doesn't spam or forward them
    if (isAdminChat && ctx.chat.type !== 'private') {
      return;
    }

    if (pendingCheckouts.has(tgId)) {
      const productId = pendingCheckouts.get(tgId);
      const contactText = ctx.message.text || '';
      const contactObj = ctx.message.contact;

      let phone = null;
      let email = null;

      if (contactObj) {
        phone = contactObj.phone_number;
      } else if (contactText.includes('@')) {
        email = contactText;
      } else if (/^\d{10,14}$/.test(contactText.replace('+', ''))) {
        phone = contactText;
      } else {
        return ctx.reply('فرمت نامعتبر است. لطفاً ایمیل صحیح یا شماره موبایل ارسال کنید.');
      }

      try {
        if (email) {
          db.prepare('UPDATE users SET email = ? WHERE telegramId = ?').run(email, tgId);
        } else if (phone) {
          db.prepare('UPDATE users SET phone = ? WHERE telegramId = ?').run(phone, tgId);
        }
        pendingCheckouts.delete(tgId);
        await ctx.reply('✅ اطلاعات تماس شما با موفقیت ثبت شد.', { reply_markup: { remove_keyboard: true } });

        const user = db.prepare('SELECT * FROM users WHERE telegramId = ?').get(tgId) as any;
        const product = db.prepare(`SELECT p.*, COUNT(CASE WHEN l.status = 'available' THEN 1 END) as stock FROM products p LEFT JOIN licenses l ON p.id = l.productId WHERE p.id = ? GROUP BY p.id`).get(productId) as any;

        if (product) {
          await createOrderAndSendInvoice(ctx, user, product);
        }
      } catch (err) {
        console.error('[Telegram] Contact save error:', err);
        return ctx.reply('خطا در ثبت اطلاعات. این ایمیل/شماره ممکن است قبلاً ثبت شده باشد.');
      }
      return;
    }

    // Check if user is in support mode
    let isSupport = false;
    try {
      const u = db.prepare('SELECT botState FROM users WHERE telegramId = ?').get(tgId) as any;
      if (u && u.botState === 'support') {
        isSupport = true;
      }
    } catch (e) { }

    if (isSupport) {
      const textMsg = ((ctx.message as any)?.text || '').trim();
      const exitWords = ['❌ پایان پشتیبانی', 'پایان پشتیبانی', 'پایان', 'خروج', '/cancel', '/end', '/exit', '/stop'];
      if (exitWords.includes(textMsg)) {
        try {
          db.prepare("UPDATE users SET botState = 'normal' WHERE telegramId = ?").run(tgId);
        } catch (e) { }
        return ctx.reply('✅ از حالت پشتیبانی خارج شدید. چطور می‌توانم کمکتان کنم؟', {
          reply_markup: getMainMenuMarkup()
        });
      }

      const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';
      if (!ADMIN_ID) {
        return ctx.reply('سیستم پشتیبانی در حال حاضر فعال نیست.');
      }
      try {
        const header = await ctx.telegram.sendMessage(ADMIN_ID, `📩 **پیام جدید از پشتیبانی**\n👤 کاربر: ${ctx.from?.first_name || 'ناشناس'}\n🆔 آیدی: \`${tgId}\``, { parse_mode: 'Markdown' });
        const forwarded = await ctx.telegram.copyMessage(ADMIN_ID, ctx.chat.id, ctx.message.message_id);

        // Map both the header and the forwarded message to the user
        adminMessageMap.set(header.message_id, tgId);
        adminMessageMap.set(forwarded.message_id, tgId);

        return ctx.reply(
          '✅ **پیام شما برای مدیریت ارسال شد.**\n' +
          'منتظر پاسخ مدیریت بمانید. هر زمان که مایل بودید می‌توانید با دکمه زیر به منوی اصلی بازگردید:',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '❌ پایان پشتیبانی و بازگشت به منو', callback_data: 'end_support' }]
              ]
            }
          }
        );
      } catch (err) {
        console.error('[Telegram] Failed to forward support message:', err);
        return ctx.reply('❌ خطا در ارتباط با سیستم پشتیبانی.');
      }
    }

    // Default message handler for users who didn't press start or sent random text
    const text = ctx.message.text || '';
    if (text && !text.startsWith('/')) {
      const name = ctx.from?.first_name || 'کاربر';
      const welcomeMsg =
        `${RLM}🌟 **سلام ${name} عزیز، به دستیار هوشمند خوش آمدید!**\n\n` +
        `${RLM}جهت مشاهده محصولات، از دکمه‌های زیر استفاده کنید:`;

      await ctx.reply(welcomeMsg, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            ['🛍 محصولات هوش مصنوعی'],
            ['🌐 فروشگاه وب‌سایت', '📰 وبلاگ و آموزش‌ها'],
            ['💬 چت با هوش مصنوعی', '📢 عضویت در کانال ما'],
            ['☎️ ارتباط با پشتیبانی']
          ],
          resize_keyboard: true
        }
      });
    }
  });

  bot.launch().then(() => {
    console.log('[Telegram] Bot started successfully');
  }).catch(err => {
    console.error('[Telegram] Bot failed to start:', err);
  });

  // Enable graceful stop
  process.once('SIGINT', () => {
    try { bot?.stop('SIGINT'); } catch (e) { }
  });
  process.once('SIGTERM', () => {
    try { bot?.stop('SIGTERM'); } catch (e) { }
  });
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildCurlSnippet(rawInput: string, licenseKey: string): string {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return '';

  // Extract endpoint URL
  let targetUrl = '';
  const urlMatch = trimmed.match(/--url\s+["']?([^"'\s\\]+)["']?/i) || trimmed.match(/https?:\/\/[^\s"'\\]+/i);
  if (urlMatch) {
    targetUrl = urlMatch[1] || urlMatch[0];
  } else {
    targetUrl = trimmed;
  }
  // Strip trailing slashes, quotes, or dashes
  targetUrl = targetUrl.replace(/["';\\]+$/, '').replace(/\/$/, '');

  // Extract model name if provided in rawInput
  let modelName = 'gpt-5.6-luna';
  const modelMatch = trimmed.match(/"model"\s*:\s*"([^"]+)"/i);
  if (modelMatch && modelMatch[1]) {
    modelName = modelMatch[1];
  }

  // Extract sample message content if provided
  let contentMsg = 'سلام! چطوری؟';
  const contentMatch = trimmed.match(/"content"\s*:\s*"([^"]+)"/i);
  if (contentMatch && contentMatch[1]) {
    contentMsg = contentMatch[1].trim();
  }

  return `curl --request POST \\\n` +
    `  --url "${targetUrl}" \\\n` +
    `  --header "Authorization: Bearer ${licenseKey}" \\\n` +
    `  --header "Content-Type: application/json" \\\n` +
    `  --data '{\n` +
    `    "model": "${modelName}",\n` +
    `    "messages": [\n` +
    `      {\n` +
    `        "role": "user",\n` +
    `        "content": "${contentMsg}"\n` +
    `      }\n` +
    `    ]\n` +
    `  }'`;
}

export async function sendTelegramOrderSuccess(orderId: string, licenseId: number | bigint | null) {
  try {
    if (!bot) {
      console.warn('[Telegram] bot instance is null, cannot send order success notification');
      return;
    }

    const orderInfo = db.prepare(`
      SELECT o.*, u.telegramId, p.title as productTitle, p.baseUrl, p.deliveryGuide
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      LEFT JOIN products p ON o.productId = p.id
      WHERE o.id = ?
    `).get(orderId) as any;

    if (orderInfo?.telegramId) {
      let msg = `${RLM}🎉 <b>سفارش شما با موفقیت توسط مدیریت تأیید شد!</b>\n\n` +
        `${RLM}📦 <b>محصول:</b> ${orderInfo.productTitle || 'سفارش شما'}\n` +
        `${RLM}🔢 <b>شماره سفارش:</b> <code>${orderId}</code>\n\n`;

      const activeLicenseId = licenseId || orderInfo.licenseId;
      if (activeLicenseId) {
        const lic = db.prepare('SELECT key FROM licenses WHERE id = ?').get(activeLicenseId) as any;
        if (lic?.key) {
          msg += `${RLM}🔑 <b>کد لایسنس شما:</b>\n<code>${lic.key}</code>\n\n`;

          if (orderInfo.baseUrl) {
            const curlCode = buildCurlSnippet(orderInfo.baseUrl, lic.key);
            msg += `${RLM}🔗 <b>راهنمای استفاده از API:</b>\n` +
              `جهت استفاده از سرویس، می‌توانید از نمونه کد cURL زیر استفاده کنید:\n\n` +
              `<pre><code class="language-shell">${escapeHtml(curlCode)}</code></pre>\n\n`;
          }

          if (orderInfo.deliveryGuide) {
            msg += `${RLM}📖 <b>راهنمای تحویل:</b>\n${orderInfo.deliveryGuide}\n\n`;
          }

          msg += `💡 <i>این لایسنس برای شما ثبت شده و در صورت نیاز از طریق وب‌سایت در بخش «ردیم کد» نیز قابل استفاده است.</i>`;
        }
      } else {
        const isTopup = orderInfo.id?.startsWith('TOP-') || orderInfo.productCategory === 'wallet_topup' || orderInfo.productCategory === 'plan';
        if (isTopup) {
          msg += `${RLM}💰 <b>موجودی کیف پول شما با موفقیت شارژ شد!</b>\n` +
                 `اعتبار افزوده شده هم‌اکنون در حساب کاربری شما فعال و آماده استفاده در محیط چت است.\n\n`;
        } else {
          msg += `${RLM}✅ سفارش شما تایید و فعال شد.\n\n`;
        }
        if (orderInfo.deliveryGuide) {
          msg += `${RLM}📖 <b>راهنمای تحویل:</b>\n${orderInfo.deliveryGuide}\n\n`;
        }
      }

      await bot.telegram.sendMessage(orderInfo.telegramId, msg, { parse_mode: 'HTML' });
      console.log(`[Telegram] Order success notification sent to user ${orderInfo.telegramId}`);
    }
  } catch (err) {
    console.error('[Telegram] Telegram notification error:', err);
  }
}

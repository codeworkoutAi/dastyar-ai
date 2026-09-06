import { Telegraf, Markup } from 'telegraf';
import db from '../db/database';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

export let bot: Telegraf<any> | null = null;
const pendingCheckouts = new Map<string, string>(); // tgId -> productId
const activeSupportUsers = new Set<string>(); // Users currently in support mode
const adminMessageMap = new Map<number, string>(); // Maps admin message IDs to user telegram IDs

export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.log('[Telegram] TELEGRAM_BOT_TOKEN not provided, bot is disabled.');
    return;
  }

  const proxyUrl = (process.env.PROXY_URL || '').trim();
  let agent;
  if (proxyUrl) {
    console.log(`[Telegram] Using proxy: ${proxyUrl}`);
    if (proxyUrl.startsWith('socks')) {
      agent = new SocksProxyAgent(proxyUrl);
    } else {
      agent = new HttpsProxyAgent(proxyUrl);
    }
  } else {
    console.log('[Telegram] No proxy configured, connecting directly.');
  }

  bot = new Telegraf(token, {
    telegram: {
      agent: agent
    }
  });

  // Start Command
  bot.start(async (ctx) => {
    const tgId = ctx.from.id.toString();
    const name = ctx.from.first_name || 'کاربر';

    // Register or get user
    let user = db.prepare('SELECT * FROM users WHERE telegramId = ?').get(tgId) as any;
    if (!user) {
      const email = `tg_${tgId}@telegram.local`; // Dummy email to bypass sqlite limitations if any
      const insertStmt = db.prepare('INSERT INTO users (telegramId, email, name, role) VALUES (?, ?, ?, ?)');
      const info = insertStmt.run(tgId, email, name, 'user');
      user = { id: info.lastInsertRowid, telegramId: tgId, name };
    }

    const welcomeMsg = 
      `${RLM}🌟 **سلام ${name} عزیز، به دستیار هوشمند خوش آمدید!**\n\n` +
      `${RLM}مرجع تخصصی خدمات و دسترسی به برترین ابزارها و مدل‌های هوش مصنوعی.\n\n` +
      `${RLM}📌 **امکانات در دسترس شما:**\n` +
      `${RLM}🛍 **محصولات هوش مصنوعی:** مشاهده و خرید آنی اکانت، لایسنس و کلید API\n` +
      `${RLM}💬 **چت هوشمند:** گفتگو با قوی‌ترین مدل‌های هوش مصنوعی در وب‌سایت\n` +
      `${RLM}🌐 **فروشگاه وب‌سایت:** دسترسی به فروشگاه کامل در وب‌سایت\n` +
      `${RLM}📰 **وبلاگ و آموزش‌ها:** جدیدترین مقالات، آموزش‌ها و اخبار هوش مصنوعی\n\n` +
      `${RLM}👇 برای شروع یکی از گزینه‌های زیر را انتخاب کنید:`;

    await ctx.reply(welcomeMsg, {
      parse_mode: 'Markdown',
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

const RLM = '\u200F';

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
      if (isEdit) await ctx.editMessageText(emptyMsg).catch(() => {});
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
      ctx.answerCbQuery().catch(() => {});
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
    ctx.reply('خطا در بارگذاری فروشگاه: ' + (err.message || err)).catch(() => {});
  }
}

  // Main Menu Handlers
  bot.hears(['🛍 محصولات هوش مصنوعی', '🛍 فروشگاه محصولات', 'فروشگاه'], async (ctx) => {
    await sendStoreShowcase(ctx, false);
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

  bot.hears('💬 چت با هوش مصنوعی', (ctx) => {
    ctx.reply('برای استفاده از چت هوشمند، باید لایسنس فعال داشته باشید. از بخش "فروشگاه" یک لایسنس تهیه کنید.');
  });

  bot.hears('☎️ ارتباط با پشتیبانی', (ctx) => {
    const tgId = ctx.from?.id.toString();
    if (!tgId) return;
    activeSupportUsers.add(tgId);
    ctx.reply(
      `${RLM}🎧 **ارتباط با پشتیبانی**\n\n` +
      `${RLM}شما به بخش پشتیبانی متصل شدید. لطفاً سوال یا مشکل خود را به صورت پیام متنی، صوتی و یا تصویر ارسال کنید.\n` +
      `${RLM}مدیریت در اسرع وقت پاسخگوی شما خواهد بود.\n\n` +
      `${RLM}برای خروج از حالت پشتیبانی، روی دکمه زیر کلیک کنید.`, 
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '❌ پایان پشتیبانی' }]
          ],
          resize_keyboard: true
        }
      }
    );
  });

  bot.hears('❌ پایان پشتیبانی', (ctx) => {
    const tgId = ctx.from?.id.toString();
    if (tgId) activeSupportUsers.delete(tgId);
    
    ctx.reply('شما از حالت پشتیبانی خارج شدید. چطور می‌توانم کمکتان کنم؟', {
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

      const caption = `${RLM}📦 **${product.title}**\n` +
                      `${RLM}🏷 **دسته:** ${categoryName}\n\n` +
                      `${RLM}📝 **توضیحات:**\n${product.description || 'توضیحی ثبت نشده است.'}\n\n` +
                      `${RLM}💰 **قیمت:** ${priceFa} تومان\n` +
                      `${RLM}📊 **موجودی:** ${stockText}`;

      const buyButton = isOutOfStock
        ? [Markup.button.callback('❌ این محصول در حال حاضر ناموجود است', 'noop')]
        : [Markup.button.callback('💳 خرید و دریافت فاکتور', `buy_${product.id}`)];

      const keyboard = [
        buyButton,
        [Markup.button.callback('🔙 بازگشت به ویترین فروشگاه', 'back_to_store')]
      ];

      const photoSource = getProductPhotoSource(product);

      await ctx.deleteMessage().catch(() => {});
      await ctx.replyWithPhoto(photoSource, {
        caption,
        parse_mode: 'Markdown',
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
    ctx.answerCbQuery().catch(() => {});
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
          await ctx.deleteMessage().catch(() => {});
        } catch (_) {}
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
    const orderId = 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const insertStmt = db.prepare(`
      INSERT INTO orders (id, userId, productId, amount, paymentStatus) 
      VALUES (?, ?, ?, ?, 'pending')
    `);
    insertStmt.run(orderId, user.id, product.id, product.price);

    // Determine environment URL (Render, Production, or Localhost)
    const rawUrl = (process.env.WEB_URL || process.env.APP_URL || '').trim();
    const isOnlineUrl = Boolean(
      rawUrl &&
      (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) &&
      !rawUrl.includes('localhost') &&
      !rawUrl.includes('127.0.0.1') &&
      !rawUrl.includes('MY_APP_URL')
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
      const cleanBaseUrl = rawUrl.replace(/\/$/, '');
      const paymentUrl = `${cleanBaseUrl}/api/store/mock-payment?orderId=${orderId}`;
      keyboardButtons.push([Markup.button.url('💳 انتقال به درگاه پرداخت', paymentUrl)]);
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

  bot.command('chatid', (ctx) => {
    ctx.reply(`آیدی این چت/گروه:\n\`${ctx.chat.id}\``, { parse_mode: 'Markdown' });
  });

  bot.on('message', async (ctx: any) => {
    const tgId = ctx.from?.id.toString();
    if (!tgId) return;

    // Check if the sender is admin replying to a support message
    const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';
    const isAdminChat = ctx.chat.id.toString() === ADMIN_ID;

    if (ADMIN_ID && isAdminChat && ctx.message.reply_to_message) {
      const targetUserId = adminMessageMap.get(ctx.message.reply_to_message.message_id);
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
    if (activeSupportUsers.has(tgId)) {
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

        return ctx.reply('✅ پیام شما برای مدیریت ارسال شد. منتظر پاسخ بمانید.');
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
    try { bot?.stop('SIGINT'); } catch(e) {}
  });
  process.once('SIGTERM', () => {
    try { bot?.stop('SIGTERM'); } catch(e) {}
  });
}

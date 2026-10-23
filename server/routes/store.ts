import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import db, { syncDatabase } from '../db/database';
import { requireAuth } from '../middleware/auth';
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

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 checkout requests per window
  message: { error: 'تعداد درخواست‌های پرداخت بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
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

// POST /api/store/checkout
router.post('/checkout', checkoutLimiter, requireAuth, async (req: any, res) => {
  try {
    const { productId } = req.body;
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

    if (product.category !== 'package' && product.category !== 'plan' && product.stock <= 0) {
      return res.status(400).json({ error: 'موجودی این محصول به اتمام رسیده است' });
    }

    // Create an order
    const orderId = 'ORD-' + crypto.randomUUID().split('-')[0].toUpperCase();
    const insertStmt = db.prepare(`
      INSERT INTO orders (id, userId, productId, amount, paymentStatus, paymentMethod) 
      VALUES (?, ?, ?, ?, 'pending', 'online')
    `);
    
    insertStmt.run(orderId, userId, productId, product.price);
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
    const { productId, trackingNumber } = req.body;
    const userId = req.user.id;

    if (!productId) return res.status(400).json({ error: 'شناسه محصول نامعتبر است' });
    if (!trackingNumber) return res.status(400).json({ error: 'شماره پیگیری نامعتبر است' });

    const product = db.prepare(`
      SELECT p.*, COUNT(CASE WHEN l.status = 'available' THEN 1 END) as stock
      FROM products p LEFT JOIN licenses l ON p.id = l.productId
      WHERE p.id = ? GROUP BY p.id
    `).get(productId) as any;

    if (!product) return res.status(404).json({ error: 'محصول پیدا نشد' });
    if (product.category !== 'package' && product.category !== 'plan' && product.stock <= 0) {
      return res.status(400).json({ error: 'موجودی این محصول به اتمام رسیده است' });
    }

    const orderId = 'ORD-' + crypto.randomUUID().split('-')[0].toUpperCase();
    
    // We update the insert statement to include trackingNumber and paymentMethod if they exist in schema.
    // We already added them via migration.
    const insertStmt = db.prepare(`
      INSERT INTO orders (id, userId, productId, amount, paymentStatus, paymentMethod, trackingNumber) 
      VALUES (?, ?, ?, ?, 'pending', 'card', ?)
    `);
    
    insertStmt.run(orderId, userId, productId, product.price, trackingNumber);
    syncDatabase();

    res.json({ message: 'فاکتور ایجاد شد', orderId });

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
        const creditAmount = isPlan ? getPlanCreditAmount(product) : order.amount;
        const desc = isPlan 
          ? `خرید ${product?.title || 'بسته تعرفه'} - سفارش ${orderId}`
          : `شارژ آنلاین کیف پول کاربری (${gateway === 'bazaarpay' ? 'بازارپی' : 'شاپرک'}) - سفارش ${orderId}`;

        db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = ?, refId = ? WHERE id = ?").run(payMethod, refId, orderId);
        depositWallet(order.userId, creditAmount, desc);
        syncDatabase();
        if (gateway === 'bazaarpay') {
          return res.redirect(`/?payment=success&orderId=${orderId}&refId=${refId}&amount=${creditAmount}`);
        }
        return res.redirect(`/store?tab=wallet&payment=success&orderId=${orderId}&refId=${refId}&amount=${creditAmount}`);
      }

      // Digital store product - update paymentStatus to success, but leave licenseId null
      db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = ?, refId = ? WHERE id = ?").run(payMethod, refId, orderId);
      syncDatabase();

      // Send Telegram notification that order is pending review
      try {
        const orderUser = db.prepare('SELECT telegramId FROM users WHERE id = ?').get(order.userId) as any;
        if (orderUser?.telegramId && bot) {
          let tgNotice = `⏳ **سفارش شما با موفقیت ثبت شد و در انتظار تایید مدیریت است.**\n\n` +
                         `📦 **محصول:** ${product?.title || ''}\n` +
                         `🔢 **شماره سفارش:** \`${orderId}\`\n\n` +
                         `پس از بررسی و تایید توسط پشتیبانی، لایسنس شما از همین طریق ارسال خواهد شد.`;
          bot.telegram.sendMessage(orderUser.telegramId, tgNotice, { parse_mode: 'Markdown' }).catch((e) => {
            console.error('[Store] Failed to send Telegram pending notification:', e);
          });
        }
      } catch (tgErr) {
        console.error('[Store] Telegram notify error:', tgErr);
      }

      res.redirect('/store?payment=success&orderId=' + orderId);
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
        const creditAmount = isPlan ? getPlanCreditAmount(product) : order.amount;
        const desc = isPlan 
          ? `خرید آنلاین ${product?.title || 'بسته تعرفه'} - شماره تراکنش: ${refId}`
          : `شارژ آنلاین کیف پول از طریق زرین‌پال - شماره تراکنش: ${refId}`;

        db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = 'zarinpal', authority = ?, refId = ?, cardPan = ? WHERE id = ?")
          .run(authority, refId, cardPan, orderId);

        depositWallet(order.userId, creditAmount, desc);
        syncDatabase();

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

        return res.redirect(`/store?tab=wallet&payment=success&orderId=${orderId}&refId=${refId}&amount=${creditAmount}`);
      }

      // Digital store product
      // We do NOT auto-assign license anymore for digital products per admin's request
      let licenseId: number | null = null;

      db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = 'zarinpal', licenseId = ?, authority = ?, refId = ?, cardPan = ? WHERE id = ?")
        .run(licenseId, authority, refId, cardPan, orderId);
      syncDatabase();

      // Telegram delivery notification
      try {
        const orderUser = db.prepare('SELECT telegramId FROM users WHERE id = ?').get(order.userId) as any;
        if (orderUser?.telegramId && bot) {
          let msg = `✅ **سفارش شما با موفقیت ثبت شد!**\n\n` +
                    `📦 **محصول:** ${product?.title || ''}\n` +
                    `🔢 **شماره سفارش:** \`${orderId}\`\n` +
                    `🧾 **کد پیگیری شاپرک:** \`${refId}\`\n` +
                    `💰 **مبلغ پرداخت شده:** ${order.amount.toLocaleString('fa-IR')} تومان\n\n` +
                    `⏳ سفارش شما در انتظار تایید مدیریت می‌باشد و به زودی پردازش خواهد شد. پس از تخصیص لایسنس، رسید نهایی برای شما ارسال می‌گردد.`;
          
          bot.telegram.sendMessage(orderUser.telegramId, msg, { parse_mode: 'Markdown' }).catch(() => {});
        }
      } catch (tgErr) {
        console.error('[Store] Telegram notify error:', tgErr);
      }

      // SMS notification
      notifyOrderSuccessBySms(orderId, licenseId);

      return res.redirect(`/store?payment=success&orderId=${orderId}&refId=${refId}`);
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
    return res.redirect('/chat?payment=failed&msg=invalid_order');
  }
  const orderId = rawOrderId;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) {
    return res.redirect('/chat?payment=failed&msg=order_not_found');
  }

  // Already verified and successful
  if (order.paymentStatus === 'success') {
    if (order.id.startsWith('TOP-') || order.productId === getWalletTopupProductId()) {
      return res.redirect(`/chat?tab=wallet&payment=success&orderId=${orderId}&refId=${order.refId || ''}`);
    }
    return res.redirect(`/chat?payment=success&orderId=${orderId}&refId=${order.refId || ''}`);
  }

  const tokenToTrace = checkoutToken || order.authority;
  if (!tokenToTrace) {
    db.prepare("UPDATE orders SET paymentStatus = 'failed', paymentMethod = 'bazaarpay' WHERE id = ?").run(orderId);
    syncDatabase();
    return res.redirect(`/chat?payment=failed&orderId=${orderId}&msg=missing_token`);
  }

  try {
    const traceRes = await traceBazaarPayment(tokenToTrace);

    if (!traceRes.success) {
      db.prepare("UPDATE orders SET paymentStatus = 'failed', paymentMethod = 'bazaarpay' WHERE id = ?").run(orderId);
      syncDatabase();
      const errMsg = encodeURIComponent(traceRes.error || 'استعلام پرداخت با خطا مواجه شد');
      return res.redirect(`/chat?payment=failed&orderId=${orderId}&msg=${errMsg}`);
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
          return res.redirect(`/chat?payment=failed&orderId=${orderId}&msg=commit_failed`);
        }
      }

      const refId = String(tokenToTrace);
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(order.productId) as any;
      const isWalletTopup = order.id.startsWith('TOP-') || order.productId === getWalletTopupProductId();
      const isPlan = product?.category === 'plan';

      if (isWalletTopup || isPlan) {
        const creditAmount = isPlan ? getPlanCreditAmount(product) : order.amount;
        const desc = isPlan 
          ? `خرید آنلاین ${product?.title || 'بسته تعرفه'} از طریق بازارپی - شماره پیگیری: ${refId}`
          : `شارژ آنلاین کیف پول از طریق بازارپی کافه‌بازار - شماره پیگیری: ${refId}`;

        db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = 'bazaarpay', authority = ?, refId = ? WHERE id = ?")
          .run(tokenToTrace, refId, orderId);

        depositWallet(order.userId, creditAmount, desc);
        syncDatabase();

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

        return res.redirect(`/chat?tab=wallet&payment=success&orderId=${orderId}&refId=${refId}&amount=${creditAmount}`);
      }

      // Digital store product
      let licenseId: number | null = null;
      db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = 'bazaarpay', licenseId = ?, authority = ?, refId = ? WHERE id = ?")
        .run(licenseId, tokenToTrace, refId, orderId);
      syncDatabase();

      try {
        const orderUser = db.prepare('SELECT telegramId FROM users WHERE id = ?').get(order.userId) as any;
        if (orderUser?.telegramId && bot) {
          let msg = `✅ **سفارش بازارپی شما با موفقیت ثبت شد!**\n\n` +
                    `📦 **محصول:** ${product?.title || ''}\n` +
                    `🔢 **شماره سفارش:** \`${orderId}\`\n` +
                    `🧾 **کد پیگیری بازارپی:** \`${refId}\`\n` +
                    `💰 **مبلغ پرداخت شده:** ${order.amount.toLocaleString('fa-IR')} تومان\n\n` +
                    `⏳ سفارش شما در انتظار تایید مدیریت است.`;
          bot.telegram.sendMessage(orderUser.telegramId, msg, { parse_mode: 'Markdown' }).catch(() => {});
        }
      } catch (tgErr) {}

      notifyOrderSuccessBySms(orderId, licenseId);
      return res.redirect(`/chat?payment=success&orderId=${orderId}&refId=${refId}`);

    } else {
      // Payment failed/unpaid/cancelled
      db.prepare("UPDATE orders SET paymentStatus = 'failed', paymentMethod = 'bazaarpay', authority = ? WHERE id = ?")
        .run(tokenToTrace, orderId);
      syncDatabase();
      const statusNote = traceRes.status === 'unpaid' ? 'پرداخت انجام نشد یا لغو شد' : `وضعیت: ${traceRes.status}`;
      return res.redirect(`/chat?payment=failed&orderId=${orderId}&msg=${encodeURIComponent(statusNote)}`);
    }

  } catch (err: any) {
    console.error('[Store] Error in BazaarPay callback:', err);
    return res.redirect(`/chat?payment=failed&orderId=${orderId}`);
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
        o.trackingNumber,
        o.createdAt as orderDate,
        p.id as productId,
        p.title,
        p.category,
        p.image,
        p.description,
        p.deliveryGuide,
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
          `).run(orderId, userId, license.productId, product ? product.price : 0);
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

export default router;

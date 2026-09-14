import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import db, { syncDatabase } from '../db/database';
import { requireAuth } from '../middleware/auth';
import { bot } from '../telegram/bot';
import { requestZarinpalPayment, verifyZarinpalPayment, getZarinpalConfig } from '../services/zarinpalService';
import { depositWallet } from '../services/walletService';

const router = express.Router();

function getSafeBaseUrl(req: express.Request): string {
  const configuredUrl = (process.env.APP_URL || process.env.WEBSITE_URL || process.env.WEB_URL || '').replace(/\/+$/, '');
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

    if (product.category !== 'package' && product.stock <= 0) {
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

    const zarinpal = getZarinpalConfig();
    const baseUrl = getSafeBaseUrl(req);

    // If ZarinPal is configured and enabled, request real Authority
    if (zarinpal.enabled) {
      const userRow = db.prepare('SELECT email, phone FROM users WHERE id = ?').get(userId) as any;
      const zpResult = await requestZarinpalPayment({
        amountToman: product.price,
        description: `خرید ${product.title} - شماره سفارش ${orderId}`,
        callbackUrl: `${baseUrl}/api/store/zarinpal/callback?orderId=${orderId}`,
        email: userRow?.email,
        mobile: userRow?.phone
      });

      if (zpResult.success && zpResult.authority && zpResult.paymentUrl) {
        db.prepare('UPDATE orders SET authority = ? WHERE id = ?').run(zpResult.authority, orderId);
        syncDatabase();
        return res.json({ message: 'فاکتور ایجاد شد', orderId, paymentUrl: zpResult.paymentUrl });
      } else {
        console.warn('[Store API] ZarinPal request failed:', zpResult.error);
        if (process.env.NODE_ENV !== 'production') {
          const paymentUrl = `/api/store/mock-payment?orderId=${orderId}`;
          return res.json({ message: 'فاکتور ایجاد شد (آزمایشی)', orderId, paymentUrl });
        }
        return res.status(400).json({ error: zpResult.error || 'خطا در ایجاد تراکنش درگاه زرین‌پال' });
      }
    }

    // Mock payment link (Fallback when ZarinPal is not configured yet)
    const paymentUrl = `/api/store/mock-payment?orderId=${orderId}`;

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

    const zarinpal = getZarinpalConfig();
    const baseUrl = getSafeBaseUrl(req);

    if (zarinpal.enabled) {
      const userRow = db.prepare('SELECT email, phone FROM users WHERE id = ?').get(userId) as any;
      const zpResult = await requestZarinpalPayment({
        amountToman: numAmount,
        description: `شارژ کیف پول حساب کاربری - سفارش ${orderId}`,
        callbackUrl: `${baseUrl}/api/store/zarinpal/callback?orderId=${orderId}`,
        email: userRow?.email,
        mobile: userRow?.phone
      });

      if (zpResult.success && zpResult.authority && zpResult.paymentUrl) {
        db.prepare('UPDATE orders SET authority = ? WHERE id = ?').run(zpResult.authority, orderId);
        syncDatabase();
        return res.json({ message: 'فاکتور شارژ ایجاد شد', orderId, paymentUrl: zpResult.paymentUrl });
      } else {
        console.warn('[Store API] ZarinPal topup error:', zpResult.error);
        if (process.env.NODE_ENV !== 'production') {
          const paymentUrl = `/api/store/mock-payment?orderId=${orderId}`;
          return res.json({ message: 'فاکتور شارژ ایجاد شد (آزمایشی)', orderId, paymentUrl });
        }
        return res.status(400).json({ error: zpResult.error || 'خطا در ایجاد تراکنش شارژ زرین‌پال' });
      }
    }

    const paymentUrl = `/api/store/mock-payment?orderId=${orderId}`;
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
    if (product.category !== 'package' && product.stock <= 0) {
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

// GET /api/store/mock-payment (Dummy gateway to simulate successful payment)
router.get('/mock-payment', (req, res) => {
  const rawOrderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
  if (!rawOrderId || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawOrderId)) {
    return res.status(400).send('شماره سفارش نامعتبر است');
  }
  const order = db.prepare('SELECT id, paymentStatus FROM orders WHERE id = ?').get(rawOrderId) as any;
  if (!order || order.paymentStatus !== 'pending') {
    return res.status(404).send('سفارش معتبری در وضعیت پرداخت یافت نشد.');
  }
  const safeOrderId = encodeURIComponent(rawOrderId);
  
  // Create a beautiful HTML dummy payment page
  res.send(`
    <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>درگاه پرداخت آزمایشی</title>
        <style>
          body { font-family: Tahoma, sans-serif; background: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 100%; }
          .btn { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 20px; text-decoration: none; display: inline-block; }
          .btn-danger { background: #ef4444; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2 style="color: #2563eb">درگاه پرداخت تستی</h2>
          <p>شما در حال پرداخت سفارش <strong>${safeOrderId}</strong> هستید.</p>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
            <a href="/api/store/mock-callback?orderId=${safeOrderId}&status=success" class="btn">پرداخت موفق</a>
            <a href="/api/store/mock-callback?orderId=${safeOrderId}&status=failed" class="btn btn-danger">انصراف</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

// GET /api/store/mock-callback (Handles the return from Dummy gateway)
router.get('/mock-callback', (req, res) => {
  const rawOrderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  
  if (!rawOrderId || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawOrderId)) {
    return res.redirect('/store?payment=failed');
  }
  const orderId = rawOrderId;

  if (status === 'success') {
    try {
      const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?');
      const order = orderStmt.get(orderId) as any;
      
      if (!order || order.paymentStatus !== 'pending') {
        return res.redirect('/store?payment=failed');
      }

      // Check if wallet top-up
      const isWalletTopup = order.id.startsWith('TOP-') || order.productId === getWalletTopupProductId();
      if (isWalletTopup) {
        db.prepare("UPDATE orders SET paymentStatus = 'success', refId = 'MOCK-TOPUP' WHERE id = ?").run(orderId);
        depositWallet(order.userId, order.amount, `شارژ آزمایشی کیف پول کاربری - سفارش ${orderId}`);
        syncDatabase();
        return res.redirect(`/store?tab=wallet&payment=success&orderId=${orderId}&refId=MOCK-TOPUP&amount=${order.amount}`);
      }

      const productStmt = db.prepare('SELECT category, title FROM products WHERE id = ?');
      const product = productStmt.get(order.productId) as any;

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
      res.redirect('/store?payment=failed');
    }
  } else {
    // Failed payment
    db.prepare('UPDATE orders SET paymentStatus = ? WHERE id = ?').run('failed', orderId);
    syncDatabase();
    res.redirect('/store?payment=failed');
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

      const isWalletTopup = order.id.startsWith('TOP-') || order.productId === getWalletTopupProductId();

      if (isWalletTopup) {
        db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = 'zarinpal', authority = ?, refId = ?, cardPan = ? WHERE id = ?")
          .run(authority, refId, cardPan, orderId);

        depositWallet(order.userId, order.amount, `شارژ آنلاین کیف پول از طریق زرین‌پال - شماره تراکنش: ${refId}`);
        syncDatabase();

        return res.redirect(`/store?tab=wallet&payment=success&orderId=${orderId}&refId=${refId}&amount=${order.amount}`);
      }

      // Digital store product
      let licenseId: number | null = null;
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(order.productId) as any;

      if (product && product.category !== 'package') {
        const availLicense = db.prepare('SELECT id FROM licenses WHERE productId = ? AND status = ? LIMIT 1').get(product.id, 'available') as any;
        if (availLicense) {
          licenseId = availLicense.id;
          db.prepare("UPDATE licenses SET status = 'sold' WHERE id = ?").run(licenseId);
        }
      }

      db.prepare("UPDATE orders SET paymentStatus = 'success', paymentMethod = 'zarinpal', licenseId = ?, authority = ?, refId = ?, cardPan = ? WHERE id = ?")
        .run(licenseId, authority, refId, cardPan, orderId);
      syncDatabase();

      // Telegram delivery notification
      try {
        const orderUser = db.prepare('SELECT telegramId FROM users WHERE id = ?').get(order.userId) as any;
        if (orderUser?.telegramId && bot) {
          let msg = `✅ **پرداخت شما با موفقیت انجام شد!**\n\n` +
                    `📦 **محصول:** ${product?.title || ''}\n` +
                    `🔢 **شماره سفارش:** \`${orderId}\`\n` +
                    `🧾 **کد پیگیری شاپرک:** \`${refId}\`\n` +
                    `💰 **مبلغ:** ${order.amount.toLocaleString('fa-IR')} تومان\n\n`;
          if (licenseId) {
            const lic = db.prepare('SELECT key FROM licenses WHERE id = ?').get(licenseId) as any;
            if (lic?.key) {
              msg += `🔑 **کد لایسنس شما:**\n\`${lic.key}\`\n\n`;
            }
          }
          msg += `با تشکر از اعتماد شما به دستیار هوشمند.`;
          bot.telegram.sendMessage(orderUser.telegramId, msg, { parse_mode: 'Markdown' }).catch(() => {});
        }
      } catch (tgErr) {
        console.error('[Store] Telegram notify error:', tgErr);
      }

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

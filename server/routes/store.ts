import express from 'express';
import db from '../db/database';
import { requireAuth } from '../middleware/auth';
import { bot } from '../telegram/bot';

const router = express.Router();

// GET /api/store/products
router.get('/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT 
        p.*,
        COUNT(CASE WHEN l.status = 'available' THEN 1 END) as stock
      FROM products p 
      LEFT JOIN licenses l ON p.id = l.productId
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
router.post('/checkout', requireAuth, (req: any, res) => {
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
    const orderId = 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const insertStmt = db.prepare(`
      INSERT INTO orders (id, userId, productId, amount, paymentStatus) 
      VALUES (?, ?, ?, ?, 'pending')
    `);
    
    insertStmt.run(orderId, userId, productId, product.price);

    // Mock payment link (We will replace this with Zarinpal later)
    const paymentUrl = `/api/store/mock-payment?orderId=${orderId}`;

    res.json({ message: 'فاکتور ایجاد شد', orderId, paymentUrl });

  } catch (error) {
    console.error('[Store API] Checkout error:', error);
    res.status(500).json({ error: 'خطای سرور در ایجاد فاکتور' });
  }
});

// GET /api/store/mock-payment (Dummy gateway to simulate successful payment)
router.get('/mock-payment', (req, res) => {
  const { orderId } = req.query;
  if (!orderId) return res.send('شماره سفارش نامعتبر است');
  
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
          <p>شما در حال پرداخت سفارش <strong>${orderId}</strong> هستید.</p>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
            <a href="/api/store/mock-callback?orderId=${orderId}&status=success" class="btn">پرداخت موفق</a>
            <a href="/api/store/mock-callback?orderId=${orderId}&status=failed" class="btn btn-danger">انصراف</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

// GET /api/store/mock-callback (Handles the return from Dummy gateway)
router.get('/mock-callback', (req, res) => {
  const orderId = req.query.orderId as string;
  const status = req.query.status as string;
  
  if (!orderId) return res.redirect('/store?payment=failed');

  if (status === 'success') {
    // Attempt to fulfill the order
    try {
      db.exec('BEGIN EXCLUSIVE TRANSACTION');
      const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?');
      const order = orderStmt.get(orderId) as any;
      
      if (!order || order.paymentStatus !== 'pending') {
        db.exec('ROLLBACK');
        return res.redirect('/store?payment=failed');
      }

      const productStmt = db.prepare('SELECT category FROM products WHERE id = ?');
      const product = productStmt.get(order.productId) as any;
      let licenseId = null;

      if (product && product.category !== 'package') {
        // Find an available license
        const licenseStmt = db.prepare('SELECT id FROM licenses WHERE productId = ? AND status = ? LIMIT 1');
        const license = licenseStmt.get(order.productId, 'available') as any;
        if (license) {
          licenseId = license.id;
          // Mark license as sold
          db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run('sold', licenseId);
        }
      }

      // Update order
      db.prepare('UPDATE orders SET paymentStatus = ?, licenseId = ? WHERE id = ?')
        .run('success', licenseId, orderId);
        
      db.exec('COMMIT');

      // Send instant Telegram notification if this order was placed by a Telegram user
      try {
        const orderUser = db.prepare('SELECT telegramId FROM users WHERE id = ?').get(order.userId) as any;
        if (orderUser?.telegramId && bot) {
          let tgNotice = `🎉 **پرداخت سفارش شما با موفقیت تایید شد!**\n\n` +
                         `📦 **محصول:** ${product?.title || ''}\n` +
                         `🔢 **شماره سفارش:** \`${orderId}\`\n\n`;
          if (licenseId) {
            const lic = db.prepare('SELECT key FROM licenses WHERE id = ?').get(licenseId) as any;
            if (lic?.key) {
              tgNotice += `🔑 **کد لایسنس شما:**\n\`${lic.key}\`\n\nاز اعتماد و خرید شما سپاسگزاریم!`;
            }
          } else {
            tgNotice += `✅ سفارش پکیج شما ثبت و فعال شد.`;
          }
          bot.telegram.sendMessage(orderUser.telegramId, tgNotice, { parse_mode: 'Markdown' }).catch((e) => {
            console.error('[Store] Failed to send Telegram success notification:', e);
          });
        }
      } catch (tgErr) {
        console.error('[Store] Telegram notify error:', tgErr);
      }

      res.redirect('/store?payment=success&orderId=' + orderId);
    } catch (err) {
      db.exec('ROLLBACK');
      console.error(err);
      res.redirect('/store?payment=failed');
    }
  } else {
    // Failed payment
    db.prepare('UPDATE orders SET paymentStatus = ? WHERE id = ?').run('failed', orderId);
    res.redirect('/store?payment=failed');
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
      WHERE o.userId = ? AND o.paymentStatus = 'success'
      ORDER BY o.createdAt DESC
    `).all(userId);
    
    res.json(purchases);
  } catch (error) {
    console.error('[Store API] Error fetching purchases:', error);
    res.status(500).json({ error: 'خطای سرور' });
  }
});

export default router;

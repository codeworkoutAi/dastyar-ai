import express from 'express';
import db, { syncDatabase } from '../db/database';
import { requireAuth } from '../middleware/auth';
import { adminRateLimiter, adminReportRateLimiter, adminExternalQueryRateLimiter } from '../middleware/rateLimiter';
import { bot, sendTelegramOrderSuccess } from '../telegram/bot';
import { notifyOrderSuccessBySms } from '../services/kavenegarService';
import { clearSitemapCache } from '../seo/sitemap';
import { getAdminFinancialSummary, addApiPurchase, depositWallet, getPlanCreditAmount, getApiDollarRate } from '../services/walletService';
import { getZarinpalConfig, testZarinpalMerchant, getServerPublicIp } from '../services/zarinpalService';
import { getBazaarPayConfig, testBazaarPayMerchant } from '../services/bazaarPayService';
import { getFullSiteDesign, saveSectionData, resetSectionData } from '../services/landingService';
import { multiPoolManager } from '../services/multiPoolManager';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Middleware to check for admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'عدم دسترسی. این بخش فقط برای مدیران است.' });
  }
  next();
};

// Apply auth and admin check to all admin routes.
// adminRateLimiter sits AFTER auth on purpose: keying the counter on the IP of an
// unauthenticated flooder would let one attacker exhaust the budget for the real
// admin's IP. Auth first means only authenticated admin traffic consumes quota.
router.use(requireAuth, requireAdmin, adminRateLimiter);

// ==========================================
// SHARED HELPERS
// ==========================================

/**
 * Never send a real provider key to the browser.
 *
 * The admin UI needs to know WHICH key is set (to render "configured" state and to
 * let the operator leave the field untouched when editing a profile), but it must
 * never receive the secret itself. AGENTS.md rule 3 is explicit: provider calls are
 * server-side only. Returning `SELECT *` here used to leak every Gemini/Groq/
 * router.cheap key into the client bundle at runtime, so a single XSS or a leaked
 * admin token on the browser side exposed the whole key pool.
 *
 * The edit form already treats an empty apiKey as "keep the existing one" (see
 * PUT /default-profiles/:id), so masking is safe for the round-trip.
 */
function maskApiKey(key?: string | null): string {
  if (!key) return '';
  const trimmed = String(key);
  if (trimmed.length <= 8) return '••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

/** Strip secret fields from a default_profiles row before it leaves the server. */
function sanitizeProfile(row: any): any {
  if (!row) return row;
  const { apiKey, ...rest } = row;
  return {
    ...rest,
    apiKey: maskApiKey(apiKey),          // masked for display only
    hasApiKey: !!apiKey,                  // the flag the UI actually needs
    isApiKeyMasked: true,                 // tells the form not to re-submit the mask
  };
}

// Destructive, irreversible, and unauthenticated by anything stronger than a JWT.
// In production it is disabled outright: a single stray click, a replayed request or
// a CSRF-style call would otherwise wipe every order, license and user wallet.
// In dev/test it stays available, but only behind an explicit typed confirmation
// that the server verifies, so a bare `curl -X POST /api/admin/reset-database`
// is no longer enough.
const RESET_CONFIRMATION_PHRASE = 'RESET-DB';

function canResetDatabase(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_ADMIN_DB_RESET === 'true';
}



// ==========================================
// Promo Codes Management
// ==========================================

// GET /api/admin/promo-codes
router.get('/promo-codes', (req, res) => {
  try {
    const codes = db.prepare('SELECT * FROM promo_codes ORDER BY id DESC').all();
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت کدهای تخفیف' });
  }
});

// POST /api/admin/promo-codes
router.post('/promo-codes', (req, res) => {
  try {
    const { code, type, value, maxUses } = req.body;
    if (!code || !value) return res.status(400).json({ error: 'کد و مبلغ الزامی است' });
    
    db.prepare('INSERT INTO promo_codes (code, type, value, maxUses) VALUES (?, ?, ?, ?)').run(code, type || 'registration_bonus', value, maxUses || 0);
    syncDatabase();
    res.json({ message: 'کد با موفقیت اضافه شد' });
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'این کد قبلاً ثبت شده است' });
    }
    res.status(500).json({ error: 'خطا در ثبت کد تخفیف' });
  }
});

// DELETE /api/admin/promo-codes/:id
router.delete('/promo-codes/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM promo_codes WHERE id = ?').run(req.params.id);
    syncDatabase();
    res.json({ message: 'کد با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ error: 'خطا در حذف کد تخفیف' });
  }
});

// PUT /api/admin/promo-codes/:id/toggle
router.put('/promo-codes/:id/toggle', (req, res) => {
  try {
    const { isActive } = req.body;
    db.prepare('UPDATE promo_codes SET isActive = ? WHERE id = ?').run(isActive ? 1 : 0, req.params.id);
    syncDatabase();
    res.json({ message: 'وضعیت کد تغییر کرد' });
  } catch (err) {
    res.status(500).json({ error: 'خطا در تغییر وضعیت' });
  }
});

// GET /api/admin/products
router.get('/products', (req, res) => {
  try {


    const products = db.prepare(`
      SELECT p.*, COUNT(l.id) as stock 
      FROM products p 
      LEFT JOIN licenses l ON p.id = l.productId AND l.status = 'available'
      WHERE p.category IS NULL OR p.category != 'wallet_topup'
      GROUP BY p.id
      ORDER BY p.id DESC
    `).all();
    res.json(products);
  } catch (error) {
    console.error('[Admin API] Error fetching products:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست محصولات' });
  }
});

// POST /api/admin/products
router.post('/products', (req, res) => {
  try {
    const { 
      title, description, longDescription, faqs, price, category, image, bannerImage, baseUrl, deliveryGuide,
      badge, features, tokenEstimate, isPopular, showOnLanding, variations, deliveryTime, deliveryType
    } = req.body;
    
    if (!title || price === undefined || price === null || !category) {
      return res.status(400).json({ error: 'عنوان، قیمت و دسته‌بندی الزامی است.' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (
        title, description, longDescription, faqs, price, category, image, bannerImage, baseUrl, deliveryGuide,
        badge, features, tokenEstimate, isPopular, showOnLanding, variations, deliveryTime, deliveryType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      title,
      description || '',
      longDescription || '',
      faqs || null,
      price,
      category,
      image || null,
      bannerImage || null,
      baseUrl || null,
      deliveryGuide || null,
      badge || null,
      features || null,
      tokenEstimate || null,
      isPopular ? 1 : 0,
      showOnLanding === false ? 0 : 1,
      variations || null,
      deliveryTime || '۱ تا ۲۴ ساعت کاری',
      deliveryType || 'hybrid'
    );
    syncDatabase();
    clearSitemapCache();

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('[Admin API] Error creating product:', error);
    res.status(500).json({ error: 'خطا در ایجاد محصول' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, longDescription, faqs, price, category, image, bannerImage, baseUrl, deliveryGuide,
      badge, features, tokenEstimate, isPopular, showOnLanding, variations, deliveryTime, deliveryType
    } = req.body;
    
    if (!title || price === undefined || price === null || !category) {
      return res.status(400).json({ error: 'عنوان، قیمت و دسته‌بندی الزامی است.' });
    }

    const checkStmt = db.prepare('SELECT id FROM products WHERE id = ?');
    if (!checkStmt.get(id)) {
      return res.status(404).json({ error: 'محصول یافت نشد.' });
    }

    const stmt = db.prepare(`
      UPDATE products SET 
        title = ?, description = ?, longDescription = ?, faqs = ?, price = ?, category = ?, 
        image = ?, bannerImage = ?, baseUrl = ?, deliveryGuide = ?,
        badge = ?, features = ?, tokenEstimate = ?, isPopular = ?, showOnLanding = ?,
        variations = ?, deliveryTime = ?, deliveryType = ?
      WHERE id = ?
    `);
    stmt.run(
      title,
      description || '',
      longDescription || '',
      faqs || null,
      price,
      category,
      image || null,
      bannerImage || null,
      baseUrl || null,
      deliveryGuide || null,
      badge || null,
      features || null,
      tokenEstimate || null,
      isPopular ? 1 : 0,
      showOnLanding === false ? 0 : 1,
      variations || null,
      deliveryTime || '۱ تا ۲۴ ساعت کاری',
      deliveryType || 'hybrid',
      id
    );
    syncDatabase();
    clearSitemapCache();

    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json(updatedProduct);
  } catch (error) {
    console.error('[Admin API] Error updating product:', error);
    res.status(500).json({ error: 'خطا در ویرایش محصول' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const checkStmt = db.prepare('SELECT id FROM products WHERE id = ?');
    if (!checkStmt.get(id)) {
      return res.status(404).json({ error: 'محصول یافت نشد.' });
    }

    db.prepare('DELETE FROM licenses WHERE productId = ? AND status = ?').run(id, 'available');
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    syncDatabase();
    clearSitemapCache();

    res.json({ success: true, message: 'محصول با موفقیت حذف شد.' });
  } catch (error) {
    console.error('[Admin API] Error deleting product:', error);
    res.status(500).json({ error: 'خطا در حذف محصول' });
  }
});

// ==================== PRODUCT REVIEWS MODERATION ====================

// GET /api/admin/reviews
router.get('/reviews', (req, res) => {
  try {
    const status = req.query.status as string;
    let query = `
      SELECT 
        r.id, r.productId, r.userId, r.rating, r.comment, r.status, r.reply, r.createdAt,
        p.title as productTitle,
        u.name as userName, u.email as userEmail
      FROM product_reviews r
      LEFT JOIN products p ON r.productId = p.id
      LEFT JOIN users u ON r.userId = u.id
    `;
    const params: any[] = [];
    if (status && status !== 'all') {
      query += ` WHERE r.status = ?`;
      params.push(status);
    }
    query += ` ORDER BY r.id DESC LIMIT 100`;

    const reviews = db.prepare(query).all(...params);
    res.json(reviews);
  } catch (error) {
    console.error('[Admin API] Error fetching reviews:', error);
    res.status(500).json({ error: 'خطا در دریافت دیدگاه‌ها' });
  }
});

// PUT /api/admin/reviews/:id/status
router.put('/reviews/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'وضعیت نامعتبر است' });
    }

    if (reply !== undefined) {
      db.prepare('UPDATE product_reviews SET status = ?, reply = ? WHERE id = ?').run(status, reply || null, id);
    } else {
      db.prepare('UPDATE product_reviews SET status = ? WHERE id = ?').run(status, id);
    }
    syncDatabase();

    res.json({ success: true, message: 'وضعیت دیدگاه با موفقیت بروزرسانی شد.' });
  } catch (error) {
    console.error('[Admin API] Error updating review status:', error);
    res.status(500).json({ error: 'خطا در تغییر وضعیت دیدگاه' });
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM product_reviews WHERE id = ?').run(id);
    syncDatabase();
    res.json({ success: true, message: 'دیدگاه با موفقیت حذف شد.' });
  } catch (error) {
    console.error('[Admin API] Error deleting review:', error);
    res.status(500).json({ error: 'خطا در حذف دیدگاه' });
  }
});



// GET /api/admin/products/:productId/licenses
router.get('/products/:productId/licenses', (req, res) => {
  try {
    const { productId } = req.params;
    const licenses = db.prepare('SELECT * FROM licenses WHERE productId = ? ORDER BY createdAt DESC').all(productId);
    res.json(licenses);
  } catch (error) {
    console.error('[Admin API] Error fetching licenses:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست لایسنس‌ها' });
  }
});

// POST /api/admin/products/:productId/licenses
// NOTE: db.transaction() is NOT supported in libsql embedded replica (syncUrl) mode.
// We insert each license individually and call syncDatabase() once at the end.
router.post('/products/:productId/licenses', (req, res) => {
  try {
    const { productId } = req.params;
    const { keys } = req.body; // array of strings

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: 'لیست لایسنس‌ها نامعتبر است' });
    }

    const checkProduct = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!checkProduct) {
      return res.status(404).json({ error: 'محصول یافت نشد.' });
    }

    const insertStmt = db.prepare('INSERT INTO licenses (productId, key) VALUES (?, ?)');
    let inserted = 0;

    for (const key of keys) {
      if (typeof key === 'string' && key.trim()) {
        insertStmt.run(productId, key.trim());
        inserted++;
      }
    }

    // Sync all inserts to Turso Cloud in one go
    syncDatabase();

    res.status(201).json({ success: true, count: inserted });
  } catch (error) {
    console.error('[Admin API] Error adding licenses:', error);
    res.status(500).json({ error: 'خطا در ثبت لایسنس‌ها' });
  }
});

// DELETE /api/admin/licenses/:id
router.delete('/licenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const checkStmt = db.prepare('SELECT id, status FROM licenses WHERE id = ?');
    const license = checkStmt.get(id) as any;
    
    if (!license) {
      return res.status(404).json({ error: 'لایسنس یافت نشد.' });
    }
    
    if (license.status === 'sold') {
      return res.status(400).json({ error: 'این لایسنس فروخته شده است و قابل حذف نیست.' });
    }

    db.prepare('DELETE FROM licenses WHERE id = ?').run(id);
    syncDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('[Admin API] Error deleting license:', error);
    res.status(500).json({ error: 'خطا در حذف لایسنس' });
  }
});

// GET /api/admin/orders
router.get('/orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, 
             u.phone as userPhone, u.email as userEmail, u.name as userName,
             p.title as productTitle, p.category as productCategory,
             l.key as licenseKey,
             (SELECT COUNT(*) FROM licenses WHERE productId = o.productId AND status = 'available') as availableStock
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      LEFT JOIN products p ON o.productId = p.id
      LEFT JOIN licenses l ON o.licenseId = l.id
      ORDER BY o.createdAt DESC
    `).all();
    res.json(orders);
  } catch (error) {
    console.error('[Admin API] Error fetching orders:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست سفارشات' });
  }
});

// GET /api/admin/orders/:id
router.get('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare(`
      SELECT o.*, 
             u.phone as userPhone, u.email as userEmail, u.name as userName,
             p.title as productTitle, p.category as productCategory, p.price as productPrice,
             l.key as licenseKey,
             (SELECT COUNT(*) FROM licenses WHERE productId = o.productId AND status = 'available') as availableStock
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      LEFT JOIN products p ON o.productId = p.id
      LEFT JOIN licenses l ON o.licenseId = l.id
      WHERE o.id = ?
    `).get(id);
    
    if (!order) {
      return res.status(404).json({ error: 'سفارش یافت نشد.' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('[Admin API] Error fetching order:', error);
    res.status(500).json({ error: 'خطا در دریافت اطلاعات سفارش' });
  }
});

// PUT /api/admin/orders/:id/status
// NOTE: No db.transaction() – embedded replica does not support it.
router.put('/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // pending, success, failed
    
    if (!['pending', 'success', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'وضعیت نامعتبر است.' });
    }

    const order = db.prepare(`
      SELECT o.*, p.category as productCategory 
      FROM orders o 
      LEFT JOIN products p ON o.productId = p.id 
      WHERE o.id = ?
    `).get(id) as any;

    if (!order) {
      return res.status(404).json({ error: 'سفارش یافت نشد.' });
    }

    let licenseId = order.licenseId;
    let warning: string | null = null;

    const isWalletTopupOrder = 
      order.id.startsWith('TOP-') || 
      order.productCategory === 'wallet_topup' || 
      order.productCategory === 'plan';

    if (status === 'success') {
      if (isWalletTopupOrder) {
        // Guard against double-crediting. depositWallet() credits the balance and
        // writes its own transaction row; the `UPDATE orders` below is a separate
        // statement. If anything failed between them, the order stayed 'pending'
        // while the user already had the credit — and approving it again credited a
        // second time. Approving an order that is ALREADY 'success' is therefore a
        // no-op for credit purposes: the money has (or has not) already moved, and
        // only the license/delivery fields may still need fixing.
        if (order.paymentStatus !== 'success') {
          const product = db.prepare('SELECT * FROM products WHERE id = ?').get(order.productId) as any;
          const creditAmount = order.productCategory === 'plan'
            ? getPlanCreditAmount(product)
            : order.amount;
          const desc = order.productCategory === 'plan'
            ? `تایید سفارش ${product?.title || 'بسته تعرفه'} توسط مدیریت - سفارش ${id}`
            : `شارژ کیف پول - تایید سفارش ${id} توسط مدیریت`;
          depositWallet(order.userId, creditAmount, desc);
        } else {
          warning = 'این سفارش قبلاً تایید شده بود؛ اعتبار کاربر دوباره واریز نشد. در صورت نیاز به بررسی، تراکنش‌های کیف پول کاربر را مشاهده کنید.';
        }
      } else if (order.productCategory !== 'package' && !licenseId) {
        // Atomic license assignment to prevent race conditions
        const availLicense = db.prepare(`
          UPDATE licenses 
          SET status = 'sold' 
          WHERE productId = ? AND status = 'available' 
          RETURNING id, key
        `).get(order.productId) as any;

        if (availLicense) {
          licenseId = availLicense.id;
        } else {
          warning = 'سفارش به حالت موفق تغییر یافت، اما موجودی لایسنس این محصول خالی است و لایسنسی تخصیص داده نشد.';
        }
      }
    } else if (status === 'failed' || status === 'pending') {
      if (licenseId) {
        db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run('available', licenseId);
        licenseId = null;
      }
    }

    db.prepare('UPDATE orders SET paymentStatus = ?, licenseId = ? WHERE id = ?')
      .run(status, licenseId, id);

    syncDatabase();

    // Send Telegram & SMS delivery notification if approved
    if (status === 'success') {
      sendTelegramOrderSuccess(id, licenseId);
      notifyOrderSuccessBySms(id, licenseId);
    }

    res.json({ 
      success: true, 
      message: 'وضعیت سفارش بروزرسانی شد.',
      paymentStatus: status,
      licenseId,
      warning
    });
  } catch (error) {
    console.error('[Admin API] Error updating order status:', error);
    res.status(500).json({ error: 'خطا در بروزرسانی سفارش' });
  }
});

// POST /api/admin/orders/:id/assign-license
// NOTE: No db.transaction() – embedded replica does not support it.
router.post('/orders/:id/assign-license', (req, res) => {
  try {
    const { id } = req.params;
    const { licenseKey, licenseId: providedLicenseId } = req.body;

    if (!licenseKey && !providedLicenseId) {
      return res.status(400).json({ error: 'کلید لایسنس یا شناسه لایسنس الزامی است.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: 'سفارش یافت نشد.' });
    }

    if (providedLicenseId) {
      // Validate BEFORE releasing the previous license, so a rejected request
      // cannot leave the order with no license at all.
      //
      // Previously the id was trusted blindly: any existing license could be
      // pointed at this order regardless of which product it belonged to, and a
      // license already sold to someone else could be re-sold here. The same
      // `sold` row would then be referenced by two orders.
      const target = db.prepare(
        'SELECT id, productId, status FROM licenses WHERE id = ?'
      ).get(providedLicenseId) as any;

      if (!target) {
        return res.status(404).json({ error: 'لایسنس انتخاب‌شده یافت نشد.' });
      }
      if (Number(target.productId) !== Number(order.productId)) {
        return res.status(400).json({
          error: 'لایسنس انتخاب‌شده متعلق به این محصول نیست و قابل تخصیص نیست.'
        });
      }
      if (target.status === 'sold' && Number(target.id) !== Number(order.licenseId)) {
        return res.status(400).json({
          error: 'این لایسنس قبلاً به سفارش دیگری فروخته شده است. ابتدا سفارش مربوطه را اصلاح کنید.'
        });
      }
    }

    // Release old license if already had one
    if (order.licenseId) {
      db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run('available', order.licenseId);
    }

    let finalLicenseId: number | bigint = providedLicenseId;

    if (licenseKey && !providedLicenseId) {
      // Insert new custom license and mark as sold
      const insertResult = db.prepare(
        'INSERT INTO licenses (productId, key, status) VALUES (?, ?, ?)'
      ).run(order.productId, licenseKey.trim(), 'sold');
      finalLicenseId = insertResult.lastInsertRowid;
    } else if (providedLicenseId) {
      db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run('sold', providedLicenseId);
    }

    db.prepare("UPDATE orders SET paymentStatus = 'success', licenseId = ?, fulfillmentStatus = 'delivered' WHERE id = ?")
      .run(finalLicenseId, id);

    syncDatabase();

    // Notify Telegram & SMS buyer
    sendTelegramOrderSuccess(id, finalLicenseId);
    notifyOrderSuccessBySms(id, finalLicenseId);

    res.json({ success: true, message: 'لایسنس با موفقیت به سفارش تخصیص یافت و سفارش تایید شد.', licenseId: finalLicenseId });
  } catch (error) {
    console.error('[Admin API] Error assigning license:', error);
    res.status(500).json({ error: 'خطا در تخصیص لایسنس' });
  }
});

// DELETE /api/admin/orders/:id
// NOTE: No db.transaction() – embedded replica does not support it.
router.delete('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: 'سفارش یافت نشد.' });
    }

    // If order had a license and was success, release the license
    if (order.licenseId && order.paymentStatus === 'success') {
      db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run('available', order.licenseId);
    }
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    syncDatabase();

    res.json({ success: true, message: 'سفارش با موفقیت حذف شد.' });
  } catch (error) {
    console.error('[Admin API] Error deleting order:', error);
    res.status(500).json({ error: 'خطا در حذف سفارش' });
  }
});

// POST /api/admin/reset-database
// NOTE: No db.transaction() – embedded replica does not support it.
//
// This is the most destructive endpoint in the whole app: it deletes every order,
// license, product, conversation, OTP and news row, then every user except the
// caller. The only thing that used to stand between a stray click and total data
// loss was a `window.confirm()` in the browser — which is not a control at all,
// since any direct POST with an admin token skipped it entirely.
//
// Two independent guards are now enforced server-side:
//   1. a typed confirmation phrase the server verifies (so a replayed/curl request
//      without the phrase is rejected), and
//   2. a hard block in production unless ALLOW_ADMIN_DB_RESET=true is set
//      explicitly, so production data cannot be wiped by accident.
router.post('/reset-database', (req, res) => {
  try {
    if (!canResetDatabase()) {
      console.error('[Admin API] BLOCKED reset-database attempt in production.', {
        userId: (req as any).user?.id,
        ip: req.ip,
      });
      return res.status(403).json({
        error: 'پاکسازی دیتابیس در محیط عملیاتی غیرفعال است. برای اجرای آن باید متغیر محیطی ALLOW_ADMIN_DB_RESET فعال شود.'
      });
    }

    const { confirm } = req.body || {};
    if (confirm !== RESET_CONFIRMATION_PHRASE) {
      return res.status(400).json({
        error: `برای تأیید عملیات، عبارت «${RESET_CONFIRMATION_PHRASE}» را ارسال کنید.`
      });
    }

    const adminId = (req as any).user.id;
    const ip = req.ip;

    // Audit log BEFORE mutating anything: this is unrecoverable, so the record of
    // who triggered it must survive even if a later step throws.
    console.warn('[Admin API] DESTRUCTIVE: admin reset-database executed', {
      adminId,
      ip,
      at: new Date().toISOString(),
    });

    // IMPORTANT: Order matters because of FOREIGN KEY constraints
    // wallet_transactions and free_daily_usage are included on purpose. Leaving
    // them behind while zeroing users.walletBalance produced reports where every
    // user had a 0 balance but a full transaction history, so the finance and
    // analytics tabs disagreed with each other and with the ledger.
    const tables = [
      'wallet_transactions',
      'free_daily_usage',
      'orders',
      'licenses',
      'products',
      'conversations',
      'otps',
      'news',
    ];
    for (const table of tables) {
      db.exec(`DELETE FROM ${table}`);
    }
    // Delete everyone EXCEPT the current admin
    db.prepare('DELETE FROM users WHERE id != ?').run(adminId);
    syncDatabase();

    res.json({ success: true, message: 'دیتابیس با موفقیت پاک شد.' });
  } catch (error) {
    console.error('[Admin API] Error resetting database:', error);
    res.status(500).json({ error: 'خطا در پاک کردن دیتابیس' });
  }
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  try {
    // isArchived is returned so the UI can show archived accounts distinctly
    // instead of silently making them disappear.
    const users = db.prepare(
      'SELECT id, name, email, phone, telegramId, role, botState, isArchived, createdAt FROM users ORDER BY id DESC'
    ).all();
    res.json(users);
  } catch (error) {
    console.error('[Admin API] Error fetching users:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست کاربران' });
  }
});

// DELETE /api/admin/users/:id  →  HARD DELETE (with full dependent cleanup)
//
// The admin's workflow is to create throwaway accounts, sign in with them, then
// remove them — so "delete" has to mean the row is really gone. A soft archive
// left the account sitting in the users table forever and did not match the
// request.
//
// The original hard delete was still wrong, in the opposite direction: it removed
// only the users row and left every dependent record behind. wallet_transactions
// and orders are declared ON DELETE CASCADE, but SQLite does NOT enforce foreign
// keys unless `PRAGMA foreign_keys = ON` is issued, and this project never issues
// it. So the cascade never fired and the delete orphaned real rows: the ledger
// kept the user's transactions with a userId that resolved to nothing, and the
// finance/analytics tabs could no longer attribute that money to anyone.
//
// So the children are deleted explicitly, in an order that satisfies the declared
// constraints, before the parent goes. Licenses are released back to stock rather
// than deleted: they are shop inventory, not user data, and deleting them would
// destroy unsold keys.
//
// `?archive=true` is still available for the rare case where the financial history
// must be preserved; the UI uses the hard delete by default.
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const archive = req.query.archive === 'true';

    // Prevent deleting the currently logged-in admin
    const adminId = (req as any).user.id;
    if (parseInt(id, 10) === adminId) {
      return res.status(403).json({ error: 'شما نمی‌توانید اکانت خودتان را حذف کنید.' });
    }

    const target = db.prepare('SELECT id, name, phone, email, role, isArchived FROM users WHERE id = ?').get(id) as any;
    if (!target) {
      return res.status(404).json({ error: 'کاربر یافت نشد.' });
    }

    // Never let one admin delete another admin account by accident.
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'حذف حساب‌های مدیر مجاز نیست.' });
    }

    if (archive) {
      db.prepare(`
        UPDATE users
        SET isArchived = 1,
            phone = NULL,
            email = NULL,
            googleId = NULL,
            telegramId = NULL,
            passwordHash = NULL,
            resetToken = NULL,
            resetTokenExpiry = NULL
        WHERE id = ?
      `).run(id);
      syncDatabase();
      return res.json({
        success: true,
        archived: true,
        message: 'کاربر بایگانی شد. سوابق مالی و سفارش‌های او حفظ شده است.'
      });
    }

    // Audit log BEFORE mutating: this is unrecoverable.
    console.warn('[Admin API] DESTRUCTIVE: permanent user delete', {
      targetUserId: id,
      targetName: target.name,
      targetPhone: target.phone,
      adminId,
      ip: req.ip,
      at: new Date().toISOString(),
    });

    // Inventory check, so the response can report exactly what was cleaned up.
    const orderCount = Number((db.prepare('SELECT COUNT(*) as c FROM orders WHERE userId = ?').get(id) as any)?.c || 0);
    const txCount = Number((db.prepare('SELECT COUNT(*) as c FROM wallet_transactions WHERE userId = ?').get(id) as any)?.c || 0);

    // 1. Release any license this user holds back to sellable stock. The license
    //    rows are shop inventory and must survive; only the claim is removed.
    db.prepare(`
      UPDATE licenses SET status = 'available'
      WHERE id IN (SELECT licenseId FROM orders WHERE userId = ? AND licenseId IS NOT NULL)
    `).run(id);

    // 2. Orders, then wallet rows, then conversations. Explicit because SQLite
    //    foreign-key cascades are inert without PRAGMA foreign_keys = ON.
    //    free_daily_usage / free_image_usage are keyed by 'user:<id>' / userId
    //    rather than by a real foreign key, so they are never cascaded at all.
    db.prepare('DELETE FROM orders WHERE userId = ?').run(id);
    db.prepare('DELETE FROM wallet_transactions WHERE userId = ?').run(id);
    db.prepare('DELETE FROM conversations WHERE userId = ?').run(id);
    db.prepare('DELETE FROM free_daily_usage WHERE id = ?').run(`user:${id}`);
    db.prepare('DELETE FROM free_image_usage WHERE userId = ?').run(id);

    // 3. Finally the parent row.
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    syncDatabase();

    res.json({
      success: true,
      deleted: true,
      cleaned: { orders: orderCount, transactions: txCount },
      message: 'کاربر و تمام اطلاعات او (سفارش‌ها، تراکنش‌ها و گفتگوها) به‌طور کامل حذف شد.'
    });
  } catch (error) {
    console.error('[Admin API] Error deleting user:', error);
    res.status(500).json({ error: 'خطا در حذف کاربر' });
  }
});

// GET /api/admin/default-profiles (List all default profiles with full details)
router.get('/default-profiles', (req, res) => {
  try {
    const profiles = db.prepare('SELECT * FROM default_profiles ORDER BY orderIndex ASC, createdAt ASC').all();
    // apiKey is masked here: the client must never receive the real provider key.
    res.json((profiles as any[]).map(sanitizeProfile));
  } catch (error) {
    console.error('[Admin API] Error fetching default profiles:', error);
    res.status(500).json({ error: 'خطا در دریافت پروفایل‌های پیش‌فرض' });
  }
});

// POST /api/admin/default-profiles (Create new default profile)
router.post('/default-profiles', (req, res) => {
  try {
    const { name, baseUrl, apiKey, modelName, customHeaders, role, orderIndex, isActive } = req.body;
    if (!name || !baseUrl || !modelName) {
      return res.status(400).json({ error: 'نام کارت، آدرس پایه (Base URL) و نام مدل الزامی است.' });
    }

    const id = `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const stmt = db.prepare(`
      INSERT INTO default_profiles (id, name, baseUrl, apiKey, modelName, customHeaders, role, orderIndex, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      name.trim(),
      baseUrl.trim().replace(/\/$/, ''),
      apiKey ? String(apiKey).trim() : '',
      modelName.trim(),
      customHeaders ? String(customHeaders).trim() : '',
      role || 'default',
      typeof orderIndex === 'number' ? orderIndex : 0,
      isActive === 0 ? 0 : 1
    );
    syncDatabase();

    const created = db.prepare('SELECT * FROM default_profiles WHERE id = ?').get(id);
    res.status(201).json(sanitizeProfile(created));
  } catch (error) {
    console.error('[Admin API] Error creating default profile:', error);
    res.status(500).json({ error: 'خطا در ایجاد پروفایل پیش‌فرض' });
  }
});

// PUT /api/admin/default-profiles/:id (Update default profile)
router.put('/default-profiles/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, baseUrl, apiKey, modelName, customHeaders, role, orderIndex, isActive } = req.body;

    const existing = db.prepare('SELECT * FROM default_profiles WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'پروفایل پیش‌فرض یافت نشد.' });
    }

    // The client only ever sees a masked key (see GET /default-profiles). If it
    // echoes that mask straight back, treat the field as "unchanged" and keep the
    // stored secret — otherwise editing a profile's name would overwrite the real
    // key with the literal string "abcd••••wxyz".
    const submittedKey = apiKey !== undefined ? String(apiKey).trim() : '';
    const isMaskedEcho = submittedKey.includes('••••');
    const newApiKey = (!submittedKey || isMaskedEcho)
      ? existing.apiKey
      : submittedKey;

    const stmt = db.prepare(`
      UPDATE default_profiles 
      SET name = ?, baseUrl = ?, apiKey = ?, modelName = ?, customHeaders = ?, role = ?, orderIndex = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      name ? name.trim() : existing.name,
      baseUrl ? baseUrl.trim().replace(/\/$/, '') : existing.baseUrl,
      newApiKey,
      modelName ? modelName.trim() : existing.modelName,
      customHeaders !== undefined ? String(customHeaders).trim() : existing.customHeaders,
      role || existing.role || 'default',
      typeof orderIndex === 'number' ? orderIndex : existing.orderIndex,
      isActive !== undefined ? (isActive ? 1 : 0) : existing.isActive,
      id
    );
    syncDatabase();

    const updated = db.prepare('SELECT * FROM default_profiles WHERE id = ?').get(id);
    res.json(sanitizeProfile(updated));
  } catch (error) {
    console.error('[Admin API] Error updating default profile:', error);
    res.status(500).json({ error: 'خطا در ویرایش پروفایل پیش‌فرض' });
  }
});

// DELETE /api/admin/default-profiles/:id (Delete default profile)
router.delete('/default-profiles/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM default_profiles WHERE id = ?').run(id);
    syncDatabase();
    res.json({ success: true, message: 'پروفایل پیش‌فرض با موفقیت حذف شد.' });
  } catch (error) {
    console.error('[Admin API] Error deleting default profile:', error);
    res.status(500).json({ error: 'خطا در حذف پروفایل پیش‌فرض' });
  }
});

// GET /api/admin/settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM site_settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (error) {
    console.error('[Admin API] Error fetching site settings:', error);
    res.status(500).json({ error: 'خطا در دریافت تنظیمات سیستم' });
  }
});

// PUT /api/admin/settings
router.put('/settings', (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined || value === null) {
      return res.status(400).json({ error: 'کلید و مقدار تنظیمات الزامی است.' });
    }

    // Validate api_dollar_rate - must be positive integer
    if (key === 'api_dollar_rate') {
      const rate = parseInt(String(value), 10);
      if (isNaN(rate) || rate <= 0) {
        return res.status(400).json({ error: 'نرخ دلار API باید عدد صحیح و مثبت باشد (مثال: 200000)' });
      }
    }

    db.prepare('INSERT OR REPLACE INTO site_settings (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, String(value));
    syncDatabase();

    if (key === 'gemini_keys_pool') {
      multiPoolManager.invalidatePool('gemini');
    } else if (key === 'groq_keys_pool') {
      multiPoolManager.invalidatePool('groq');
    }

    const updatedRow = db.prepare('SELECT key, value FROM site_settings WHERE key = ?').get(key);
    res.json(updatedRow);
  } catch (error) {
    console.error('[Admin API] Error updating site settings:', error);
    res.status(500).json({ error: 'خطا در به‌روزرسانی تنظیمات سیستم' });
  }
});

// GET /api/admin/pools/health
router.get('/pools/health', (req, res) => {
  try {
    const stats = multiPoolManager.getAllPoolStats();
    res.json(stats);
  } catch (error) {
    console.error('[Admin API] Error fetching pool health:', error);
    res.status(500).json({ error: 'خطا در دریافت وضعیت سلامت استخرها' });
  }
});

// GET /api/admin/financial-summary
router.get('/financial-summary', (req, res) => {
  try {
    const summary = getAdminFinancialSummary();
    res.json(summary);
  } catch (error) {
    console.error('[Admin API] Error fetching financial summary:', error);
    res.status(500).json({ error: 'خطا در دریافت خلاصه مالی سیستم' });
  }
});

// GET /api/admin/financial-export (CSV export for orders/wallet/transactions)
router.get('/financial-export', (req, res) => {
  try {
    const { type = 'orders', from, to } = req.query;
    
    let query = '';
    let params: any[] = [];
    
    if (type === 'orders') {
      // cardPan is intentionally NOT selected. The export used to include the full
      // card number of every manual card-to-card order; a CSV is the easiest file
      // to forward by accident. The last 4 digits are enough to reconcile.
      query = `
        SELECT o.id, o.userId, o.productId, o.amount, o.paymentStatus, o.paymentMethod, 
               o.trackingNumber, o.authority, o.refId,
               substr(IFNULL(o.cardPan,''), -4) as cardPanLast4,
               o.createdAt,
               u.name as userName, u.phone as userPhone, u.email as userEmail,
               p.title as productTitle, p.category as productCategory
        FROM orders o
        LEFT JOIN users u ON o.userId = u.id
        LEFT JOIN products p ON o.productId = p.id
      `;
    } else if (type === 'wallet_transactions') {
      query = `
        SELECT wt.id, wt.userId, wt.type, wt.amount, wt.balanceAfter, wt.model,
               wt.promptTokens, wt.completionTokens, wt.costUsd, wt.description, wt.createdAt,
               u.name as userName, u.phone as userPhone
        FROM wallet_transactions wt
        LEFT JOIN users u ON wt.userId = u.id
      `;
    } else if (type === 'api_purchases') {
      query = 'SELECT * FROM api_purchases';
    } else {
      return res.status(400).json({ error: 'نوع گزارش نامعتبر است. مقادیر مجاز: orders, wallet_transactions, api_purchases' });
    }
    
    // Add date range filtering
    if (from) {
      query += query.includes('WHERE') ? ' AND ' : ' WHERE ';
      query += 'date(createdAt) >= date(?)';
      params.push(from);
    }
    if (to) {
      query += query.includes('WHERE') ? ' AND ' : ' WHERE ';
      query += 'date(createdAt) <= date(?)';
      params.push(to);
    }
    
    // Hard row cap. This endpoint materialises every matching row into memory and
    // then builds the entire CSV as one JS string; on a real dataset that is
    // enough to exhaust the heap. Narrow the window with from/to instead.
    const EXPORT_ROW_LIMIT = 10000;
    query += ` ORDER BY createdAt DESC LIMIT ${EXPORT_ROW_LIMIT}`;

    const rows = db.prepare(query).all(...params) as any[];

    if (rows.length === 0) {
      return res.status(404).json({ error: 'داده‌ای برای خروجی یافت نشد' });
    }
    if (rows.length >= EXPORT_ROW_LIMIT) {
      console.warn(`[Admin API] financial-export hit the ${EXPORT_ROW_LIMIT}-row cap; output truncated.`);
    }

    // Generate CSV
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map(row => headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        // Neutralise spreadsheet formula injection. A cell starting with =, +, - or @
        // is executed by Excel/Sheets on open; user-controlled fields (product
        // title, description, tracking number) must not be able to run there.
        if (/^[=+\-@\t\r]/.test(str)) {
          str = `'${str}`;
        }
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }).join(','))
    ];
    
    const csv = csvLines.join('\n');
    const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // Add UTF-8 BOM for Excel compatibility
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('[Admin API] Error exporting financial data:', error);
    res.status(500).json({ error: 'خطا در خروجی گرفتن داده‌های مالی' });
  }
});

// GET /api/admin/gateway-status
router.get('/gateway-status', async (req, res) => {
  try {
    const config = getZarinpalConfig();
    const serverIp = await getServerPublicIp();
    res.json({ ...config, serverIp });
  } catch (error) {
    console.error('[Admin API] Error fetching gateway status:', error);
    res.status(500).json({ error: 'خطا در دریافت وضعیت درگاه' });
  }
});

// POST /api/admin/test-gateway
router.post('/test-gateway', async (req, res) => {
  try {
    const { merchantId, sandbox } = req.body;
    const configuredUrl = (process.env.APP_URL || process.env.WEBSITE_URL || process.env.WEB_URL || '').replace(/\/+$/, '');
    const host = req.get('host') || 'dastyarai.com';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = configuredUrl || (host.includes('localhost') ? 'https://dastyarai.com' : `${protocol}://${host}`);
    const callbackUrl = `${baseUrl}/api/store/zarinpal/callback`;

    const result = await testZarinpalMerchant(merchantId, sandbox === true, callbackUrl);
    res.json(result);
  } catch (error: any) {
    console.error('[Admin API] Error testing gateway:', error);
    res.status(500).json({ valid: false, message: 'خطا در تست درگاه: ' + error.message });
  }
});

// GET /api/admin/bazaarpay-status
router.get('/bazaarpay-status', (req, res) => {
  try {
    const config = getBazaarPayConfig();
    res.json({
      destination: config.destination,
      hasToken: Boolean(config.token && config.token.length > 0),
      enabled: config.enabled
    });
  } catch (error) {
    console.error('[Admin API] Error fetching BazaarPay status:', error);
    res.status(500).json({ error: 'خطا در دریافت وضعیت بازارپی' });
  }
});

// POST /api/admin/test-bazaarpay
router.post('/test-bazaarpay', async (req, res) => {
  try {
    const { destination, token } = req.body;
    const result = await testBazaarPayMerchant(destination, token);
    res.json(result);
  } catch (error: any) {
    console.error('[Admin API] Error testing BazaarPay:', error);
    res.status(500).json({ valid: false, message: 'خطا در تست بازارپی: ' + (error.message || '') });
  }
});

// GET /api/admin/financial-summary
router.get('/financial-summary', (req, res) => {
  try {
    const summary = getAdminFinancialSummary();
    res.json(summary);
  } catch (error) {
    console.error('[Admin API] Error fetching financial summary:', error);
    res.status(500).json({ error: 'خطا در دریافت خلاصه مالی سیستم' });
  }
});

// GET /api/admin/provider-live-balances (Query live balance from proxy/provider APIs)
router.get('/provider-live-balances', adminExternalQueryRateLimiter, async (req, res) => {
  try {
    const profiles = db.prepare("SELECT id, name, modelName, baseUrl, apiKey FROM default_profiles WHERE isActive = 1").all() as any[];
    const uniqueKeys = new Map<string, any>();
    for (const p of profiles) {
      if (p.baseUrl && p.apiKey) {
        const keyId = `${p.baseUrl.trim()}_${p.apiKey.trim()}`;
        if (!uniqueKeys.has(keyId)) {
          uniqueKeys.set(keyId, p);
        }
      }
    }

    const results = [];
    for (const p of uniqueKeys.values()) {
      const baseUrl = p.baseUrl.trim().replace(/\/v1\/?$/, '');
      const apiKey = p.apiKey.trim();
      let liveData: any = null;

      if (baseUrl.includes('router.cheap') || baseUrl.includes('one-api') || baseUrl.includes('new-api')) {
        try {
          const subRes = await fetch(`${baseUrl}/v1/dashboard/billing/subscription?_t=` + Date.now(), {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(3000)
          });
          if (subRes.ok) {
            const sub = await subRes.json();
            const now = new Date();
            const start = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
            const end = new Date(now.getFullYear() + 1, 11, 31).toISOString().split('T')[0];
            const usageRes = await fetch(`${baseUrl}/v1/dashboard/billing/usage?start_date=${start}&end_date=${end}&_t=` + Date.now(), {
              headers: { Authorization: `Bearer ${apiKey}` },
              signal: AbortSignal.timeout(3000)
            });
            const usage = usageRes.ok ? await usageRes.json() : {};
            const hardLimit = Number(sub.hard_limit_usd) || 0;
            const totalUsed = (Number(usage.total_usage) || 0) / 100;
            const remaining = Math.max(0, hardLimit - totalUsed);
            // 1 USD in One-API / Router.Cheap = 500,000 base quota tokens
            const baseTokens = Math.round(remaining * 500000);
            // In modern economy models (e.g. DeepSeek-V3 / GPT-4o-mini @ ~$0.15/1M tokens)
            const economyTokens = Math.round((remaining / 0.15) * 1000000);
            liveData = {
              supported: true,
              providerName: p.name || 'router.cheap',
              baseUrl: p.baseUrl,
              hardLimitUsd: hardLimit,
              totalUsedUsd: totalUsed,
              remainingUsd: remaining,
              baseTokens,
              economyTokens
            };
          }
        } catch (e: any) {
          console.warn('[Admin API] Live balance check error for', p.baseUrl, e.message);
        }
      } else if (baseUrl.includes('openrouter.ai')) {
        try {
          const keyRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(3000)
          });
          if (keyRes.ok) {
            const keyData = await keyRes.json();
            const data = keyData.data || {};
            const remUsd = Math.max(0, (data.limit || 0) - (data.usage || 0));
            const baseTokens = Math.round(remUsd * 500000);
            const economyTokens = Math.round((remUsd / 0.15) * 1000000);
            liveData = {
              supported: true,
              providerName: 'OpenRouter',
              baseUrl: p.baseUrl,
              hardLimitUsd: data.limit || 0,
              totalUsedUsd: data.usage || 0,
              remainingUsd: remUsd,
              baseTokens,
              economyTokens
            };
          }
        } catch (e) {}
      }

      if (liveData) {
        results.push(liveData);
      }
    }

    res.json(results);
  } catch (err: any) {
    console.error('[Admin API] provider-live-balances error:', err);
    res.status(500).json({ error: 'خطا در دریافت موجودی آنلاین کلیدها' });
  }
});

// GET /api/admin/analytics-summary (Aggregated charts and metrics data)
router.get('/analytics-summary', adminReportRateLimiter, (req, res) => {
  try {
    const period = (req.query.period as string) || '30d';
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '1y') days = 365;

    // 1. Daily usage stats (chats, tokens, revenue, cost)
    const dailyUsageRows = db.prepare(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as chatCount,
        COALESCE(SUM(ABS(amount)), 0) as chatRevenueToman,
        COALESCE(SUM(costUsd), 0) as costUsd,
        COALESCE(SUM(promptTokens), 0) as promptTokens,
        COALESCE(SUM(completionTokens), 0) as completionTokens,
        COALESCE(SUM(promptTokens + completionTokens), 0) as totalTokens,
        COUNT(DISTINCT userId) as activeUsers
      FROM wallet_transactions
      WHERE type = 'chat_usage'
        AND createdAt >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `).all(days) as any[];

    // 2. Daily store orders
    const dailyStoreRows = db.prepare(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as orderCount,
        COALESCE(SUM(amount), 0) as storeRevenueToman
      FROM orders
      WHERE paymentStatus = 'success'
        AND createdAt >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `).all(days) as any[];

    // 3. Daily user signups
    const dailyUserRows = db.prepare(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as newUsersCount
      FROM users
      WHERE createdAt >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `).all(days) as any[];

    // 4. Model distribution
    const modelDistribution = db.prepare(`
      SELECT 
        COALESCE(model, 'نامشخص') as model,
        COUNT(*) as requestCount,
        COALESCE(SUM(promptTokens + completionTokens), 0) as totalTokens,
        COALESCE(SUM(costUsd), 0) as totalCostUsd,
        COALESCE(SUM(ABS(amount)), 0) as totalRevenueToman
      FROM wallet_transactions
      WHERE type = 'chat_usage'
        AND createdAt >= datetime('now', '-' || ? || ' days')
      GROUP BY model
      ORDER BY totalTokens DESC
    `).all(days) as any[];

    // 5. Total overall stats for the period
    const totalStats = db.prepare(`
      SELECT 
        COUNT(*) as totalChats,
        COALESCE(SUM(ABS(amount)), 0) as totalChatRevenueToman,
        COALESCE(SUM(costUsd), 0) as totalCostUsd,
        COALESCE(SUM(promptTokens + completionTokens), 0) as totalTokens,
        COUNT(DISTINCT userId) as uniqueActiveUsers
      FROM wallet_transactions
      WHERE type = 'chat_usage'
        AND createdAt >= datetime('now', '-' || ? || ' days')
    `).get(days) as any;

    const totalStoreStats = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(amount), 0) as totalStoreRevenueToman
      FROM orders
      WHERE paymentStatus = 'success'
        AND createdAt >= datetime('now', '-' || ? || ' days')
    `).get(days) as any;

    const totalNewUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE createdAt >= datetime('now', '-' || ? || ' days')
    `).get(days) as any;

    // Merge daily rows into a continuous timeline
    const dateMap = new Map<string, any>();
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        chatCount: 0,
        chatRevenueToman: 0,
        storeRevenueToman: 0,
        totalRevenueToman: 0,
        costUsd: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        activeUsers: 0,
        newUsersCount: 0
      });
    }

    for (const r of dailyUsageRows) {
      if (dateMap.has(r.date)) {
        const item = dateMap.get(r.date);
        item.chatCount = r.chatCount;
        item.chatRevenueToman = r.chatRevenueToman;
        item.costUsd = r.costUsd;
        item.promptTokens = r.promptTokens;
        item.completionTokens = r.completionTokens;
        item.totalTokens = r.totalTokens;
        item.activeUsers = r.activeUsers;
        item.totalRevenueToman += r.chatRevenueToman;
      }
    }

    for (const r of dailyStoreRows) {
      if (dateMap.has(r.date)) {
        const item = dateMap.get(r.date);
        item.storeRevenueToman = r.storeRevenueToman;
        item.totalRevenueToman += r.storeRevenueToman;
      }
    }

    for (const r of dailyUserRows) {
      if (dateMap.has(r.date)) {
        const item = dateMap.get(r.date);
        item.newUsersCount = r.newUsersCount;
      }
    }

    const timeline = Array.from(dateMap.values());
    const dollarRate = getApiDollarRate();

    res.json({
      period,
      days,
      dollarRate,
      sellingRate: dollarRate,
      timeline,
      modelDistribution,
      summary: {
        dollarRate,
        totalChats: totalStats?.totalChats || 0,
        totalChatRevenueToman: totalStats?.totalChatRevenueToman || 0,
        totalStoreRevenueToman: totalStoreStats?.totalStoreRevenueToman || 0,
        totalRevenueToman: (totalStats?.totalChatRevenueToman || 0) + (totalStoreStats?.totalStoreRevenueToman || 0),
        totalCostUsd: totalStats?.totalCostUsd || 0,
        totalTokens: totalStats?.totalTokens || 0,
        uniqueActiveUsers: totalStats?.uniqueActiveUsers || 0,
        totalOrders: totalStoreStats?.totalOrders || 0,
        totalNewUsers: totalNewUsers?.count || 0
      }
    });
  } catch (error) {
    console.error('[Admin API] Error fetching analytics summary:', error);
    res.status(500).json({ error: 'خطا در تولید گزارشات تحلیلی' });
  }
});

// POST /api/admin/purchases (Record a new API purchase by admin)
router.post('/purchases', (req, res) => {
  try {
    const { providerName, amountUsd, costToman, notes } = req.body;
    if (!providerName || !amountUsd || !costToman) {
      return res.status(400).json({ error: 'نام تأمین‌کننده، مبلغ دلاری و مبلغ پرداختی تومانی الزامی است.' });
    }

    const created = addApiPurchase(
      String(providerName),
      parseFloat(amountUsd),
      parseInt(costToman, 10),
      notes ? String(notes) : undefined
    );

    res.status(201).json(created);
  } catch (error) {
    console.error('[Admin API] Error recording API purchase:', error);
    res.status(500).json({ error: 'خطا در ثبت خرید ارزی' });
  }
});

// DELETE /api/admin/purchases/:id
router.delete('/purchases/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM api_purchases WHERE id = ?').run(id);
    syncDatabase();
    res.json({ success: true, message: 'رکورد خرید با موفقیت حذف شد.' });
  } catch (error) {
    console.error('[Admin API] Error deleting API purchase:', error);
    res.status(500).json({ error: 'خطا در حذف رکورد خرید' });
  }
});

// GET /api/admin/wallet-transactions (View recent user transactions)
router.get('/wallet-transactions', (req, res) => {
  try {
    const limit = Math.min(500, parseInt(req.query.limit as string, 10) || 100);
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';
    const typeFilter = req.query.type as string;
    const dateFilter = req.query.date as string;
    const sort = req.query.sort as string; // 'newest', 'oldest', 'alpha_asc', 'alpha_desc'
    
    let query = `
      SELECT wt.*, u.name as userName, u.email as userEmail, u.phone as userPhone, u.telegramId as userTelegramId
      FROM wallet_transactions wt
      LEFT JOIN users u ON wt.userId = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (search) {
      const ucMatch = search.match(/^(?:uc-)?(\d+)$/);
      const digits = ucMatch ? parseInt(ucMatch[1], 10) : NaN;

      if (ucMatch && digits > 10000 && digits < 100000) {
        // 'uc-10027' or '10027' -> user id 27.
        // The upper bound matters: an 11-digit phone number is also all-digits, and
        // without it '09126755014' became u.id 9116745014 and matched nothing.
        query += ` AND wt.userId = ?`;
        params.push(digits - 10000);
      } else if (/^\+?\d[\d\s-]{9,}$/.test(search)) {
        const phoneLike = search.replace(/[\s-]/g, '');
        // Three forms: as typed, without '+', and Iranian local (98 -> 0).
        // A stored '+989126755014' must also be found by typing '09126755014'.
        query += ` AND (IFNULL(u.phone,'') LIKE ? OR IFNULL(u.phone,'') LIKE ? OR IFNULL(u.phone,'') LIKE ?)`;
        const localDigits = phoneLike.replace(/^\+/, '').replace(/^98/, '0');
        params.push(`%${phoneLike}%`, `%${phoneLike.replace(/^\+/, '')}%`, `%${localDigits}%`);
      } else if (/^\d+$/.test(search)) {
        // A small bare number is a real internal user id.
        query += ` AND wt.userId = ?`;
        params.push(parseInt(search, 10));
      } else {
        query += ` AND (LOWER(IFNULL(wt.model, '')) LIKE ? OR LOWER(IFNULL(u.name, '')) LIKE ? OR LOWER(IFNULL(u.email, '')) LIKE ? OR IFNULL(u.phone, '') LIKE ? OR LOWER(IFNULL(wt.type, '')) LIKE ? OR IFNULL(u.telegramId, '') LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
      }
    }
    if (typeFilter === 'deposit') {
      query += ` AND wt.amount > 0`;
    } else if (typeFilter === 'deduct') {
      // Include free_usage: those rows have amount = 0, so a plain amount < 0 test
      // silently dropped every subsidised message from the "consumption" filter.
      query += ` AND (wt.amount < 0 OR wt.type = 'free_usage')`;
    } else if (typeFilter === 'free_usage') {
      query += ` AND wt.type = 'free_usage'`;
    } else if (typeFilter === 'image_usage') {
      query += ` AND wt.type = 'image_usage'`;
    }

    if (dateFilter === 'today') {
      query += ` AND wt.createdAt >= datetime('now', '-1 day')`;
    } else if (dateFilter === 'week') {
      query += ` AND wt.createdAt >= datetime('now', '-7 days')`;
    } else if (dateFilter === 'month') {
      query += ` AND wt.createdAt >= datetime('now', '-30 days')`;
    }
    
    if (sort === 'oldest') {
      query += ` ORDER BY wt.createdAt ASC`;
    } else if (sort === 'alpha_asc') {
      query += ` ORDER BY u.name ASC, wt.createdAt DESC`;
    } else if (sort === 'alpha_desc') {
      query += ` ORDER BY u.name DESC, wt.createdAt DESC`;
    } else {
      query += ` ORDER BY wt.createdAt DESC`;
    }

    const offset = parseInt(req.query.offset as string, 10) || 0;

    // Total count for real pagination. Computed with the same WHERE clauses but
    // without LIMIT/OFFSET, so the UI can show "page X of Y" and stop guessing
    // from transactions.length < LIMIT (which breaks on exact multiples of LIMIT).
    const countQuery = query.replace(/ ORDER BY [\s\S]*$/, '') + ` ORDER BY wt.id ASC LIMIT 1 OFFSET 999999999`;
    const countParams = [...params];
    const total = Number((db.prepare(countQuery).get(...countParams) as any)?.c) || 0;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const transactions = db.prepare(query).all(...params);

    res.json({ transactions, total });
  } catch (error) {
    console.error('[Admin API] Error fetching transactions:', error);
    res.status(500).json({ error: 'خطا در دریافت تراکنش‌ها' });
  }
});

// GET /api/admin/user-usage-summary (Aggregated per-user consumption report)
// This is the "who consumed what" view. The raw transaction list cannot answer it:
// it is paginated and mixes deposits/bonuses with usage rows.
router.get('/user-usage-summary', adminReportRateLimiter, (req, res) => {
  try {
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';

    let query = `
      SELECT
        wt.userId AS userId,
        u.name AS userName,
        u.phone AS userPhone,
        u.email AS userEmail,
        COUNT(*) AS messageCount,
        COALESCE(SUM(IFNULL(wt.promptTokens,0) + IFNULL(wt.completionTokens,0)), 0) AS totalTokens,
        COALESCE(SUM(IFNULL(wt.promptTokens,0)), 0) AS promptTokens,
        COALESCE(SUM(IFNULL(wt.completionTokens,0)), 0) AS completionTokens,
        COALESCE(SUM(CASE WHEN wt.type = 'free_usage' THEN 1 ELSE 0 END), 0) AS freeMessages,
        COALESCE(SUM(CASE WHEN wt.type = 'chat_usage' THEN ABS(wt.amount) ELSE 0 END), 0) AS paidToman,
        COALESCE(SUM(CASE WHEN wt.type = 'image_usage' THEN ABS(wt.amount) ELSE 0 END), 0) AS imageToman,
        COALESCE(SUM(CASE WHEN wt.type = 'chat_usage' THEN IFNULL(wt.costUsd,0)
                          WHEN wt.type = 'free_usage' THEN IFNULL(wt.costUsd,0)
                          ELSE 0 END), 0) AS costUsd,
        MAX(wt.createdAt) AS lastUsedAt
      FROM wallet_transactions wt
      LEFT JOIN users u ON wt.userId = u.id
      WHERE wt.type IN ('chat_usage', 'free_usage', 'image_usage')
    `;
    const params: any[] = [];

    // Same search semantics as /wallet-transactions: distinguish a UC code from a
    // phone number. Previously a numeric phone like '09126755014' matched
    // "number > 10000" and was turned into a bogus u.id, returning zero rows.
    if (search) {
      const ucMatch = search.match(/^(?:uc-)?(\d+)$/);
      const digits = ucMatch ? parseInt(ucMatch[1], 10) : NaN;
      if (ucMatch && digits > 10000 && digits < 100000) {
        // 'uc-10027' or '10027' -> user id 27
        query += ` AND wt.userId = ?`;
        params.push(digits - 10000);
      } else if (/^\+?\d[\d\s-]{9,}$/.test(search)) {
        // A real phone number: search the phone column, never treat it as a UC code.
        const phoneLike = search.replace(/[\s-]/g, '');
        // Three forms: as typed, without '+', and Iranian local (98 -> 0).
        // A stored '+989126755014' must also be found by typing '09126755014'.
        query += ` AND (IFNULL(u.phone,'') LIKE ? OR IFNULL(u.phone,'') LIKE ? OR IFNULL(u.phone,'') LIKE ?)`;
        const localDigits = phoneLike.replace(/^\+/, '').replace(/^98/, '0');
        params.push(`%${phoneLike}%`, `%${phoneLike.replace(/^\+/, '')}%`, `%${localDigits}%`);
      } else {
        query += ` AND (LOWER(IFNULL(u.name,'')) LIKE ? OR LOWER(IFNULL(u.email,'')) LIKE ? OR IFNULL(u.phone,'') LIKE ? OR IFNULL(u.telegramId,'') LIKE ? OR LOWER(IFNULL(wt.model,'')) LIKE ?)`;
        const p = `%${search}%`;
        params.push(p, p, p, p, p);
      }
    }

    query += ` GROUP BY wt.userId ORDER BY totalTokens DESC`;

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) {
    console.error('[Admin API] Error fetching user usage summary:', error);
    res.status(500).json({ error: 'خطا در دریافت خلاصه مصرف کاربران' });
  }
});

// POST /api/admin/users/:id/wallet (Manual credit or debit of a user wallet)
router.post('/users/:id/wallet', (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, description } = req.body; // type: 'deposit' | 'deduct'

    const user = db.prepare('SELECT id, walletBalance FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد.' });
    }

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'مبلغ باید عددی مثبت باشد.' });
    }

    const currentBalance = user.walletBalance || 0;
    const isDeposit = type === 'deposit';
    const newBalance = isDeposit ? currentBalance + numAmount : Math.max(0, currentBalance - numAmount);

    db.prepare('UPDATE users SET walletBalance = ? WHERE id = ?').run(newBalance, id);

    // randomUUID, not Date.now(): two wallet operations issued in the same
    // millisecond produced the same id, which collides on the primary key.
    const txId = `tx-adm-${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO wallet_transactions (id, userId, type, amount, balanceAfter, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      txId,
      id,
      isDeposit ? 'deposit' : 'chat_usage',
      isDeposit ? numAmount : -numAmount,
      newBalance,
      description || (isDeposit ? 'شارژ دستی توسط ادمین' : 'کسر دستی توسط ادمین')
    );

    syncDatabase();
    res.json({ success: true, newBalance });
  } catch (error) {
    console.error('[Admin API] Error updating user wallet:', error);
    res.status(500).json({ error: 'خطا در بروزرسانی کیف پول کاربر' });
  }
});

// ==========================================
// SITE DESIGN & CMS STUDIO ENDPOINTS
// ==========================================

// GET /api/admin/site-design
router.get('/site-design', (_req, res) => {
  try {
    const design = getFullSiteDesign();
    res.json(design);
  } catch (error) {
    console.error('[Admin API] Error fetching site design:', error);
    res.status(500).json({ error: 'خطا در دریافت تنظیمات طراحی سایت' });
  }
});

// PUT /api/admin/site-design/:sectionKey
router.put('/site-design/:sectionKey', (req, res) => {
  try {
    const { sectionKey } = req.params;
    const { data } = req.body;

    const allowedKeys = [
      'landing_visibility',
      'landing_hero',
      'landing_features',
      'landing_manifesto', 
      'landing_professions', 
      'landing_professions_settings',
      'landing_gallery',
      'landing_gallery_settings',
      'landing_analytics',
      'landing_pricing_header',
      'landing_faqs', 
      'landing_faqs_settings',
      'landing_cta', 
      'landing_gift_card', 
      'store_design', 
      'blog_design', 
      'footer_settings'
    ];
    if (!allowedKeys.includes(sectionKey)) {
      return res.status(400).json({ error: 'کلید بخش نامعتبر است.' });
    }

    if (!data) {
      return res.status(400).json({ error: 'اطلاعات بخش الزامی است.' });
    }

    const saved = saveSectionData(sectionKey, data);
    res.json({ success: true, data: saved });
  } catch (error) {
    console.error(`[Admin API] Error updating site design section ${req.params.sectionKey}:`, error);
    res.status(500).json({ error: 'خطا در ذخیره بخش طراحی سایت' });
  }
});

// POST /api/admin/site-design/reset/:sectionKey
router.post('/site-design/reset/:sectionKey', (req, res) => {
  try {
    const { sectionKey } = req.params;
    const restored = resetSectionData(sectionKey);
    if (!restored) {
      return res.status(400).json({ error: 'امکان بازگردانی این بخش وجود ندارد.' });
    }
    res.json({ success: true, data: restored });
  } catch (error) {
    console.error(`[Admin API] Error resetting section ${req.params.sectionKey}:`, error);
    res.status(500).json({ error: 'خطا در بازگردانی تنظیمات به پیش‌فرض' });
  }
});

// POST /api/admin/site-design/upload-image
router.post('/site-design/upload-image', (req, res) => {
  try {
    const { base64, folder = 'custom', filename } = req.body;
    if (!base64 || typeof base64 !== 'string') {
      return res.status(400).json({ error: 'تصویر معتبر ارسال نشده است.' });
    }

    const matches = base64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'فرمت Base64 تصویر نامعتبر است.' });
    }

    // `folder` used to flow straight into path.join, so "../../.." escaped
    // public/images and let the request write to an arbitrary path on disk.
    // `filename` was already sanitised; the directory was not. Allowlist it, the
    // same way sectionKey is allowlisted in PUT /site-design/:sectionKey.
    const ALLOWED_UPLOAD_FOLDERS = ['custom', 'hero', 'gallery', 'professions', 'products', 'blog', 'avatars', 'landing'];
    if (!ALLOWED_UPLOAD_FOLDERS.includes(String(folder))) {
      return res.status(400).json({
        error: 'پوشه مقصد نامعتبر است. پوشه‌های مجاز: ' + ALLOWED_UPLOAD_FOLDERS.join('، ')
      });
    }

    // Reject oversized images before decoding. express.json accepts 50mb bodies
    // (see server/index.ts), so without this a single request could allocate
    // ~37MB of Buffer for an image that is never valid.
    const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
    const approxBytes = Math.floor((matches[2].length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return res.status(413).json({
        error: 'حجم تصویر بیش از حد مجاز است (حداکثر ۵ مگابایت). لطفاً تصویر را فشرده سازید.'
      });
    }

    const rawExt = matches[1].toLowerCase();
    const ALLOWED_IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'];
    if (!ALLOWED_IMAGE_EXTS.includes(rawExt)) {
      return res.status(400).json({ error: 'فرمت تصویر پشتیبانی نمی‌شود.' });
    }

    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const buffer = Buffer.from(matches[2], 'base64');

    const targetDir = path.join(process.cwd(), 'public', 'images', folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const safeFilename = filename ? `${filename.replace(/[^a-zA-Z0-9-_]/g, '')}-${Date.now()}.${ext}` : `img-${Date.now()}.${ext}`;
    const filePath = path.join(targetDir, safeFilename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/images/${folder}/${safeFilename}`;
    res.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('[Admin API] Error uploading site image:', error);
    res.status(500).json({ error: 'خطا در ذخیره فایل تصویر' });
  }
});

// ==========================================
// CONTACT MESSAGES MANAGEMENT
// ==========================================

router.get('/contact-messages', (_req, res) => {
  try {
    const messages = db.prepare(`
      SELECT id, name, email, message, isRead, createdAt
      FROM contact_messages
      ORDER BY createdAt DESC
    `).all();
    res.json(messages);
  } catch (error) {
    console.error('[Admin API] Error fetching contact messages:', error);
    res.status(500).json({ error: 'خطا در دریافت پیام‌های تماس' });
  }
});

router.patch('/contact-messages/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body || {};
    const readVal = isRead === false || isRead === 0 ? 0 : 1;

    db.prepare('UPDATE contact_messages SET isRead = ? WHERE id = ?').run(readVal, id);
    syncDatabase();

    res.json({ success: true, isRead: readVal });
  } catch (error) {
    console.error('[Admin API] Error updating contact message read status:', error);
    res.status(500).json({ error: 'خطا در تغییر وضعیت پیام' });
  }
});

router.delete('/contact-messages/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
    syncDatabase();

    res.json({ success: true });
  } catch (error) {
    console.error('[Admin API] Error deleting contact message:', error);
    res.status(500).json({ error: 'خطا در حذف پیام' });
  }
});

export default router;



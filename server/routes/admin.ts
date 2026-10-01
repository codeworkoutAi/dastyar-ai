import express from 'express';
import db, { syncDatabase } from '../db/database';
import { requireAuth } from '../middleware/auth';
import { bot, sendTelegramOrderSuccess } from '../telegram/bot';
import { notifyOrderSuccessBySms } from '../services/kavenegarService';
import { clearSitemapCache } from '../seo/sitemap';
import { getAdminFinancialSummary, addApiPurchase, depositWallet, getPlanCreditAmount } from '../services/walletService';
import { getZarinpalConfig, testZarinpalMerchant, getServerPublicIp } from '../services/zarinpalService';
import { getFullSiteDesign, saveSectionData, resetSectionData } from '../services/landingService';
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

// Apply auth and admin check to all admin routes
router.use(requireAuth, requireAdmin);



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
      badge, features, tokenEstimate, isPopular, showOnLanding
    } = req.body;
    
    if (!title || price === undefined || price === null || !category) {
      return res.status(400).json({ error: 'عنوان، قیمت و دسته‌بندی الزامی است.' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (
        title, description, longDescription, faqs, price, category, image, bannerImage, baseUrl, deliveryGuide,
        badge, features, tokenEstimate, isPopular, showOnLanding
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      showOnLanding === false ? 0 : 1
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
      badge, features, tokenEstimate, isPopular, showOnLanding
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
        badge = ?, features = ?, tokenEstimate = ?, isPopular = ?, showOnLanding = ?
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

    if (status === 'success') {
      if (order.productCategory === 'plan') {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(order.productId) as any;
        const creditAmount = getPlanCreditAmount(product);
        depositWallet(order.userId, creditAmount, `تایید سفارش ${product?.title || 'بسته تعرفه'} توسط مدیریت - سفارش ${id}`);
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

    db.prepare('UPDATE orders SET paymentStatus = ?, licenseId = ? WHERE id = ?')
      .run('success', finalLicenseId, id);

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
router.post('/reset-database', (req, res) => {
  try {
    const adminId = (req as any).user.id;
    
    // IMPORTANT: Order matters because of FOREIGN KEY constraints
    const tables = ['orders', 'licenses', 'products', 'conversations', 'otps', 'news'];
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
    const users = db.prepare('SELECT id, name, email, phone, telegramId, role, botState, createdAt FROM users ORDER BY id DESC').all();
    res.json(users);
  } catch (error) {
    console.error('[Admin API] Error fetching users:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست کاربران' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting the currently logged-in admin
    const adminId = (req as any).user.id;
    if (parseInt(id) === adminId) {
      return res.status(403).json({ error: 'شما نمی‌توانید اکانت خودتان را حذف کنید.' });
    }

    const checkStmt = db.prepare('SELECT id FROM users WHERE id = ?');
    if (!checkStmt.get(id)) {
      return res.status(404).json({ error: 'کاربر یافت نشد.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    syncDatabase();

    res.json({ success: true, message: 'کاربر با موفقیت حذف شد.' });
  } catch (error) {
    console.error('[Admin API] Error deleting user:', error);
    res.status(500).json({ error: 'خطا در حذف کاربر' });
  }
});

// GET /api/admin/default-profiles (List all default profiles with full details)
router.get('/default-profiles', (req, res) => {
  try {
    const profiles = db.prepare('SELECT * FROM default_profiles ORDER BY orderIndex ASC, createdAt ASC').all();
    res.json(profiles);
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
    res.status(201).json(created);
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

    const newApiKey = apiKey !== undefined ? String(apiKey).trim() : existing.apiKey;
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
    res.json(updated);
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

    const updatedRow = db.prepare('SELECT key, value FROM site_settings WHERE key = ?').get(key);
    res.json(updatedRow);
  } catch (error) {
    console.error('[Admin API] Error updating site settings:', error);
    res.status(500).json({ error: 'خطا در به‌روزرسانی تنظیمات سیستم' });
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
      query = `
        SELECT o.id, o.userId, o.productId, o.amount, o.paymentStatus, o.paymentMethod, 
               o.trackingNumber, o.authority, o.refId, o.cardPan, o.createdAt,
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
    
    query += ' ORDER BY createdAt DESC';
    
    const rows = db.prepare(query).all(...params) as any[];
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'داده‌ای برای خروجی یافت نشد' });
    }
    
    // Generate CSV
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map(row => headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
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
router.get('/provider-live-balances', async (req, res) => {
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
router.get('/analytics-summary', (req, res) => {
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

    res.json({
      period,
      days,
      timeline,
      modelDistribution,
      summary: {
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
router.get('/user-usage-summary', (req, res) => {
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

    const txId = `tx-adm-${Date.now()}`;
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

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
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

export default router;



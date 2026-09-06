import express from 'express';
import db from '../db/database';
import { requireAuth } from '../middleware/auth';
import { bot, sendTelegramOrderSuccess } from '../telegram/bot';

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

// GET /api/admin/products
router.get('/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, COUNT(l.id) as stock 
      FROM products p 
      LEFT JOIN licenses l ON p.id = l.productId AND l.status = 'available'
      GROUP BY p.id
      ORDER BY p.createdAt DESC
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
    const { title, description, longDescription, price, category, image, bannerImage, baseUrl, deliveryGuide } = req.body;
    
    if (!title || price === undefined || price === null || !category) {
      return res.status(400).json({ error: 'عنوان، قیمت و دسته‌بندی الزامی است.' });
    }

    const stmt = db.prepare('INSERT INTO products (title, description, longDescription, price, category, image, bannerImage, baseUrl, deliveryGuide) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(title, description || '', longDescription || '', price, category, image || null, bannerImage || null, baseUrl || null, deliveryGuide || null);

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
    const { title, description, longDescription, price, category, image, bannerImage, baseUrl, deliveryGuide } = req.body;
    
    if (!title || price === undefined || price === null || !category) {
      return res.status(400).json({ error: 'عنوان، قیمت و دسته‌بندی الزامی است.' });
    }

    const checkStmt = db.prepare('SELECT id FROM products WHERE id = ?');
    if (!checkStmt.get(id)) {
      return res.status(404).json({ error: 'محصول یافت نشد.' });
    }

    const stmt = db.prepare('UPDATE products SET title = ?, description = ?, longDescription = ?, price = ?, category = ?, image = ?, bannerImage = ?, baseUrl = ?, deliveryGuide = ? WHERE id = ?');
    stmt.run(title, description || '', longDescription || '', price, category, image || null, bannerImage || null, baseUrl || null, deliveryGuide || null, id);

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

    // Optionally delete related licenses or set status to deleted?
    // For now, hard delete product and its available licenses
    db.prepare('DELETE FROM licenses WHERE productId = ? AND status = ?').run(id, 'available');
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

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
    
    // Begin transaction for bulk insert
    db.exec('BEGIN TRANSACTION');
    let inserted = 0;
    try {
      for (const key of keys) {
        if (typeof key === 'string' && key.trim()) {
          insertStmt.run(productId, key.trim());
          inserted++;
        }
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

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
router.put('/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // pending, success, failed
    
    if (!['pending', 'success', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'وضعیت نامعتبر است.' });
    }

    db.exec('BEGIN EXCLUSIVE TRANSACTION');

    const orderStmt = db.prepare(`
      SELECT o.*, p.category as productCategory 
      FROM orders o 
      LEFT JOIN products p ON o.productId = p.id 
      WHERE o.id = ?
    `);
    const order = orderStmt.get(id) as any;

    if (!order) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'سفارش یافت نشد.' });
    }

    let licenseId = order.licenseId;
    let warning: string | null = null;

    if (status === 'success') {
      // If marking success and it's a license/account product and doesn't have a license yet:
      if (order.productCategory !== 'package' && !licenseId) {
        const availLicense = db.prepare(
          'SELECT id, key FROM licenses WHERE productId = ? AND status = ? LIMIT 1'
        ).get(order.productId, 'available') as any;

        if (availLicense) {
          licenseId = availLicense.id;
          db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run('sold', licenseId);
        } else {
          warning = 'سفارش به حالت موفق تغییر یافت، اما موجودی لایسنس این محصول خالی است و لایسنسی تخصیص داده نشد.';
        }
      }
    } else if (status === 'failed' || status === 'pending') {
      // If status reverted from success to failed or pending, release the license back
      if (licenseId) {
        db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run('available', licenseId);
        licenseId = null;
      }
    }

    db.prepare('UPDATE orders SET paymentStatus = ?, licenseId = ? WHERE id = ?')
      .run(status, licenseId, id);

    db.exec('COMMIT');

    // Send Telegram delivery notification if approved
    if (status === 'success') {
      sendTelegramOrderSuccess(id, licenseId);
    }

    res.json({ 
      success: true, 
      message: 'وضعیت سفارش بروزرسانی شد.',
      paymentStatus: status,
      licenseId,
      warning
    });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('[Admin API] Error updating order status:', error);
    res.status(500).json({ error: 'خطا در بروزرسانی سفارش' });
  }
});

// POST /api/admin/orders/:id/assign-license
router.post('/orders/:id/assign-license', (req, res) => {
  try {
    const { id } = req.params;
    const { licenseKey, licenseId: providedLicenseId } = req.body;

    if (!licenseKey && !providedLicenseId) {
      return res.status(400).json({ error: 'کلید لایسنس یا شناسه لایسنس الزامی است.' });
    }

    db.exec('BEGIN EXCLUSIVE TRANSACTION');

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      db.exec('ROLLBACK');
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

    db.exec('COMMIT');

    // Notify Telegram buyer
    sendTelegramOrderSuccess(id, finalLicenseId);

    res.json({ success: true, message: 'لایسنس با موفقیت به سفارش تخصیص یافت و سفارش تایید شد.', licenseId: finalLicenseId });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('[Admin API] Error assigning license:', error);
    res.status(500).json({ error: 'خطا در تخصیص لایسنس' });
  }
});

// DELETE /api/admin/orders/:id
router.delete('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.exec('BEGIN EXCLUSIVE TRANSACTION');

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'سفارش یافت نشد.' });
    }

    // If order had a license and was success, release the license
    if (order.licenseId && order.paymentStatus === 'success') {
      db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run('available', order.licenseId);
    }

    db.prepare('DELETE FROM orders WHERE id = ?').run(id);

    db.exec('COMMIT');

    res.json({ success: true, message: 'سفارش با موفقیت حذف شد.' });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('[Admin API] Error deleting order:', error);
    res.status(500).json({ error: 'خطا در حذف سفارش' });
  }
});

// POST /api/admin/reset-database
router.post('/reset-database', (req, res) => {
  try {
    db.exec('BEGIN EXCLUSIVE TRANSACTION');
    
    // Delete all data from all tables (schema remains)
    // IMPORTANT: Order matters because of FOREIGN KEY constraints (e.g. orders -> products ON DELETE RESTRICT)
    const tables = ['orders', 'licenses', 'products', 'conversations', 'otps', 'news'];
    
    for (const table of tables) {
      db.exec(`DELETE FROM ${table}`);
    }
    
    // For users, delete everyone EXCEPT the current admin requesting the reset
    const adminId = (req as any).user.id;
    db.prepare('DELETE FROM users WHERE id != ?').run(adminId);
    
    

    db.exec('COMMIT');
    res.json({ success: true, message: 'دیتابیس با موفقیت پاک شد.' });
  } catch (error) {
    db.exec('ROLLBACK');
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

    res.json({ success: true, message: 'کاربر با موفقیت حذف شد.' });
  } catch (error) {
    console.error('[Admin API] Error deleting user:', error);
    res.status(500).json({ error: 'خطا در حذف کاربر' });
  }
});

export default router;

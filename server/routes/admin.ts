import express from 'express';
import db from '../db/database';
import { requireAuth } from '../middleware/auth';

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
    const { title, description, price, category, image } = req.body;
    
    if (!title || price === undefined || price === null || !category) {
      return res.status(400).json({ error: 'عنوان، قیمت و دسته‌بندی الزامی است.' });
    }

    const stmt = db.prepare('INSERT INTO products (title, description, price, category, image) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(title, description || '', price, category, image || null);

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
    const { title, description, price, category, image } = req.body;
    
    if (!title || price === undefined || price === null || !category) {
      return res.status(400).json({ error: 'عنوان، قیمت و دسته‌بندی الزامی است.' });
    }

    const checkStmt = db.prepare('SELECT id FROM products WHERE id = ?');
    if (!checkStmt.get(id)) {
      return res.status(404).json({ error: 'محصول یافت نشد.' });
    }

    const stmt = db.prepare('UPDATE products SET title = ?, description = ?, price = ?, category = ?, image = ? WHERE id = ?');
    stmt.run(title, description || '', price, category, image || null, id);

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
             p.title as productTitle, p.category as productCategory
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      LEFT JOIN products p ON o.productId = p.id
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
             l.key as licenseKey
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

    const checkStmt = db.prepare('SELECT id FROM orders WHERE id = ?');
    if (!checkStmt.get(id)) {
      return res.status(404).json({ error: 'سفارش یافت نشد.' });
    }

    db.prepare('UPDATE orders SET paymentStatus = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: 'وضعیت سفارش بروزرسانی شد.' });
  } catch (error) {
    console.error('[Admin API] Error updating order status:', error);
    res.status(500).json({ error: 'خطا در بروزرسانی سفارش' });
  }
});

export default router;

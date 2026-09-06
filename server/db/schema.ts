import db from './database';

export function initializeSchema() {
  console.log('[Database] Initializing SQLite schema...');

  // Temporary: drop old users table to migrate to advanced auth
  try {
    const tableInfo = db.prepare('PRAGMA table_info(users)').all() as any[];
    if (!tableInfo.some(col => col.name === 'googleId')) {
      console.log('[Database] Dropping old users table for Advanced Auth migration...');
      db.exec('DROP TABLE users;');
    } else if (!tableInfo.some(col => col.name === 'resetToken')) {
      console.log('[Database] Adding resetToken columns to users table...');
      db.exec('ALTER TABLE users ADD COLUMN resetToken TEXT;');
      db.exec('ALTER TABLE users ADD COLUMN resetTokenExpiry DATETIME;');
    }

    // Add image column to products if it doesn't exist
    try {
      const productsTableInfo = db.prepare('PRAGMA table_info(products)').all() as any[];
      if (productsTableInfo.length > 0 && !productsTableInfo.some(col => col.name === 'image')) {
        console.log('[Database] Adding image column to products table...');
        db.exec('ALTER TABLE products ADD COLUMN image TEXT;');
      }
    } catch (e) {}

    // Add telegramId to users
    try {
      const usersTableInfo = db.prepare('PRAGMA table_info(users)').all() as any[];
      if (usersTableInfo.length > 0 && !usersTableInfo.some(col => col.name === 'telegramId')) {
        console.log('[Database] Adding telegramId column to users table...');
        db.exec('ALTER TABLE users ADD COLUMN telegramId TEXT;');
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegramId ON users(telegramId);');
      }
    } catch (e) {
      console.error('[Database] Failed to add telegramId column:', e);
    }

    // Add sourceUrl to news
    try {
      const newsTableInfo = db.prepare('PRAGMA table_info(news)').all() as any[];
      if (newsTableInfo.length > 0 && !newsTableInfo.some(col => col.name === 'sourceUrl')) {
        console.log('[Database] Adding sourceUrl column to news table...');
        db.exec('ALTER TABLE news ADD COLUMN sourceUrl TEXT;');
      }
    } catch (e) {
      console.error('[Database] Failed to add sourceUrl column:', e);
    }

    // Add tags to news
    try {
      const newsTableInfo = db.prepare('PRAGMA table_info(news)').all() as any[];
      if (newsTableInfo.length > 0 && !newsTableInfo.some(col => col.name === 'tags')) {
        console.log('[Database] Adding tags column to news table...');
        db.exec('ALTER TABLE news ADD COLUMN tags TEXT;');
      }
    } catch (e) {
      console.error('[Database] Failed to add tags column:', e);
    }

  } catch (e) {}

  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      googleId TEXT UNIQUE,
      telegramId TEXT UNIQUE,
      passwordHash TEXT,
      name TEXT,
      avatar TEXT,
      resetToken TEXT,
      resetTokenExpiry DATETIME,
      role TEXT DEFAULT 'user',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      -- Note: CHECK constraint is not updated due to SQLite limitations, but we ensure one of the IDs is present.
    )
  `);

  // Create OTPs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS otps (
      phone TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expiresAt DATETIME NOT NULL
    )
  `);

  // Create Conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      messages TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Store Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      longDescription TEXT,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      image TEXT,
      bannerImage TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add longDescription to existing products table if missing
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(products)`).all() as any[];
    const hasLongDescription = tableInfo.some(col => col.name === 'longDescription');
    if (!hasLongDescription) {
      db.exec(`ALTER TABLE products ADD COLUMN longDescription TEXT`);
      console.log('[DB Schema] Added longDescription column to products table.');
    }
    const hasBannerImage = tableInfo.some(col => col.name === 'bannerImage');
    if (!hasBannerImage) {
      db.exec(`ALTER TABLE products ADD COLUMN bannerImage TEXT`);
      console.log('[DB Schema] Added bannerImage column to products table.');
    }
    const hasBaseUrl = tableInfo.some(col => col.name === 'baseUrl');
    if (!hasBaseUrl) {
      db.exec(`ALTER TABLE products ADD COLUMN baseUrl TEXT`);
      console.log('[DB Schema] Added baseUrl column to products table.');
    }
    const hasDeliveryGuide = tableInfo.some(col => col.name === 'deliveryGuide');
    if (!hasDeliveryGuide) {
      db.exec(`ALTER TABLE products ADD COLUMN deliveryGuide TEXT`);
      console.log('[DB Schema] Added deliveryGuide column to products table.');
    }
  } catch (e) {
    console.error('Migration error:', e);
  }

  // Create Store Licenses/Stock table
  db.exec(`
    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL,
      key TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Create Store Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      licenseId INTEGER,
      amount INTEGER NOT NULL,
      paymentStatus TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT,
      FOREIGN KEY (licenseId) REFERENCES licenses(id) ON DELETE SET NULL
    )
  `);

  // Create News table
  db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      sourceUrl TEXT,
      tags TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('[Database] SQLite schema ready.');
}

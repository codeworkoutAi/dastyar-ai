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

  } catch (e) {}

  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      googleId TEXT UNIQUE,
      passwordHash TEXT,
      name TEXT,
      avatar TEXT,
      resetToken TEXT,
      resetTokenExpiry DATETIME,
      role TEXT DEFAULT 'user',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      CHECK (phone IS NOT NULL OR email IS NOT NULL OR googleId IS NOT NULL)
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
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      image TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  console.log('[Database] SQLite schema ready.');
}

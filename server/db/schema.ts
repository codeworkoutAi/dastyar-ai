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

    // Add botState to users for Telegram persistent state
    try {
      const usersTableInfo = db.prepare('PRAGMA table_info(users)').all() as any[];
      if (usersTableInfo.length > 0 && !usersTableInfo.some(col => col.name === 'botState')) {
        console.log('[Database] Adding botState column to users table...');
        db.exec("ALTER TABLE users ADD COLUMN botState TEXT DEFAULT 'normal';");
      }
      if (usersTableInfo.length > 0 && !usersTableInfo.some(col => col.name === 'walletBalance')) {
        console.log('[Database] Adding walletBalance column to users table...');
        db.exec("ALTER TABLE users ADD COLUMN walletBalance INTEGER DEFAULT 0;");
      }
      if (usersTableInfo.length > 0 && !usersTableInfo.some(col => col.name === 'hasReceivedWelcomeBonus')) {
        console.log('[Database] Adding hasReceivedWelcomeBonus column to users table...');
        db.exec("ALTER TABLE users ADD COLUMN hasReceivedWelcomeBonus INTEGER DEFAULT 0;");
      }
    } catch (e) {
      console.error('[Database] Failed to add wallet columns to users:', e);
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
      botState TEXT DEFAULT 'normal',
      walletBalance INTEGER DEFAULT 0,
      hasReceivedWelcomeBonus INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Migration: Add paymentMethod and trackingNumber to orders table
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(orders)`).all() as any[];
    const hasPaymentMethod = tableInfo.some(col => col.name === 'paymentMethod');
    const hasTrackingNumber = tableInfo.some(col => col.name === 'trackingNumber');

    if (!hasPaymentMethod) {
      db.exec(`ALTER TABLE orders ADD COLUMN paymentMethod TEXT DEFAULT 'online'`);
      console.log('[DB Schema] Added paymentMethod column to orders table.');
    }
    if (!hasTrackingNumber) {
      db.exec(`ALTER TABLE orders ADD COLUMN trackingNumber TEXT`);
      console.log('[DB Schema] Added trackingNumber column to orders table.');
    }
  } catch (e) {
    console.error('Migration error (orders):', e);
  }

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

  // Create Default Profiles table (Server-driven free AI cards for users)
  db.exec(`
    CREATE TABLE IF NOT EXISTS default_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      baseUrl TEXT NOT NULL,
      apiKey TEXT,
      modelName TEXT NOT NULL,
      customHeaders TEXT,
      role TEXT DEFAULT 'default',
      orderIndex INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default profiles if empty
  try {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM default_profiles').get() as { count: number };
    if (!countRow || countRow.count === 0) {
      console.log('[Database] Seeding initial default profiles...');
      const seedStmt = db.prepare(`
        INSERT INTO default_profiles (id, name, baseUrl, apiKey, modelName, customHeaders, role, orderIndex, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      seedStmt.run(
        'default-groq-qwen-27b',
        'Qwen 3.6 27B (رایگان)',
        'https://api.groq.com/openai/v1',
        process.env.DEFAULT_GROQ_KEY || '',
        'qwen/qwen3.6-27b',
        '',
        'default',
        0,
        1
      );

      seedStmt.run(
        'default-groq-gpt-oss-120b',
        'GPT OSS 120B (رایگان)',
        'https://api.groq.com/openai/v1',
        process.env.DEFAULT_GROQ_KEY || '',
        'openai/gpt-oss-120b',
        '',
        'coding',
        1,
        1
      );

      seedStmt.run(
        'default-gemini-3-1-flash-lite',
        'Gemini 3.1 Flash Lite (رایگان)',
        'https://generativelanguage.googleapis.com/v1beta/openai',
        process.env.DEFAULT_GEMINI_KEY || '',
        'gemini-3.1-flash-lite',
        '',
        'vision',
        2,
        1
      );
    }
  } catch (seedErr) {
    console.error('[Database] Failed to seed default profiles:', seedErr);
  }

  // Create Site Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Wallet Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'deposit', 'chat_usage', 'bonus', 'refund'
      amount INTEGER NOT NULL, -- in Tomans (positive for credit, negative for debit)
      balanceAfter INTEGER NOT NULL,
      model TEXT,
      promptTokens INTEGER DEFAULT 0,
      completionTokens INTEGER DEFAULT 0,
      costUsd REAL DEFAULT 0,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create API Purchases table (Admin multi-provider purchase logs)
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_purchases (
      id TEXT PRIMARY KEY,
      providerName TEXT NOT NULL,
      amountUsd REAL NOT NULL,
      costToman INTEGER NOT NULL,
      unitRateToman REAL NOT NULL,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default site settings if missing
  try {
    const seedSetting = (key: string, defaultValue: string) => {
      const existing = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key);
      if (!existing) {
        db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)').run(key, defaultValue);
      }
    };

    seedSetting('news_auto_publish', 'false');
    seedSetting('api_dollar_rate', '200000'); // 200,000 Tomans per $1 API by default
    seedSetting('welcome_bonus_amount', '50000'); // 50,000 Tomans welcome credit
    // Ensure existing database has 50000 if previously 5000
    try {
      const existingBonus = db.prepare("SELECT value FROM site_settings WHERE key = 'welcome_bonus_amount'").get() as any;
      if (existingBonus?.value === '5000') {
        db.prepare("UPDATE site_settings SET value = '50000' WHERE key = 'welcome_bonus_amount'").run();
      }
    } catch {}
    seedSetting('welcome_bonus_enabled', 'true');
    seedSetting('free_key_pool', ''); // Comma- or newline-separated free keys for round-robin
  } catch (err) {
    console.error('[Database] Failed to seed site settings:', err);
  }

  console.log('[Database] SQLite schema ready.');
}

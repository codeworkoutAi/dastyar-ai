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

    // Force update existing free profiles to use Gemini Pool instead of router.cheap
    try {
      console.log('[Database] Migrating free profiles to Gemini Keys Pool...');
      db.prepare("UPDATE default_profiles SET baseUrl = 'https://generativelanguage.googleapis.com', modelName = 'gemini-3.6-flash', apiKey = '' WHERE id = 'free_default'").run();
      db.prepare("UPDATE default_profiles SET baseUrl = 'https://generativelanguage.googleapis.com', modelName = 'gemini-2.0-pro-exp-02-05', apiKey = '' WHERE id = 'free_coding'").run();
      db.prepare("UPDATE default_profiles SET baseUrl = 'https://generativelanguage.googleapis.com', modelName = 'gemini-3.6-flash', apiKey = '' WHERE id = 'free_vision'").run();
    } catch (e) {
      console.error('[Database] Failed to migrate free profiles:', e);
    }

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
      // Soft-delete marker. Admin user removal is an ARCHIVE, not a hard DELETE:
      // orders, wallet_transactions and sold licenses are financial records that
      // must keep resolving to a real user row, otherwise the finance and
      // analytics tabs report orphaned money with no owner.
      if (usersTableInfo.length > 0 && !usersTableInfo.some(col => col.name === 'isArchived')) {
        console.log('[Database] Adding isArchived column to users table...');
        db.exec("ALTER TABLE users ADD COLUMN isArchived INTEGER DEFAULT 0;");
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
      faqs TEXT,
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
    const hasBadge = tableInfo.some(col => col.name === 'badge');
    if (!hasBadge) {
      db.exec(`ALTER TABLE products ADD COLUMN badge TEXT`);
      console.log('[DB Schema] Added badge column to products table.');
    }
    const hasFeatures = tableInfo.some(col => col.name === 'features');
    if (!hasFeatures) {
      db.exec(`ALTER TABLE products ADD COLUMN features TEXT`);
      console.log('[DB Schema] Added features column to products table.');
    }
    const hasTokenEstimate = tableInfo.some(col => col.name === 'tokenEstimate');
    if (!hasTokenEstimate) {
      db.exec(`ALTER TABLE products ADD COLUMN tokenEstimate TEXT`);
      console.log('[DB Schema] Added tokenEstimate column to products table.');
    }
    const hasIsPopular = tableInfo.some(col => col.name === 'isPopular');
    if (!hasIsPopular) {
      db.exec(`ALTER TABLE products ADD COLUMN isPopular INTEGER DEFAULT 0`);
      console.log('[DB Schema] Added isPopular column to products table.');
    }
    const hasShowOnLanding = tableInfo.some(col => col.name === 'showOnLanding');
    if (!hasShowOnLanding) {
      db.exec(`ALTER TABLE products ADD COLUMN showOnLanding INTEGER DEFAULT 1`);
      console.log('[DB Schema] Added showOnLanding column to products table.');
    }
    const hasFaqs = tableInfo.some(col => col.name === 'faqs');
    if (!hasFaqs) {
      db.exec(`ALTER TABLE products ADD COLUMN faqs TEXT`);
      console.log('[DB Schema] Added faqs column to products table.');
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

  // Migration: Add paymentMethod, trackingNumber, authority, refId, and cardPan to orders table
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(orders)`).all() as any[];
    const hasPaymentMethod = tableInfo.some(col => col.name === 'paymentMethod');
    const hasTrackingNumber = tableInfo.some(col => col.name === 'trackingNumber');
    const hasAuthority = tableInfo.some(col => col.name === 'authority');
    const hasRefId = tableInfo.some(col => col.name === 'refId');
    const hasCardPan = tableInfo.some(col => col.name === 'cardPan');

    if (!hasPaymentMethod) {
      db.exec(`ALTER TABLE orders ADD COLUMN paymentMethod TEXT DEFAULT 'online'`);
      console.log('[DB Schema] Added paymentMethod column to orders table.');
    }
    if (!hasTrackingNumber) {
      db.exec(`ALTER TABLE orders ADD COLUMN trackingNumber TEXT`);
      console.log('[DB Schema] Added trackingNumber column to orders table.');
    }
    if (!hasAuthority) {
      db.exec(`ALTER TABLE orders ADD COLUMN authority TEXT`);
      console.log('[DB Schema] Added authority column to orders table.');
    }
    if (!hasRefId) {
      db.exec(`ALTER TABLE orders ADD COLUMN refId TEXT`);
      console.log('[DB Schema] Added refId column to orders table.');
    }
    if (!hasCardPan) {
      db.exec(`ALTER TABLE orders ADD COLUMN cardPan TEXT`);
      console.log('[DB Schema] Added cardPan column to orders table.');
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
        INSERT OR REPLACE INTO default_profiles (id, name, baseUrl, apiKey, modelName, customHeaders, role, orderIndex, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 1. Free Default (Ultra-economic general chat)
      seedStmt.run('free_default', 'دستیار چت و گفتگو', 'https://generativelanguage.googleapis.com', '', 'gemini-3.6-flash', '', 'default', 0, 1);
      // 2. Free Coding
      seedStmt.run('free_coding', 'دستیار برنامه‌نویسی و کد', 'https://generativelanguage.googleapis.com', '', 'gemini-2.0-pro-exp-02-05', '', 'coding', 1, 1);
      // 3. Free Vision
      seedStmt.run('free_vision', 'دستیار بینایی و اسناد', 'https://generativelanguage.googleapis.com', '', 'gemini-3.6-flash', '', 'vision', 2, 1);
      
      // 4. Paid Default (Pro smart Claude assistant)
      seedStmt.run('paid_default', 'دستیار هوشمند کلود', 'https://router.cheap/v1', process.env.ROUTER_CHEAP_KEY || '', 'claude-sonnet-4-6', '', 'paid_default', 3, 1);
      // 5. Paid Coding
      seedStmt.run('paid_coding', 'دستیار مهندسی دیپ‌سیک', 'https://router.cheap/v1', process.env.ROUTER_CHEAP_KEY || '', 'deepseek-v4-pro', '', 'paid_coding', 4, 1);
      // 6. Paid Vision
      seedStmt.run('paid_vision', 'دستیار اسناد و بینایی جمینای', 'https://router.cheap/v1', process.env.ROUTER_CHEAP_KEY || '', 'gemini-3.8-flash', '', 'paid_vision', 5, 1);
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
  // Indexes for wallet_transactions.
  // This is the highest-write table in the system (one row per chat turn) and every
  // admin finance query filters/sorts on createdAt, userId or type. Without these,
  // EXPLAIN QUERY PLAN showed "SCAN wt" + "USE TEMP B-TREE FOR ORDER BY" on all of them.
  // Idempotent and safe to re-run against existing databases.
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_wt_createdAt ON wallet_transactions(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_wt_userId ON wallet_transactions(userId, createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_wt_type ON wallet_transactions(type, createdAt DESC);
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

    seedSetting('news_auto_publish', 'true');
    try {
      db.prepare("UPDATE site_settings SET value = 'true' WHERE key = 'news_auto_publish'").run();
    } catch {}
    seedSetting('api_dollar_rate', '200000'); // 200,000 Tomans per $1 API by default
    seedSetting('free_daily_limit_user', '15'); // 15 free messages per 24-hour day
    seedSetting('free_cooldown_hours', '24'); // 24-hour daily quota cooldown
    seedSetting('free_daily_limit_guest', '5');
    seedSetting('bazaarpay_destination', '');
    seedSetting('bazaarpay_token', '');
    seedSetting('bazaarpay_enabled', 'false');
  } catch (err) {
    console.error('[Database] Failed to seed site settings:', err);
  }

  // Create Promo Codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'registration_bonus', -- 'registration_bonus', 'discount_percent', 'extra_charge_percent'
      value INTEGER NOT NULL,
      maxUses INTEGER DEFAULT 0,
      currentUses INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Free Models Daily Usage table
  db.exec(`
    CREATE TABLE IF NOT EXISTS free_daily_usage (
      id TEXT, -- 'user:ID' or 'ip:1.2.3.4'
      date TEXT, -- 'window' or 'YYYY-MM-DD'
      count INTEGER DEFAULT 0,
      windowStart INTEGER DEFAULT 0,
      PRIMARY KEY (id, date)
    )
  `);
  try {
    db.exec(`ALTER TABLE free_daily_usage ADD COLUMN windowStart INTEGER DEFAULT 0;`);
  } catch {}

  // Create Free Image Daily Usage table
  db.exec(`
    CREATE TABLE IF NOT EXISTS free_image_usage (
      userId INTEGER PRIMARY KEY,
      count INTEGER DEFAULT 0,
      windowStart INTEGER DEFAULT 0
    )
  `);

  // Create Telegram Pending Receipts table (for card-to-card payment flow)
  db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_pending_receipts (
      tgId TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('[Database] SQLite schema ready.');
}

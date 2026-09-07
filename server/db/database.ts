import Database from 'libsql';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'server', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'chatbox.db');

const syncUrl = (process.env.TURSO_DATABASE_URL || '').trim();
const authToken = (process.env.TURSO_AUTH_TOKEN || '').trim();

let db: any;

if (syncUrl && authToken) {
  console.log('[Database] Connecting to Turso Cloud database with local replica...');
  db = new Database(dbPath, {
    syncUrl,
    authToken
  });
  try {
    console.log('[Database] Synchronizing schema and data with Turso Cloud...');
    db.sync();
    console.log('[Database] Successfully synchronized with Turso Cloud.');
  } catch (syncErr) {
    console.warn('[Database] Initial Turso sync failed, continuing locally:', syncErr);
  }

  // Periodic sync every 2 minutes
  setInterval(() => {
    try {
      db.sync();
    } catch (e) {
      console.warn('[Database] Background Turso sync error:', e);
    }
  }, 2 * 60 * 1000);

  // Sync on process termination
  process.on('SIGTERM', () => {
    try { db.sync(); } catch (e) {}
  });
  process.on('SIGINT', () => {
    try { db.sync(); } catch (e) {}
  });
} else {
  console.log('[Database] No TURSO credentials provided, using local SQLite Database.');
  db = new Database(dbPath);
  try {
    db.exec('PRAGMA journal_mode = WAL;');
  } catch (e) {}
}

export function syncDatabase() {
  if (syncUrl && authToken && db && typeof db.sync === 'function') {
    try {
      db.sync();
    } catch (e) {
      console.warn('[Database] Manual sync error:', e);
    }
  }
}

export default db;

import Database from 'libsql';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Test isolation: vitest sets VITEST=true. Under test we must never touch the real
// database — the previous behaviour read TURSO_* from .env at module load and
// connected to the live Turso Cloud database (and synced the schema into it) simply
// because a test file imported this module. A throwaway SQLite file keeps tests hermetic.
const IS_TEST = !!process.env.VITEST || process.env.NODE_ENV === 'test';

// Ensure data directory exists
const dataDir = IS_TEST
  ? path.join(process.cwd(), 'server', 'data', '.test-tmp')
  : path.join(process.cwd(), 'server', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'chatbox.db');
const dbInfoPath = path.join(dataDir, 'chatbox.db-info');

// Self-healing: if orphan metadata/info file exists but db does not, remove it to avoid InvalidLocalState
if (!fs.existsSync(dbPath) && fs.existsSync(dbInfoPath)) {
  try {
    fs.unlinkSync(dbInfoPath);
    console.log('[Database] Removed orphan chatbox.db-info to ensure clean sync state.');
  } catch (e) {}
}

// Under test, ignore Turso credentials entirely even though .env supplies them.
const syncUrl = IS_TEST ? '' : (process.env.TURSO_DATABASE_URL || '').trim();
const authToken = IS_TEST ? '' : (process.env.TURSO_AUTH_TOKEN || '').trim();

let db: any;

if (syncUrl && authToken) {
  console.log('[Database] Connecting to Turso Cloud database with local replica...');
  try {
    db = new Database(dbPath, {
      syncUrl,
      authToken,
      syncPeriod: 120 // 2 minutes background sync (non-blocking Rust thread)
    } as any);
  } catch (initErr: any) {
    const errMsg = initErr?.message?.toLowerCase() || '';
    if (errMsg.includes('invalid local state') || errMsg.includes('metadata file exists') || errMsg.includes('walconflict')) {
      console.warn('[Database] Invalid local replica state detected. Cleaning up local replica files and retrying...');
      try {
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        if (fs.existsSync(dbInfoPath)) fs.unlinkSync(dbInfoPath);
        const walPath = path.join(dataDir, 'chatbox.db-wal');
        if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
        const shmPath = path.join(dataDir, 'chatbox.db-shm');
        if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
      } catch (cleanupErr) {}
              db = new Database(dbPath, {
      syncUrl,
      authToken,
      syncPeriod: 120 // 2 minutes background sync (non-blocking Rust thread)
      } as any);
    } else {
      console.warn(`[Database] ⚠️ Turso Cloud connection failed (${initErr?.message || 'Network/DNS error'}). Falling back gracefully to local SQLite database mode.`);
      db = new Database(dbPath);
      try {
        db.exec('PRAGMA journal_mode = WAL;');
      } catch (e) {}
    }
  }
  // Run initial sync asynchronously in the background so it doesn't block Node startup
  setTimeout(() => {
    try {
      if (db && typeof db.sync === 'function') {
        console.log('[Database] Synchronizing schema and data with Turso Cloud...');
        db.sync();
        console.log('[Database] Successfully synchronized with Turso Cloud.');
      }
    } catch (syncErr: any) {
      console.warn('[Database] Initial Turso sync failed, continuing locally:', syncErr?.message || syncErr);
    }
  }, 100);

  // Background sync is now handled efficiently by the Rust layer via syncPeriod: 120

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

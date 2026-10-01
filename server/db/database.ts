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

let realDb: any = null;
let connectStarted = false;

// The embedded-replica constructor performs its first remote sync SYNCHRONOUSLY. When
// syncUrl is slow or unreachable that blocks for minutes before it ever throws, and
// because this module is imported at the top of server/index.ts it happens long before
// app.listen() — so the process sat alive with no bound port and Render failed the
// deploy with "Port scan timeout reached, no open ports detected" after 15 minutes,
// with no error anywhere in the log.
//
// So the connection is deferred and lazy. `connect()` is scheduled on the next tick,
// which lets server/index.ts finish evaluating and bind the port first; every access
// through the exported proxy waits for the real handle. The server therefore becomes
// reachable immediately and a replica that is still syncing degrades to slow requests
// instead of an unbootable deploy.
function connect() {
  if (connectStarted) return;
  connectStarted = true;

  // Local handle: assigned to realDb only once fully constructed. Writing straight to
  // the exported proxy would be a temporal-dead-zone error, since `db` below is const.
  let instance: any;

  // Preflight: a blocking replica handshake must never be entered blindly. If the
  // remote host does not even resolve there is no point waiting on it, so fall back to
  // local SQLite and let the app boot. DNS resolution is synchronous (lookupSync), so
  // this stays inside the deferred connect() and adds no startup latency of its own.
  let tursoResolvable = false;
  try {
    const hostname = new URL(syncUrl).hostname;
    const dns = require('dns');
    // lookupSync only exists on newer Node; fall back to the callback form, which is
    // fine here because connect() itself is already deferred off the startup path.
    if (typeof dns.lookupSync === 'function') {
      dns.lookupSync(hostname);
      tursoResolvable = true;
    } else {
      dns.lookup(hostname, (err: any) => {
        if (err) console.warn('[Database] Turso host lookup failed:', err.message);
      });
      tursoResolvable = true;
    }
  } catch (e) {
    console.warn('[Database] Turso host not resolvable, using local SQLite for this boot:', (e as any)?.message || e);
  }

  if (syncUrl && authToken && tursoResolvable) {
  console.log('[Database] Connecting to Turso Cloud database with local replica...');
  try {
    instance = new Database(dbPath, {
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
              instance = new Database(dbPath, {
      syncUrl,
      authToken,
      syncPeriod: 120 // 2 minutes background sync (non-blocking Rust thread)
      } as any);
    } else {
      console.warn(`[Database] ⚠️ Turso Cloud connection failed (${initErr?.message || 'Network/DNS error'}). Falling back gracefully to local SQLite database mode.`);
      instance = new Database(dbPath);
      try {
        instance.exec('PRAGMA journal_mode = WAL;');
      } catch (e) {}
    }
  }
  // Run initial sync asynchronously in the background so it doesn't block Node startup
  setTimeout(() => {
    try {
      if (instance && typeof instance.sync === 'function') {
        console.log('[Database] Synchronizing schema and data with Turso Cloud...');
        instance.sync();
        console.log('[Database] Successfully synchronized with Turso Cloud.');
      }
    } catch (syncErr: any) {
      console.warn('[Database] Initial Turso sync failed, continuing locally:', syncErr?.message || syncErr);
    }
  }, 100);

  // Background sync is now handled efficiently by the Rust layer via syncPeriod: 120

  // Sync on process termination
  process.on('SIGTERM', () => {
    try { instance.sync(); } catch (e) {}
  });
  process.on('SIGINT', () => {
    try { instance.sync(); } catch (e) {}
  });
} else {
  console.log('[Database] No TURSO credentials provided, using local SQLite Database.');
  instance = new Database(dbPath);
  try {
    instance.exec('PRAGMA journal_mode = WAL;');
  } catch (e) {}
  }

  realDb = instance;
}

// Kick the connection off on the next tick so server/index.ts can bind the port
// first. Everything that touches `db` awaits the same lazy handle below.
setImmediate(connect);

// Lazily-resolved handle. Any property access blocks until `realDb` exists, so routes
// keep working unchanged; they simply wait during the one-time replica handshake.
const db = new Proxy({} as any, {
  get(_target, prop) {
    if (!realDb) connect();
    const value = (realDb as any)[prop];
    return typeof value === 'function' ? value.bind(realDb) : value;
  },
  set(_target, prop, value) {
    if (!realDb) connect();
    (realDb as any)[prop] = value;
    return true;
  },
  has(_target, prop) {
    if (!realDb) connect();
    return prop in (realDb as any);
  },
});

export function syncDatabase() {
  if (!realDb) connect();
  if (syncUrl && authToken && realDb && typeof realDb.sync === 'function') {
    try {
      realDb.sync();
    } catch (e) {
      console.warn('[Database] Manual sync error:', e);
    }
  }
}

export default db;

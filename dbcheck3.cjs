const Database = require("libsql");
const db = new Database("server/data/chatbox.db", { readOnly: true });
const q = (s) => { try { return db.prepare(s).all(); } catch (e) { return "ERR: " + e.message; } };

console.log("=== integrity (read WAL) ===");
console.log(q("PRAGMA integrity_check"));
console.log("\n=== row counts ===");
console.log("wallet_transactions:", q("SELECT COUNT(*) as c FROM wallet_transactions")[0]);
console.log("users:", q("SELECT COUNT(*) as c FROM users")[0]);
console.log("newest 3 tx:");
q("SELECT userId, type, amount, model, createdAt FROM wallet_transactions ORDER BY createdAt DESC LIMIT 3").forEach(r => console.log("  ", JSON.stringify(r)));
console.log("\n=== indexes present? ===");
q("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='wallet_transactions'").forEach(r => console.log("  " + r.name));
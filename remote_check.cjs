const fs = require("fs");
const path = require("path");
const env = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
function getVar(name) {
  const m = env.match(new RegExp("^\\s*" + name + "\\s*=\\s*(.*)$", "m"));
  if (!m) return "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}
const url = getVar("TURSO_DATABASE_URL");
const token = getVar("TURSO_AUTH_TOKEN");
console.log("url prefix:", url.slice(0, 30), "| token length:", token.length);
if (!url || !token) process.exit(1);

// Use Turso's HTTP pipeline API. This NEVER touches the local replica file.
async function hr(sql) {
  const res = await fetch(url + "/v2/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql } }, { type: "close" }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(j));
  const r = j.results && j.results[0];
  if (r && r.type === "error") throw new Error("SQL: " + JSON.stringify(r.error));
  return r && r.response && r.response.result ? r.response.result.rows : [];
}

(async () => {
  const fmt = (rows) => rows.map(r => r.map(c => (c && c.value !== undefined ? c.value : c)).join(" | "));

  console.log("\n=== REMOTE (Turso) authoritative state ===");
  console.log("wallet_transactions:", fmt(await hr("SELECT COUNT(*) AS c FROM wallet_transactions")));
  console.log("users:", fmt(await hr("SELECT COUNT(*) AS c FROM users")));
  console.log("\nrows by type:");
  fmt(await hr("SELECT type, COUNT(*) AS c FROM wallet_transactions GROUP BY type ORDER BY c DESC")).forEach(r => console.log("  " + r));
  console.log("\nnewest 3 on remote:");
  fmt(await hr("SELECT userId, type, amount, model, createdAt FROM wallet_transactions ORDER BY createdAt DESC LIMIT 3")).forEach(r => console.log("  " + r));
  console.log("\n=== indexes already on REMOTE ===");
  fmt(await hr("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='wallet_transactions'")).forEach(r => console.log("  " + r));
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
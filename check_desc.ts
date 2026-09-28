import db from './server/db/database.js'; const p = db.prepare('SELECT longDescription FROM products WHERE id = ?').get(19); console.log(p.longDescription);

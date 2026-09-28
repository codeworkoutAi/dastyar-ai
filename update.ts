import Database from 'libsql';
const db = new Database('server/data/chatbox.db');
db.exec("UPDATE products SET bannerImage = '/images/gemini-pro-banner.jpg' WHERE id = 19");
console.log("Updated banner");

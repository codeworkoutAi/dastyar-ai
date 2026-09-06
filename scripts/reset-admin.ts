import db from '../server/db/database.js';
import bcrypt from 'bcryptjs';

console.log('Resetting admin password...');

try {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('admin123', salt);

  const stmt = db.prepare(`UPDATE users SET passwordHash = ? WHERE role = 'admin'`);
  const info = stmt.run(passwordHash);

  if (info.changes > 0) {
    console.log(`✅ Successfully updated ${info.changes} admin account(s).`);
    console.log('🔑 New Password for admin: admin123');
  } else {
    console.log('❌ No admin accounts found in the database. Creating one...');
    
    // Create an admin if none exists
    const insertStmt = db.prepare(`
      INSERT INTO users (email, name, passwordHash, role, provider)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStmt.run('admin@admin.com', 'Admin', passwordHash, 'admin', 'local');
    
    console.log('✅ Created default admin account.');
    console.log('✉️ Email: admin@admin.com');
    console.log('🔑 Password: admin123');
  }
} catch (err) {
  console.error('❌ Error resetting password:', err);
}

process.exit(0);

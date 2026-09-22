const Database = require('libsql');
const db = new Database('server/data/chatbox.db');

console.log('--- Setting up 6 Clean Profiles ---');

// 1. Get existing router.cheap key
const existingRouterProfile = db.prepare("SELECT apiKey FROM default_profiles WHERE baseUrl LIKE '%router.cheap%' AND apiKey != '' LIMIT 1").get();
const routerKey = existingRouterProfile ? existingRouterProfile.apiKey : '';
console.log('Found Router.cheap key:', Boolean(routerKey));

// 2. Get existing pool models mapping if available
const existingDefault = db.prepare("SELECT modelName FROM default_profiles WHERE role = 'default' AND apiKey = '[AUTO_POOL]'").get();
const existingCoding = db.prepare("SELECT modelName FROM default_profiles WHERE role = 'coding' AND apiKey = '[AUTO_POOL]'").get();
const existingVision = db.prepare("SELECT modelName FROM default_profiles WHERE role = 'vision' AND apiKey = '[AUTO_POOL]'").get();

const defaultModel = existingDefault ? existingDefault.modelName : '{"https://openrouter.ai/api/v1":"openai/gpt-4o-mini"}';
const codingModel = existingCoding ? existingCoding.modelName : '{"https://openrouter.ai/api/v1":"deepseek/deepseek-v3.2"}';
const visionModel = existingVision ? existingVision.modelName : '{"https://openrouter.ai/api/v1":"xiaomi/mimo-v2.6-pro-ultraspeed"}';

// 3. Clear existing default_profiles
db.exec("DELETE FROM default_profiles;");
console.log('Cleared old profiles from default_profiles.');

// 4. Insert 3 Free Cards
const insertStmt = db.prepare(`
  INSERT INTO default_profiles (id, name, baseUrl, apiKey, modelName, role, orderIndex, isActive, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);

insertStmt.run(
  'free_default',
  'دستیار چت و گفتگو (رایگان)',
  '[DYNAMIC_POOL] / Auto-Routed',
  '[AUTO_POOL]',
  defaultModel,
  'default',
  1
);

insertStmt.run(
  'free_coding',
  'دستیار کدنویسی و تحلیل (رایگان)',
  '[DYNAMIC_POOL] / Auto-Routed',
  '[AUTO_POOL]',
  codingModel,
  'coding',
  2
);

insertStmt.run(
  'free_vision',
  'دستیار بینایی و اسناد (رایگان)',
  '[DYNAMIC_POOL] / Auto-Routed',
  '[AUTO_POOL]',
  visionModel,
  'vision',
  3
);

console.log('Created 3 Free cards (free_default, free_coding, free_vision)');

// 5. Insert 3 Credit (اعتباری) Cards
insertStmt.run(
  'paid_default',
  'دستیار هوشمند لونا (اعتباری)',
  'https://router.cheap/v1',
  routerKey,
  'gpt-5.6-luna',
  'paid_default',
  4
);

insertStmt.run(
  'paid_coding',
  'دستیار مهندسی دیپ‌سیک (اعتباری)',
  'https://router.cheap/v1',
  routerKey,
  'deepseek-v3',
  'paid_coding',
  5
);

insertStmt.run(
  'paid_vision',
  'دستیار اسناد و بینایی جمینای (اعتباری)',
  'https://router.cheap/v1',
  routerKey,
  'gemini-3.8-flash',
  'paid_vision',
  6
);

console.log('Created 3 Credit cards (paid_default, paid_coding, paid_vision)');

// 6. Update free daily limit in site_settings to 15
db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('free_daily_limit_user', '15')").run();
db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('free_daily_limit_guest', '5')").run();
console.log('Updated free_daily_limit_user to 15 in site_settings.');

// 7. Verify table
const allProfiles = db.prepare("SELECT id, name, role, modelName, baseUrl FROM default_profiles ORDER BY orderIndex ASC").all();
console.log('Final Profiles in DB:');
for (const p of allProfiles) {
  console.log(`- [${p.id}] ${p.name} (${p.role}) -> ${p.modelName}`);
}

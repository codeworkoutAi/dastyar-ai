const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf-8');

code = code.replace(
  "if (m.imageUrl && m.imageUrl.startsWith('data:image')) {",
  "if (m.imageUrl && m.imageUrl.startsWith('data:')) {"
);
code = code.replace(
  "'[تصویر ضمیمه شده به دلیل محدودیت حافظه حذف شد]'",
  "'[فایل/تصویر ضمیمه شده به دلیل پر شدن حافظه موقت مرورگر حذف شد]'"
);
code = code.replace(
  "m.content + '\\n[تصویر ضمیمه شده به دلیل محدودیت حافظه حذف شد]'",
  "m.content + '\\n[فایل/تصویر ضمیمه شده به دلیل پر شدن حافظه موقت مرورگر حذف شد]'"
);

fs.writeFileSync('src/lib/storage.ts', code);

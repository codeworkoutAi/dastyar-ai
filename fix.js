const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const baseSystemPrompt = '));
lines[idx] = '    const baseSystemPrompt = \شما «دستیار هوشمند» هستید؛ متمرکز، دقیق و مسلط به زبان فارسی. پاسخها را به فارسی شیوا، دستهبندیشده و ساختاریافته ارائه دهید. در موضوعات فنی و برنامهنویسی، کدهای استاندارد همراه با توضیحات موجز بنویسید. هرگز خود را با نام پلتفرمهای متفرقه معرفی نکنید.\\n\\n\\\\\;';
fs.writeFileSync('server.ts', lines.join('\n'), 'utf8');

const fs = require('fs');
let content = fs.readFileSync('src/pages/store/UserDashboard.tsx', 'utf8');

// Remove specific text colors that override clay-landing-bg
content = content.replace(/ text-zinc-[0-9]+ dark:text-zinc-[0-9]+/g, '');
content = content.replace(/ text-zinc-[0-9]+/g, '');

fs.writeFileSync('src/pages/store/UserDashboard.tsx', content);

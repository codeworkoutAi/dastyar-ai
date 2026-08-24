const fs = require('fs');

const file = 'src/components/MarkdownRenderer.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix strong tags
content = content.replace(/className="font-bold text-inherit text-blue-600 text-sky-700 dark:text-sky-200"/g, 'className="font-bold text-blue-700 dark:text-sky-300"');

// Fix code tags
content = content.replace(/text-blue-600 text-sky-600 dark:text-sky-300/g, 'text-blue-700 dark:text-sky-300');

// Fix links
content = content.replace(/text-blue-500 dark:text-sky-400/g, 'text-blue-700 dark:text-sky-400');

// Fix list markers
content = content.replace(/marker:text-blue-600 dark:marker:text-blue-500/g, 'marker:text-blue-700 dark:marker:text-sky-400');

// Any other text-blue-500 that might have been left?
content = content.replace(/text-blue-500/g, 'text-blue-700 dark:text-blue-400');

// Wait, let's just make sure we don't mess up border-blue-500 which is already fine or we fix it too.

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed markdown colors');

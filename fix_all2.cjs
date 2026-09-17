const fs = require('fs');

function processFile(path) {
  if(!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  let original = content;

  // Buttons & Badges
  content = content.replace(/bg-zinc-100 dark:bg-zinc-800/g, 'clay-btn-thick');
  content = content.replace(/hover:bg-zinc-200 dark:hover:bg-zinc-700/g, '');
  content = content.replace(/bg-zinc-200 dark:bg-zinc-800/g, 'clay-btn-thick');
  
  // Inputs
  content = content.replace(/bg-zinc-50\/80 dark:bg-zinc-800\/50 border border-zinc-200\/?8?0? dark:border-zinc-700/g, 'clay-inset-thick');
  
  // Flat panels (p-3.5)
  content = content.replace(/border border-zinc-200\/?7?0? dark:border-zinc-800 bg-zinc-50\/50 dark:bg-zinc-800\/30/g, 'clay-card-thick');
  content = content.replace(/bg-zinc-50 dark:bg-zinc-800\/50/g, 'clay-card-thick');
  content = content.replace(/bg-zinc-50 dark:bg-zinc-800\/30/g, 'clay-card-thick');
  content = content.replace(/bg-zinc-50 dark:bg-zinc-800/g, 'clay-card-thick');

  // Any remaining generic white cards
  content = content.replace(/bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/g, 'clay-card-thick hover:clay-card-elevated');

  if(original !== content) {
    fs.writeFileSync(path, content);
    console.log('Fixed additional styles in ' + path);
  }
}

const storeFiles = fs.readdirSync('src/pages/store').filter(f => f.endsWith('.tsx')).map(f => 'src/pages/store/' + f);
const blogFiles = fs.readdirSync('src/pages/blog').filter(f => f.endsWith('.tsx')).map(f => 'src/pages/blog/' + f);

[...storeFiles, ...blogFiles].forEach(processFile);


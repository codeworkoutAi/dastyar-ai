const fs = require('fs');
const files = ['src/pages/blog/Blog.tsx', 'src/pages/blog/TagArchive.tsx'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<img\s/g, '<img loading="lazy" decoding="async" ');
  // prevent duplicate
  content = content.replace(/(loading="lazy"\s+decoding="async"\s+)+/g, 'loading="lazy" decoding="async" ');
  fs.writeFileSync(file, content, 'utf8');
}

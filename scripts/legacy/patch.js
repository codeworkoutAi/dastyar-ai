const fs = require('fs');
const file = 'c:/Users/farha/Fa-Chatbox/src/pages/store/StoreFront.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<div className="w-full h-48 clay-inset-thick relative flex-shrink-0 overflow-hidden rounded-b-none border-t-0 border-l-0 border-r-0 bg-[#0d0e15]">',
  '<div className="w-full aspect-video clay-inset-thick relative flex-shrink-0 overflow-hidden rounded-b-none border-t-0 border-l-0 border-r-0 bg-[#0d0e15]">'
);

content = content.replace(
  '<img src={p.bannerImage || p.image} alt={p.title} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />',
  '<img src={p.bannerImage || p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Success');

const fs = require('fs');
let file = 'src/pages/blog/Blog.tsx';
let content = fs.readFileSync(file, 'utf8');

let startIndex = content.indexOf('{/* CTA Banner */}');
let endIndex = content.indexOf('</article>', startIndex);

if(startIndex !== -1 && endIndex !== -1) {
  let newCTA = `{/* CTA Banner */}
  <div className="mt-12 p-6 md:p-8 rounded-[32px] bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-sm group">
  <div className="flex-1 w-full">
  <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white mb-2">
  سوالی درباره این خبر دارید؟
  </h3>
  <p className="text-sm text-[#525d75] dark:text-[#9aa5bc] mb-4">
  برای درک بهتر مفاهیم تخصصی این مقاله، با دستیار هوشمند ما گفتگو کنید!
  </p>
  <div className="flex flex-wrap items-center gap-2">
  {[
    'خلاصه ۳ خطی این خبر',
    'تحلیل این خبر به زبان ساده',
    'آینده این فناوری چیه؟'
  ].map((chip, idx) => (
    <Link 
      key={idx}
      to={\`/?prompt=\${encodeURIComponent(chip + ': ' + selectedPost.title + '\\nلینک خبر: ' + window.location.href)}\`}
      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/60 dark:bg-zinc-800/60 border border-[var(--card-border)] hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-500/30 text-[#525d75] dark:text-[#9aa5bc] hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300"
    >
      {chip}
    </Link>
  ))}
  </div>
  </div>
  <Link 
  to={\`/?prompt=\${encodeURIComponent('درباره این خبر به من اطلاعات بیشتری بده: ' + selectedPost.title + '\\nلینک خبر: ' + window.location.href)}\`}
  className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md hover:-translate-y-0.5 w-full md:w-auto justify-center"
  >
  <MessageCircle className="w-5 h-5" />
  شروع گفتگو
  </Link>
  </div>
  `;
  content = content.substring(0, startIndex) + newCTA + content.substring(endIndex);
  fs.writeFileSync(file, content, 'utf8');
}

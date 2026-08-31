import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const text = `\`\`\`reasoning
The user wants news about Iran. Let me summarize the news from the provided search results.
\`\`\`

---

# 📰 گزارش اخبار روز ایران — دوشنبه ۹ شهریور ۱۴۰۵`;

function formatInlineListsAndPrinciples(text) {
  if (!text) return '';

  const codeBlocks = [];
  let tempText = text.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  tempText = tempText.replace(/__CODE_BLOCK_(\d+)__\s*\n*---\n*/g, '__CODE_BLOCK_$1__\n\n');

  return tempText.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => codeBlocks[Number(index)] || '');
}

async function run() {
  const formatted = formatInlineListsAndPrinciples(text);
  console.log("FORMATTED:\n", formatted);

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkBreaks)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(formatted);
    
  console.log("\nHTML:\n", String(file));
}

run();

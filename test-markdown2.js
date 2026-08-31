import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const text = `\`\`\`reasoning
The user is asking for news about Iran.
1. **شهر خبر** - General news portal
2. **ایران اینترنشنال** - News coverage
`;

function format(tempText) {
  // 1
  tempText = tempText.replace(/([:：]\s*)([۰-۹0-9]+[\.\-\)]\s+)/g, ':\n\n$2');

  // 2
  tempText = tempText.replace(/([.!؟:：\)]|\b[a-zA-Z\u0600-\u06FF]+)[ \t]+([۰-۹0-9]+[\.\-\)]\s+[\u0600-\u06FFa-zA-Z])/g, (match, p1, p2) => {
    if (['.', '!', '؟', ':', '：', ')'].includes(p1.slice(-1))) {
      return `${p1}\n\n${p2}`;
    }
    return match;
  });

  // 3
  const lines = tempText.split('\n');
  const formattedLines = lines.map((line) => {
    const matchCount = (line.match(/(?<=[^\s>][ \t]+)([۰-۹0-9]+[\.\-\)]\s+)/g) || []).length;
    if (matchCount >= 1) {
      return line.replace(/(?<=[^\s>][ \t]+)([۰-۹0-9]+[\.\-\)]\s+)/g, '\n\n$1');
    }
    return line;
  });
  tempText = formattedLines.join('\n');

  // 4
  tempText = tempText.replace(/<\/?\*?(div|span|html|body|main|center|web_search_results|instructions)[^>]*>/gi, '');

  // 5
  tempText = tempText.replace(/^[ \t]+$/gm, '');

  return tempText;
}

async function run() {
  const formatted = format(text);
  console.log("FORMATTED TEXT:");
  console.log(formatted);
  
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkBreaks)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(formatted);
    
  console.log("\nHTML:");
  console.log(String(file));
}

run();

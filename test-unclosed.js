import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const text1 = '```reasoning\nThe user is asking for news\n'; // unclosed
const text2 = '```reasoning\nThe user is asking for news\n```\n'; // closed

async function run() {
  console.log("UNCLOSED:");
  const file1 = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkBreaks)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(text1);
  console.log(String(file1));

  console.log("\nCLOSED:");
  const file2 = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkBreaks)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(text2);
  console.log(String(file2));
}

run();

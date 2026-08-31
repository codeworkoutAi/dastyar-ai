const text1 = '__CODE_BLOCK_0__\r\n  ---  \r\n# Header';
const text2 = '__CODE_BLOCK_0__\n***\n# Header';
const text3 = '__CODE_BLOCK_0__\n___\n# Header';

const regex = /__CODE_BLOCK_(\d+)__\s*[-*_]{3,}\s*/g;

console.log(text1.replace(regex, '__CODE_BLOCK_$1__\n\n'));
console.log(text2.replace(regex, '__CODE_BLOCK_$1__\n\n'));
console.log(text3.replace(regex, '__CODE_BLOCK_$1__\n\n'));

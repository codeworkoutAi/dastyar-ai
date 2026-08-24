const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/MessageInput.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The current wrapper looks like:
// <div className={`relative flex flex-col transition-all rounded-[32px] ${isStreaming ? 'gemini-animated-border' : 'bg-[var(--input-bg)] border border-[var(--border-subtle)] focus-within:border-[var(--border-strong)]'}`}>
//           {isStreaming && (
//             <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
//               <div className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_75%,#4285f4,#9b72cb,#d96570,transparent_100%)] animate-[spin_2s_linear_infinite]" />
//             </div>
//           )}
//           <div className={`relative flex flex-col w-full h-full rounded-[31px] ${isStreaming ? 'bg-[var(--input-bg)] m-[1px] h-[calc(100%-2px)] w-[calc(100%-2px)] z-10 overflow-hidden' : 'overflow-hidden'}`}>

// I need to replace it with:
// <div className={`gemini-input-wrapper ${isStreaming ? 'is-streaming' : ''}`}>
//   <div className="gemini-input-inner">

const regex = /<div className=\{\`relative flex flex-col transition-all rounded-\[32px\][^>]*>[\s\S]*?(<textarea)/;
const replacement = `<div className={\`gemini-input-wrapper \${isStreaming ? 'is-streaming' : ''}\`}>
          <div className="gemini-input-inner">
            $1`;

content = content.replace(regex, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');

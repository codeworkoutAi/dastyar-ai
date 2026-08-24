const fs = require('fs');
let js = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

js = js.replace(
  '<div className={`gemini-input-wrapper ${isStreaming ? \'is-streaming\' : \'\'}`}>\n          <div className="gemini-input-inner">',
  '<div className={`gemini-input-wrapper ${isStreaming ? \'is-streaming\' : \'\'}`}>\n          <div className="gemini-input-glow" />\n          <div className="gemini-input-inner">'
);

fs.writeFileSync('src/components/MessageInput.tsx', js);

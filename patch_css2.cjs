const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

css = css.replace(
  '.gemini-input-wrapper {\n  position: relative;\n  border-radius: 28px;\n  padding: 1.5px;\n  background: var(--border-subtle);',
  '.gemini-input-wrapper {\n  position: relative;\n  border-radius: 28px;\n  padding: 1.5px;\n  background: var(--border-subtle);\n  overflow: visible !important;'
);

css = css.replace(
  '.gemini-input-inner {\n  position: relative;\n  background-color: var(--input-bg);\n  border-radius: 26.5px;\n  z-index: 1;\n  width: 100%;\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n}',
  '.gemini-input-inner {\n  position: relative;\n  background-color: var(--input-bg);\n  border-radius: 26.5px;\n  z-index: 1;\n  width: 100%;\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  overflow: visible !important;\n}'
);

fs.writeFileSync('src/index.css', css);

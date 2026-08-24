const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

// Remove overflow: hidden from .gemini-input-wrapper
css = css.replace(
  '.gemini-input-wrapper {\n  position: relative;\n  border-radius: 28px;\n  padding: 1.5px;\n  overflow: hidden;\n  background: var(--border-subtle);',
  '.gemini-input-wrapper {\n  position: relative;\n  border-radius: 28px;\n  padding: 1.5px;\n  background: var(--border-subtle);'
);

// Add .gemini-input-glow
const glowCss = `
.gemini-input-glow {
  position: absolute;
  inset: 0;
  border-radius: 28px;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}
.gemini-input-glow::before {`;

css = css.replace('.gemini-input-wrapper::before {', glowCss);

// Replace state selectors
css = css.replace('.gemini-input-wrapper:hover::before', '.gemini-input-wrapper:hover .gemini-input-glow::before');
css = css.replace('.gemini-input-wrapper:focus-within::before', '.gemini-input-wrapper:focus-within .gemini-input-glow::before');
css = css.replace('.gemini-input-wrapper.is-streaming::before', '.gemini-input-wrapper.is-streaming .gemini-input-glow::before');

// Remove overflow from .gemini-input-inner
css = css.replace(
  '.gemini-input-inner {\n  position: relative;\n  background-color: var(--input-bg);\n  border-radius: 26.5px;\n  z-index: 1;\n  width: 100%;\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}',
  '.gemini-input-inner {\n  position: relative;\n  background-color: var(--input-bg);\n  border-radius: 26.5px;\n  z-index: 1;\n  width: 100%;\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n}'
);

fs.writeFileSync('src/index.css', css);

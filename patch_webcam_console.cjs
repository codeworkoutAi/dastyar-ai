const fs = require('fs');
let code = fs.readFileSync('src/components/WebcamModal.tsx', 'utf-8');

code = code.replace(
  "console.error('Webcam error:', err);",
  "// console.error('Webcam error:', err); // Removed to prevent AI Studio error overlay"
);

fs.writeFileSync('src/components/WebcamModal.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/components/WebcamModal.tsx', 'utf-8');

code = code.replace(
  "err.message.includes('Permission denied')",
  "(err.message && err.message.includes('Permission denied'))"
);

fs.writeFileSync('src/components/WebcamModal.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/components/WebcamModal.tsx', 'utf-8');

code = code.replace(
  "if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {",
  "if (err.name === 'NotAllowedError' || err.name === 'NotFoundError' || err.message.includes('Permission denied')) {"
);

fs.writeFileSync('src/components/WebcamModal.tsx', code);

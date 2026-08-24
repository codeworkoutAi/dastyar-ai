const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

code = code.replace(
  'accept="image/*,.txt,.pdf,.doc,.docx,.js,.ts,.json,.csv,.md"',
  'accept="*/*"'
);

fs.writeFileSync('src/components/MessageInput.tsx', code);

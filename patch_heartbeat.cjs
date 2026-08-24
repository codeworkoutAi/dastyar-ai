const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  "}, 10000);",
  "}, 5000);"
);

fs.writeFileSync('server.ts', code);

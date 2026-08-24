const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  `  req.on('close', () => {
    clearInterval(heartbeatInterval);
  });`,
  `  req.on('close', () => {
    clearInterval(heartbeatInterval);
  });
  res.on('finish', () => {
    clearInterval(heartbeatInterval);
  });
  res.on('error', () => {
    clearInterval(heartbeatInterval);
  });`
);

fs.writeFileSync('server.ts', code);

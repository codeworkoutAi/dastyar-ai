const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  `  // Keep-alive heartbeat to prevent proxy timeouts during long generation times
  res.write(':\\n\\n');
  const heartbeatInterval = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(':\\n\\n');`,
  `  // Keep-alive heartbeat to prevent proxy timeouts during long generation times
  res.write('data: {"chunk":""}\\n\\n');
  const heartbeatInterval = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write('data: {"chunk":""}\\n\\n');`
);

fs.writeFileSync('server.ts', code);

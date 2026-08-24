const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const pingStart = content.indexOf(`app.post(['/api/models/test', '/api/ping']`);
const pingEnd = content.indexOf(`});`, content.indexOf(`return res.status(502)`, pingStart) + 100);

// We'll replace the ping endpoint.
// Let's just create a new ping endpoint string.

const fs = require('fs');
const metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
if (!metadata.requestFramePermissions.includes('camera')) {
  metadata.requestFramePermissions.push('camera');
}
fs.writeFileSync('metadata.json', JSON.stringify(metadata, null, 2));

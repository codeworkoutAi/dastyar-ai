const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/components/MessageInput.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The file has a missing closing div for the new wrapper.
// So we just need to replace `</div>\n        {/* Footer info */}` with `</div>\n        </div>\n        {/* Footer info */}` but more robustly.

content = content.replace(/<\/div>\s*\{\/\* Footer info \*\/\}/g, '</div>\n        </div>\n        {/* Footer info */}');

fs.writeFileSync(filePath, content, 'utf8');

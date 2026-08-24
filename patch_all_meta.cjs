const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

// For images (via canvas)
code = code.replace(
  "setImagePreview(compressedDataUrl);\n            } else {\n              setImagePreview(dataUrl);\n            }",
  "setImagePreview(compressedDataUrl);\n              setAttachedFileMeta({ name: file.name, size: formatFileSize(file.size) });\n            } else {\n              setImagePreview(dataUrl);\n              setAttachedFileMeta({ name: file.name, size: formatFileSize(file.size) });\n            }"
);

// For text files (though they are not imagePreview, they are appended to text, so attachedFileMeta won't show. That's fine)

// For PDF
code = code.replace(
  "setImagePreview(dataUrl);\n          if (!text.trim()) {\n            setText(`فایل ضمیمه شده: ${file.name}\\nلطفاً محتوای این فایل را تحلیل کن.`);\n          }",
  "setImagePreview(dataUrl);\n          setAttachedFileMeta({ name: file.name, size: formatFileSize(file.size) });\n          if (!text.trim()) {\n            setText(`فایل ضمیمه شده: ${file.name}\\nلطفاً محتوای این فایل را تحلیل کن.`);\n          }"
);

// For generic unknown
code = code.replace(
  "setImagePreview(dataUrl);\n          if (!text.trim()) {\n            setText(`فایل ضمیمه شده: ${file.name}\\nلطفاً محتوای این سند را بررسی کن.`);\n          }",
  "setImagePreview(dataUrl);\n          setAttachedFileMeta({ name: file.name, size: formatFileSize(file.size) });\n          if (!text.trim()) {\n            setText(`فایل ضمیمه شده: ${file.name}\\nلطفاً محتوای این سند را بررسی کن.`);\n          }"
);

fs.writeFileSync('src/components/MessageInput.tsx', code);

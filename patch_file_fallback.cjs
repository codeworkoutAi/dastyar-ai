const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

code = code.replace(
  `    } else {
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreview(dataUrl);
          if (!text.trim()) {
            setText(\`این فایل را تحلیل کن: \${file.name}\`);
          }
        }
      };
      reader.readAsDataURL(file);
    }`,
  `    } else {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for unknown files
         alert('حجم فایل پشتیبانی نشده بسیار زیاد است (بیش از ۲ مگابایت).');
         e.target.value = '';
         return;
      }
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreview(dataUrl);
          if (!text.trim()) {
            setText(\`این فایل را تحلیل کن: \${file.name}\`);
          }
        }
      };
      reader.readAsDataURL(file);
    }`
);

fs.writeFileSync('src/components/MessageInput.tsx', code);

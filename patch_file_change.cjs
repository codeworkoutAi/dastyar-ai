const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

const oldElse = `    } else {
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
    }`;

const newElse = `    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for PDFs
         alert('حجم فایل PDF بسیار زیاد است (بیش از ۱۰ مگابایت).');
         e.target.value = '';
         return;
      }
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreview(dataUrl);
          if (!text.trim()) {
            setText(\`فایل ضمیمه شده: \${file.name}\\nلطفاً محتوای این فایل را تحلیل کن.\`);
          }
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for other unknown files
         alert('حجم فایل بسیار زیاد است (بیش از ۵ مگابایت).');
         e.target.value = '';
         return;
      }
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreview(dataUrl);
          if (!text.trim()) {
            setText(\`فایل ضمیمه شده: \${file.name}\\nلطفاً محتوای این سند را بررسی کن.\`);
          }
        }
      };
      reader.readAsDataURL(file);
    }`;

code = code.replace(oldElse, newElse);
fs.writeFileSync('src/components/MessageInput.tsx', code);

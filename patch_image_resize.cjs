const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

const oldImageRead = `
    if (file.type.startsWith('image/')) {
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreview(dataUrl);
          if (!text.trim()) {
            setText('این تصویر را تحلیل کن و جزئیات آن را توضیح بده.');
          }
        }
      };
      reader.readAsDataURL(file);
    }`;

const newImageRead = `
    if (file.type.startsWith('image/')) {
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          // Resize image using canvas to prevent localStorage quota exhaustion
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              setImagePreview(compressedDataUrl);
            } else {
              setImagePreview(dataUrl);
            }
            if (!text.trim()) {
              setText('این تصویر را تحلیل کن و جزئیات آن را توضیح بده.');
            }
          };
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    }`;

code = code.replace(oldImageRead, newImageRead);
fs.writeFileSync('src/components/MessageInput.tsx', code);

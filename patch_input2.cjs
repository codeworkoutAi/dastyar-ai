const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

code = code.replace(
  "import { ArrowUp, Square, Sparkles, CornerDownLeft, RotateCcw, Mic, MicOff, Paperclip, FileText, Plus, UploadCloud, Camera, HardDrive } from 'lucide-react';",
  "import { ArrowUp, Square, Sparkles, CornerDownLeft, RotateCcw, Mic, MicOff, Paperclip, FileText, Plus, UploadCloud, Camera, HardDrive, Music, Film } from 'lucide-react';"
);

const previewReplacement = `
            {imagePreview.startsWith('data:image/') ? (
               <img src={imagePreview} alt="Preview" className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl border border-white/20 shrink-0" />
            ) : imagePreview.startsWith('data:audio/') ? (
               <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-white/20 shrink-0 bg-yellow-500/10 flex items-center justify-center">
                 <Music className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
               </div>
            ) : imagePreview.startsWith('data:video/') ? (
               <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-white/20 shrink-0 bg-purple-500/10 flex items-center justify-center">
                 <Film className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
               </div>
            ) : (
               <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-white/20 shrink-0 bg-blue-500/10 flex items-center justify-center">
                 <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
               </div>
            )}
`;

code = code.replace(
  /{imagePreview\.startsWith\('data:image\/'\) \? \([\s\S]*?<\/div>[\s\n]*\)}/m,
  previewReplacement.trim()
);

const fileHandleLogic = `
    } else if (file.type.startsWith('audio/')) {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit for audio
         alert('حجم فایل صوتی بیش از حد مجاز است (حداکثر ۱۵ مگابایت).');
         e.target.value = '';
         return;
      }
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreview(dataUrl);
          if (!text.trim()) {
            setText(\`فایل صوتی ضمیمه شده: \${file.name}\\nلطفاً این فایل صوتی را بررسی کن.\`);
          }
        }
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      if (file.size > 25 * 1024 * 1024) { // 25MB limit for video
         alert('حجم فایل ویدیویی بیش از حد مجاز است (حداکثر ۲۵ مگابایت).');
         e.target.value = '';
         return;
      }
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreview(dataUrl);
          if (!text.trim()) {
            setText(\`فایل ویدیویی ضمیمه شده: \${file.name}\\nلطفاً این ویدیو را بررسی کن.\`);
          }
        }
      };
      reader.readAsDataURL(file);
`;

code = code.replace(
  "reader.readAsText(file);\n    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {",
  "reader.readAsText(file);\n" + fileHandleLogic + "    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {"
);

fs.writeFileSync('src/components/MessageInput.tsx', code);

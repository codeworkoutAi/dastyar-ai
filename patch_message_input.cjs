const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

// Add FileText import
code = code.replace(
  "import { ArrowUp, Square, Sparkles, CornerDownLeft, RotateCcw, Mic, MicOff, Paperclip } from 'lucide-react';",
  "import { ArrowUp, Square, Sparkles, CornerDownLeft, RotateCcw, Mic, MicOff, Paperclip, FileText } from 'lucide-react';"
);

// Update input accept
code = code.replace(
  '<input type="file" accept="image/*"',
  '<input type="file" accept="image/*, .pdf, .doc, .docx, .xls, .xlsx, .csv, .txt, .md, .json, .js, .ts, .py, .html, .css"'
);

// Update preview thumbnail logic
const oldPreview = `{imagePreview && (
          <div className="relative inline-flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 bg-[var(--card-bg)] backdrop-blur-md rounded-2xl border border-white/10 shadow-lg animate-fadeIn w-fit max-w-full">
            <img src={imagePreview} alt="Preview" className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl border border-white/20 shrink-0" />`;
const newPreview = `{imagePreview && (
          <div className="relative inline-flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 bg-[var(--card-bg)] backdrop-blur-md rounded-2xl border border-white/10 shadow-lg animate-fadeIn w-fit max-w-full">
            {imagePreview.startsWith('data:image/') ? (
               <img src={imagePreview} alt="Preview" className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl border border-white/20 shrink-0" />
            ) : (
               <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-white/20 shrink-0 bg-blue-500/10 flex items-center justify-center">
                 <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
               </div>
            )}`;
code = code.replace(oldPreview, newPreview);

fs.writeFileSync('src/components/MessageInput.tsx', code);

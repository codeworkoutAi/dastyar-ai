const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

code = code.replace(
  "const [imagePreview, setImagePreview] = useState<string | null>(null);",
  "const [imagePreview, setImagePreview] = useState<string | null>(null);\n  const [attachedFileMeta, setAttachedFileMeta] = useState<{name: string, size: string} | null>(null);"
);

// Clear meta when preview is cleared in handleSend
code = code.replace(
  "setImagePreview(null);\n    if (textareaRef.current) {",
  "setImagePreview(null);\n    setAttachedFileMeta(null);\n    if (textareaRef.current) {"
);

// Clear meta when clicking remove button
code = code.replace(
  "onClick={() => setImagePreview(null)}",
  "onClick={() => { setImagePreview(null); setAttachedFileMeta(null); }}"
);

// Helper for file size
const helpers = `
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
`;

code = code.replace(
  "const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {",
  helpers + "\n  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {"
);

// Set meta for audio
code = code.replace(
  "setImagePreview(dataUrl);\n          if (!text.trim()) {\n            setText(`فایل صوتی ضمیمه شده: ${file.name}\\nلطفاً این فایل صوتی را بررسی کن.`);\n          }",
  "setImagePreview(dataUrl);\n          setAttachedFileMeta({ name: file.name, size: formatFileSize(file.size) });\n          if (!text.trim()) {\n            setText(`فایل صوتی ضمیمه شده: ${file.name}\\nلطفاً این فایل صوتی را بررسی کن.`);\n          }"
);

// Set meta for video
code = code.replace(
  "setImagePreview(dataUrl);\n          if (!text.trim()) {\n            setText(`فایل ویدیویی ضمیمه شده: ${file.name}\\nلطفاً این ویدیو را بررسی کن.`);\n          }",
  "setImagePreview(dataUrl);\n          setAttachedFileMeta({ name: file.name, size: formatFileSize(file.size) });\n          if (!text.trim()) {\n            setText(`فایل ویدیویی ضمیمه شده: ${file.name}\\nلطفاً این ویدیو را بررسی کن.`);\n          }"
);

// Change rendering
const rendering = `
            <div className="flex flex-col text-xs text-inherit pr-1 min-w-0">
              <span className="font-bold text-[var(--accent-text)] truncate">
                 {attachedFileMeta?.name || (imagePreview.startsWith('data:image/') ? 'تصویر ضمیمه شده' : 
                  imagePreview.startsWith('data:audio/') ? 'فایل صوتی ضمیمه شده' : 
                  imagePreview.startsWith('data:video/') ? 'فایل ویدیویی ضمیمه شده' : 'فایل ضمیمه شده')}
              </span>
              <span className="text-[10px] sm:text-[11px] opacity-70 truncate">
                 {attachedFileMeta ? \`حجم: \${attachedFileMeta.size} - آماده تحلیل\` : 'آماده برای ارسال و تحلیل هوش مصنوعی'}
              </span>
            </div>
`;

code = code.replace(
  /<div className="flex flex-col text-xs text-inherit pr-1 min-w-0">[\s\S]*?<\/div>/m,
  rendering.trim()
);

fs.writeFileSync('src/components/MessageInput.tsx', code);

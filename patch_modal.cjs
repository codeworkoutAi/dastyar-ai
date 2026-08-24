const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const importLogic = `
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          onImportConversations(parsed);
          setImportStatus({ success: true, message: 'اطلاعات با موفقیت بازیابی شد.' });
        } else {
          setImportStatus({ success: false, message: 'فایل نامعتبر است (باید آرایه باشد).' });
        }
      } catch (err) {
        setImportStatus({ success: false, message: 'خطا در خواندن فایل JSON.' });
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
`;

code = code.replace(
  "const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);",
  "const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);" + importLogic
);

const importButtonUI = `
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex-1 p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center gap-3 transition-colors">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Download className="w-5 h-5" /></div>
                      <div className="text-right">
                        <div className="font-medium text-sm">دریافت نسخه پشتیبان (Export)</div>
                        <div className="text-xs text-zinc-400">دانلود تمام گفتگوها و تنظیمات</div>
                      </div>
                    </button>
                    
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center gap-3 transition-colors relative overflow-hidden">
                      <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef} 
                        onChange={handleFileImport} 
                        className="hidden" 
                      />
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Upload className="w-5 h-5" /></div>
                      <div className="text-right">
                        <div className="font-medium text-sm">بازیابی نسخه پشتیبان (Import)</div>
                        <div className="text-xs text-zinc-400">فایل JSON پشتیبان خود را انتخاب کنید</div>
                      </div>
                    </button>
                  </div>
                  {importStatus && (
                    <div className={\`p-3 rounded-xl text-sm font-medium \${importStatus.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}\`}>
                      {importStatus.message}
                    </div>
                  )}
`;

code = code.replace(
  /<div className="flex flex-col sm:flex-row gap-3">\s*<button className="flex-1 p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center gap-3 transition-colors">\s*<div className="p-2 bg-emerald-500\/10 text-emerald-400 rounded-lg"><Download className="w-5 h-5" \/><\/div>\s*<div className="text-right">\s*<div className="font-medium text-sm">دریافت نسخه پشتیبان \(Export\)<\/div>\s*<div className="text-xs text-zinc-400">دانلود تمام گفتگوها و تنظیمات<\/div>\s*<\/div>\s*<\/button>\s*<\/div>/g,
  importButtonUI
);

fs.writeFileSync('src/components/SettingsModal.tsx', code);

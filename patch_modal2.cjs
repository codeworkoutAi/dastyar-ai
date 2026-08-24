const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

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

const startIndex = code.indexOf('<div className="flex flex-col sm:flex-row gap-3">');
const endIndex = code.indexOf('</button>\n                  </div>', startIndex) + '</button>\n                  </div>'.length;

if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + importButtonUI + code.substring(endIndex);
    fs.writeFileSync('src/components/SettingsModal.tsx', code);
    console.log("Success");
} else {
    console.log("Could not find the block");
}

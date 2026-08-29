const fs = require('fs');
let content = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

content = content.replace(
  `const [isRecording, setIsRecording] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(defaultWebSearch);`,
  `const [isRecording, setIsRecording] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(defaultWebSearch);
  const [showImageEngineModal, setShowImageEngineModal] = useState(false);
  const [pendingImagePrompt, setPendingImagePrompt] = useState('');`
);

content = content.replace(
  `    let finalMessage = text.trim() || 'لطفاً فایل‌های پیوست شده را بررسی کن.';
    
    // Inject any extracted text from hybrid PDF parsing as hidden fileContext`,
  `    let finalMessage = text.trim() || 'لطفاً فایل‌های پیوست شده را بررسی کن.';
    
    if (finalMessage.startsWith('/image ') || finalMessage.startsWith('/تصویر ')) {
      setPendingImagePrompt(finalMessage);
      setShowImageEngineModal(true);
      return;
    }

    // Inject any extracted text from hybrid PDF parsing as hidden fileContext`
);

content = content.replace(
  `    { cmd: '/تصویر', text: '/image ' }
  ];`,
  `    { cmd: '/تصویر', text: '/image ' }
  ];

  const confirmImageGen = (engine: string) => {
    setShowImageEngineModal(false);
    sendMessage(pendingImagePrompt, undefined, undefined, undefined, engine);
    setText('');
    setPendingImagePrompt('');
  };`
);

const modalStr = `
      {showImageEngineModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowImageEngineModal(false)}>
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 relative" onClick={e => e.stopPropagation()} dir="rtl">
            <button onClick={() => setShowImageEngineModal(false)} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
              <X size={20} />
            </button>
            
            <h3 className="text-white text-lg font-bold pr-2">انتخاب هوش مصنوعی تصویرساز</h3>
            <p className="text-gray-400 text-sm pr-2 -mt-2">برای تولید این تصویر از کدام موتور استفاده شود؟</p>
            
            <div className="flex flex-col gap-2 mt-2">
              <button 
                onClick={() => confirmImageGen('flux')}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all text-right group"
              >
                <div>
                  <div className="text-white font-medium flex items-center gap-2">Flux.1 Realism <StarsMinimalisticBoldIcon className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" size={16} /></div>
                  <div className="text-xs text-gray-400 mt-1">رایگان و سریع - کیفیت عالی</div>
                </div>
                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20">رایگان</span>
              </button>

              <button 
                onClick={() => confirmImageGen('dalle-3')}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 transition-all text-right group"
              >
                <div>
                  <div className="text-white font-medium flex items-center gap-2">DALL-E 3 <StarsMinimalisticBoldIcon className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" size={16} /></div>
                  <div className="text-xs text-gray-400 mt-1">هوش بالا - نیازمند API OpenAI</div>
                </div>
                <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">وی‌آی‌پی</span>
              </button>

              <button 
                onClick={() => confirmImageGen('imagen-3')}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all text-right group"
              >
                <div>
                  <div className="text-white font-medium flex items-center gap-2">Imagen 3 (Gemini) <StarsMinimalisticBoldIcon className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" size={16} /></div>
                  <div className="text-xs text-gray-400 mt-1">کیفیت استودیو گوگل - نیازمند API Gemini</div>
                </div>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20">رسمی گوگل</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});`;

content = content.replace(`    </div>\n  );\n});`, modalStr);

fs.writeFileSync('src/components/MessageInput.tsx', content, 'utf-8');

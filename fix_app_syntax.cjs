const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ Auto-switch model to Gemini when video is attached[\s\S]*?handleVideoAttached = \(\) => \{[\s\S]*?\};\s*$/m;
// wait, let's just use string replace.
content = content.replace(/  const handleVideoAttached = \(\) => \{[\s\S]*?  \};\n/g, 
`  const handleVideoAttached = () => {
    if (settings.providers.activeProvider !== 'gemini') {
      setSettings((prev) => ({
        ...prev,
        providers: {
          ...prev.providers,
          activeProvider: 'gemini',
          gemini: {
            ...prev.providers.gemini,
            modelName: 'gemini-2.5-flash'
          }
        }
      }));
      setVideoNotice('مدل به صورت خودکار برای پردازش ویدیو روی Gemini تنظیم شد.');
      setTimeout(() => {
        setVideoNotice(null);
      }, 5000);
    }
  };
`);

// Also fix: `const initialConv = createNewConversation((settings.providers[settings.providers.activeProvider]?.modelName));`
// And `if (false)` if it exists.
content = content.replace(/if \(false\) \{/g, `if (settings.providers.activeProvider !== 'gemini') {`);

// Let's remove the broken comment block
content = content.replace(/\/\/setApiConfig\(\(prev\) => \(\{\n\s*\.\.\.prev,\n\s*activeProvider: "openai",\n\s*modelName: 'gemini-2\.5-flash',\n\s*\}\)\);/g, '');


fs.writeFileSync('src/App.tsx', content);

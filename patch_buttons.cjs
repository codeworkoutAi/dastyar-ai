const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

// 1. Sparkles button
code = code.replace(
  "text.startsWith('/image ')\n                        ? 'bg-gradient-to-tr from-[#4285f4] via-[#9b72cb] to-[#d96570] text-white shadow-md shadow-purple-500/25 scale-105 opacity-90'\n                        : 'text-[#9b72cb]/50 dark:text-[#c4a1eb]/50 hover:text-[#9b72cb] dark:hover:text-[#c4a1eb] hover:bg-[#9b72cb]/10 active:scale-95'",
  "text.startsWith('/image ')\n                        ? 'text-[#9b72cb] dark:text-[#c4a1eb] scale-105 opacity-100 bg-transparent'\n                        : 'text-[#9b72cb]/50 dark:text-[#c4a1eb]/50 hover:text-[#9b72cb] dark:hover:text-[#c4a1eb] bg-transparent active:scale-95'"
);

// 2. Plus button
code = code.replace(
  "isAttachmentMenuOpen \n                          ? 'bg-[#1a73e8]/10 text-[#1a73e8] dark:bg-[#8ab4f8]/10 dark:text-[#8ab4f8] border-[#1a73e8]/20 dark:border-[#8ab4f8]/20 scale-105' \n                          : 'text-[#34a853]/50 dark:text-[#4ade80]/50 hover:text-[#34a853] dark:hover:text-[#4ade80] hover:bg-[#34a853]/10 active:scale-95'",
  "isAttachmentMenuOpen \n                          ? 'text-[#1a73e8] dark:text-[#8ab4f8] scale-105 bg-transparent' \n                          : 'text-[#34a853]/50 dark:text-[#4ade80]/50 hover:text-[#34a853] dark:hover:text-[#4ade80] bg-transparent active:scale-95'"
);
// Also remove border-transparent from the toggle button base classes
code = code.replace(
  "className={`w-11 h-11 flex items-center justify-center rounded-full transition-all cursor-pointer border border-transparent ${",
  "className={`w-11 h-11 flex items-center justify-center rounded-full transition-all cursor-pointer ${"
);

// 3. Mic button
code = code.replace(
  "isRecording\n                        ? 'bg-[#ea4335] text-white animate-pulse shadow-[0_0_12px_rgba(234,67,53,0.8)]'\n                        : 'text-[#ea8600]/50 dark:text-[#fbbc04]/50 hover:text-[#ea8600] dark:hover:text-[#fbbc04] hover:bg-[#fbbc04]/10'",
  "isRecording\n                        ? 'text-[#ea4335] animate-pulse bg-transparent'\n                        : 'text-[#ea8600]/50 dark:text-[#fbbc04]/50 hover:text-[#ea8600] dark:hover:text-[#fbbc04] bg-transparent active:scale-95'"
);

// 4. Square button
code = code.replace(
  "className=\"w-11 h-11 flex items-center justify-center transition-all rounded-full bg-[#ea4335]/15 hover:bg-[#ea4335]/25 text-[#ea4335]/70 hover:text-[#ea4335] dark:text-red-400/70 border border-[#ea4335]/30 animate-pulse cursor-pointer shadow-sm\"",
  "className=\"w-11 h-11 flex items-center justify-center transition-all rounded-full text-[#ea4335]/70 hover:text-[#ea4335] dark:text-red-400/70 dark:hover:text-red-400 bg-transparent animate-pulse cursor-pointer\""
);

// 5. RotateCcw button
code = code.replace(
  "className=\"w-11 h-11 flex items-center justify-center rounded-full text-slate-400/50 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95\"",
  "className=\"w-11 h-11 flex items-center justify-center rounded-full text-slate-400/50 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent transition-all active:scale-95\""
);

// 6. ArrowUp button
code = code.replace(
  "className={`w-11 h-11 flex items-center justify-center transition-all rounded-full bg-black/5 dark:bg-white/[0.08] ${\n                        text.trim()\n                          ? 'text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-black/10 dark:hover:bg-white/[0.14] cursor-pointer active:scale-95'\n                          : 'text-slate-400/50 dark:text-slate-500/50 cursor-not-allowed'\n                      }`}",
  "className={`w-11 h-11 flex items-center justify-center transition-all rounded-full bg-transparent ${\n                        text.trim()\n                          ? 'text-[#1a73e8] dark:text-[#8ab4f8] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer active:scale-95'\n                          : 'text-slate-400/50 dark:text-slate-500/50 cursor-not-allowed'\n                      }`}"
);

fs.writeFileSync('src/components/MessageInput.tsx', code);

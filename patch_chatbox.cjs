const fs = require('fs');
let code = fs.readFileSync('src/components/ChatBox.tsx', 'utf-8');

const originalBlock = `
                            {msg.imageUrl.startsWith('data:image/') ? (
                              <img src={msg.imageUrl} alt="Attached" className="w-full object-cover max-h-72" />
                            ) : (
                              <div className="flex items-center gap-3 p-4 bg-[var(--card-bg)]">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                                  <FileText className="w-8 h-8" />
                                </div>
                                <div className="flex flex-col text-sm min-w-0">
                                  <span className="font-bold truncate">سند ضمیمه شده</span>
                                  <span className="text-xs opacity-70 truncate">آماده تحلیل توسط هوش مصنوعی</span>
                                </div>
                              </div>
                            )}
`.trim();

const newBlock = `
                            {msg.imageUrl.startsWith('data:image/') ? (
                              <img src={msg.imageUrl} alt="Attached" className="w-full object-cover max-h-72" />
                            ) : msg.imageUrl.startsWith('data:audio/') ? (
                              <div className="p-4 bg-[var(--card-bg)] w-full flex flex-col gap-2">
                                <span className="text-sm font-bold text-[var(--text-main)] px-1">فایل صوتی ضمیمه شده</span>
                                <audio controls src={msg.imageUrl} className="w-full max-w-sm rounded-lg" dir="ltr" />
                              </div>
                            ) : msg.imageUrl.startsWith('data:video/') ? (
                              <video controls src={msg.imageUrl} className="w-full object-cover max-h-72 bg-black" dir="ltr" />
                            ) : (
                              <div className="flex items-center gap-3 p-4 bg-[var(--card-bg)]">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                                  <FileText className="w-8 h-8" />
                                </div>
                                <div className="flex flex-col text-sm min-w-0">
                                  <span className="font-bold truncate">سند ضمیمه شده</span>
                                  <span className="text-xs opacity-70 truncate">آماده تحلیل توسط هوش مصنوعی</span>
                                </div>
                              </div>
                            )}
`.trim();

code = code.replace(originalBlock, newBlock);

fs.writeFileSync('src/components/ChatBox.tsx', code);

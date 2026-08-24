const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/SettingsModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startStr = '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">';
const endStr = '</div>\n              </div>\n\n              {/* Font Size */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = `<div className="flex flex-col gap-2.5">
                  {PERSIAN_FONTS.map((font) => {
                    const isSelected = (tempSettings.fontFamily || 'vazir') === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setTempSettings({ ...tempSettings, fontFamily: font.id })}
                        className={\`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer \${
                          isSelected
                            ? 'bg-[var(--card-bg)] border-[var(--text-main)] shadow-sm'
                            : 'bg-[var(--input-bg)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] opacity-85 hover:opacity-100'
                        }\`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 text-right">
                          <div className={\`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border transition-colors \${
                            isSelected 
                              ? 'border-[var(--text-main)] bg-[var(--text-main)]' 
                              : 'border-[var(--text-dim)]'
                          }\`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--bg-main)]" />}
                          </div>
                          
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-sm sm:text-base text-inherit" style={{ fontFamily: font.cssFamily }}>
                                {font.name}
                              </span>
                              <span className="text-[10px] opacity-70 font-sans font-normal px-2 py-0.5 rounded-full bg-[var(--border-subtle)]">
                                {font.tag}
                              </span>
                            </div>
                            <span className="text-[11px] sm:text-xs opacity-70 font-sans">
                              {font.description}
                            </span>
                          </div>
                        </div>

                        {/* Tiny preview for desktop */}
                        <div 
                          className="hidden md:flex text-sm sm:text-base opacity-50 ml-2 select-none" 
                          style={{ fontFamily: font.cssFamily }}
                        >
                          دستیار هوشمند و خلاق
                        </div>
                      </button>
                    );
                  })}
                `;
  
  content = content.substring(0, startIndex) + newContent + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fonts section updated.');
} else {
  console.log('Could not find start/end markers.');
}

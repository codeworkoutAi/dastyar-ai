const fs = require('fs');
let code = fs.readFileSync('src/components/MessageInput.tsx', 'utf-8');

// 1. Add createPortal import
if (!code.includes('createPortal')) {
  code = code.replace(
    "import React, { useState, useRef, useEffect } from 'react';",
    "import React, { useState, useRef, useEffect } from 'react';\nimport { createPortal } from 'react-dom';"
  );
}

// 2. Add state and ref for the portal
if (!code.includes('toggleBtnRef')) {
  code = code.replace(
    '  const menuRef = useRef<HTMLDivElement>(null);',
    '  const menuRef = useRef<HTMLDivElement>(null);\n  const toggleBtnRef = useRef<HTMLButtonElement>(null);\n  const [menuCoords, setMenuCoords] = useState({ bottom: 0, right: 0 });\n\n  const handleMenuToggle = (e: React.MouseEvent<HTMLButtonElement>) => {\n    if (!isAttachmentMenuOpen) {\n      const rect = e.currentTarget.getBoundingClientRect();\n      setMenuCoords({\n        bottom: window.innerHeight - rect.top + 8,\n        right: window.innerWidth - rect.right,\n      });\n      setIsAttachmentMenuOpen(true);\n    } else {\n      setIsAttachmentMenuOpen(false);\n    }\n  };'
  );
}

// 3. Update click outside logic
code = code.replace(
  '      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {\n        setIsAttachmentMenuOpen(false);\n      }',
  '      if (\n        menuRef.current && !menuRef.current.contains(event.target as Node) &&\n        (!toggleBtnRef.current || !toggleBtnRef.current.contains(event.target as Node))\n      ) {\n        setIsAttachmentMenuOpen(false);\n      }'
);

// 4. Update the popup render to use createPortal
const oldPopupStart = `{isAttachmentMenuOpen && (
                    <div className="absolute bottom-full left-0 sm:left-auto sm:right-0 mb-3 w-56 bg-white dark:bg-[#1e1e1f] border border-black/5 dark:border-white/10 rounded-2xl shadow-xl p-2 flex flex-col gap-1 origin-bottom-right animate-fadeIn z-50">`;

const newPopupStart = `{isAttachmentMenuOpen && createPortal(
                    <div 
                      ref={menuRef}
                      style={{ position: 'fixed', bottom: menuCoords.bottom, right: menuCoords.right, zIndex: 999999 }}
                      className="w-56 bg-white dark:bg-[#1e1e1f] border border-black/5 dark:border-white/10 rounded-2xl shadow-xl p-2 flex flex-col gap-1 origin-bottom-right animate-fadeIn"
                    >`;

code = code.replace(oldPopupStart, newPopupStart);

const oldPopupEnd = `                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">گوگل درایو</span>
                      </button>
                    </div>
                  )}`;

const newPopupEnd = `                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">گوگل درایو</span>
                      </button>
                    </div>,
                    document.body
                  )}`;
                  
code = code.replace(oldPopupEnd, newPopupEnd);

// 5. Update the toggle button to use toggleBtnRef and handleMenuToggle
// We must find the button inside the modern attachment menu.
code = code.replace(
  '<div className="relative" ref={menuRef}>',
  '<div className="relative">'
);

code = code.replace(
  'onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}',
  'ref={toggleBtnRef}\n                      onClick={handleMenuToggle}'
);

fs.writeFileSync('src/components/MessageInput.tsx', code);

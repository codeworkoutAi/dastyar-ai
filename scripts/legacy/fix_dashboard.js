const fs = require('fs');
const path = require('path');
const file = path.join('c:', 'Users', 'farha', 'Fa-Chatbox', 'src', 'pages', 'store', 'UserDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = "{selectedInvoice.licenseKey && selectedInvoice.paymentStatus === 'success' && (\n                  <div className=\"flex flex-col gap-2 p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 mt-4\">\n                    <span className=\"text-xs font-bold text-blue-600 dark:text-cyan-400\">?? ?????? ??????? ???:</span>\n                    <span className=\"font-mono text-center tracking-widest text-base font-bold text-blue-600 dark:text-cyan-400 clay-inset-thick py-2.5 rounded-xl select-all\" dir=\"ltr\">{selectedInvoice.licenseKey}</span>\n                  </div>\n                )}";

// Replace carefully using regex to ignore line endings
const regex = /\{selectedInvoice\.licenseKey && selectedInvoice\.paymentStatus === 'success' && \([\s\S]*?<div className="flex flex-col gap-2 p-3 bg-blue-500\/10 rounded-2xl border border-blue-500\/20 mt-4">[\s\S]*?<span className="text-xs font-bold text-blue-600 dark:text-cyan-400">?? ?????? ??????? ???:<\/span>[\s\S]*?<span className="font-mono text-center tracking-widest text-base font-bold text-blue-600 dark:text-cyan-400 clay-inset-thick py-2.5 rounded-xl select-all" dir="ltr">\{selectedInvoice\.licenseKey\}<\/span>[\s\S]*?<\/div>[\s\S]*?\)\}/m;

const replacement = {selectedInvoice.licenseKey && selectedInvoice.paymentStatus === 'success' && (
                  <div className="flex flex-col gap-2 p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 mt-4">
                    <span className="text-xs font-bold text-blue-600 dark:text-cyan-400">
                      {selectedInvoice.licenseKey.startsWith('http') ? '???? ????????? ??????? ???:' : '?? ?????? ??????? ???:'}
                    </span>
                    {selectedInvoice.licenseKey.startsWith('http') ? (
                      <a 
                        href={selectedInvoice.licenseKey}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] sm:text-xs leading-relaxed break-all font-semibold text-blue-700 dark:text-cyan-300 hover:text-blue-800 dark:hover:text-cyan-200 hover:underline underline-offset-4 clay-inset-thick p-3 sm:px-4 sm:py-3 rounded-xl transition-all block" 
                        dir="ltr"
                      >
                        {selectedInvoice.licenseKey}
                      </a>
                    ) : (
                      <span className="font-mono text-center tracking-widest text-base font-bold text-blue-600 dark:text-cyan-400 clay-inset-thick py-2.5 rounded-xl select-all" dir="ltr">{selectedInvoice.licenseKey}</span>
                    )}
                  </div>
                )};

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully replaced!');
} else {
  console.log('Regex did not match.');
}

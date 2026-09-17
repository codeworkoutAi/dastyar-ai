import React, { useState, useEffect } from 'react';
import { 
 X, 
 Download, 
 FileText, 
 Code, 
 Printer, 
 Copy, 
 Check, 
 Layers
} from 'lucide-react';

import { 
 exportConversationToMarkdown, 
 exportConversationToText, 
 exportToJson, 
 printOrSavePdfTranscript 
} from '../lib/exportUtils';
import { formatPersianDateTime } from '../lib/persianUtils';
import { Tooltip } from './Tooltip';
import { useUIStore } from '../store/uiStore';
import { useChatStore } from '../store/chatStore';




export const ExportModal: React.FC = () => {
 const { isExportOpen: isOpen, setIsExportOpen } = useUIStore();
 const { conversations: allConversations, activeId } = useChatStore();
 const activeConversation = allConversations.find((c) => c.id === activeId) || null;
 const onClose = () => setIsExportOpen(false);

 const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
 const [selectedFormat, setSelectedFormat] = useState<'markdown' | 'json' | 'txt' | 'print'>('markdown');
 const [copied, setCopied] = useState(false);

 // Handle escape key to close modal
 useEffect(() => {
 if (!isOpen) return;
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 onClose();
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [isOpen, onClose]);

 if (!isOpen) return null;

 const targetConv = activeConversation || allConversations[0];

 const generatePreview = () => {
 if (!targetConv) return 'گفتگویی برای پیش‌نمایش یافت نشد.';

 if (selectedFormat === 'markdown') {
 let preview = `# ${targetConv.title}\n\n`;
 preview += `تاریخ: ${formatPersianDateTime(targetConv.createdAt, false)}\n\n`;
 targetConv.messages.slice(0, 4).forEach((m) => {
 const role = m.role === 'user' ? '👤 **کاربر**' : '🤖 **هوش مصنوعی**';
 preview += `${role}:\n${m.content}\n\n`;
 });
 if (targetConv.messages.length > 4) preview += `... و ${targetConv.messages.length - 4} پیام دیگر`;
 return preview;
 } else if (selectedFormat === 'json') {
 const sample = exportScope === 'current' ? targetConv : allConversations.slice(0, 2);
 return JSON.stringify(sample, null, 2).substring(0, 600) + '...';
 } else if (selectedFormat === 'txt') {
 let preview = `عنوان: ${targetConv.title}\n====================\n\n`;
 targetConv.messages.slice(0, 3).forEach((m) => {
 const role = m.role === 'user' ? '[کاربر]' : '[هوش مصنوعی]';
 preview += `${role}: ${m.content}\n\n`;
 });
 return preview;
 } else {
 return 'نسخه آماده چاپ با فونت فارسی وزیرمتن و قالب‌بندی استاندارد در پنجره جدید باز خواهد شد.';
 }
 };

 const handleExecuteExport = () => {
 if (exportScope === 'all' || selectedFormat === 'json') {
 if (selectedFormat === 'json') {
 exportToJson(exportScope === 'all' ? allConversations : (targetConv ? [targetConv] : []));
 } else if (targetConv) {
 if (selectedFormat === 'markdown') exportConversationToMarkdown(targetConv);
 if (selectedFormat === 'txt') exportConversationToText(targetConv);
 if (selectedFormat === 'print') printOrSavePdfTranscript(targetConv);
 }
 } else if (targetConv) {
 if (selectedFormat === 'markdown') exportConversationToMarkdown(targetConv);
 if (selectedFormat === 'txt') exportConversationToText(targetConv);
 if (selectedFormat === 'print') printOrSavePdfTranscript(targetConv);
 }
 onClose();
 };

 const handleCopyPreview = () => {
 const text = generatePreview();
 navigator.clipboard.writeText(text);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 return (
 <div 
 className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
 onClick={(e) => {
 if (e.target === e.currentTarget) onClose();
 }}
 >
 <div 
 id="export-modal"
 className="w-[95vw] md:w-full max-w-xl clay-card text-inherit rounded-[2rem] border border-subtle flex flex-col max-h-[90dvh] overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="p-4 sm:p-6 border-b border-subtle flex items-center justify-between clay-header shrink-0">
 <div className="flex items-center gap-3">
 <div className="p-2.5 sm:p-3 rounded-2xl clay-btn text-teal-600 dark:text-teal-400 shrink-0">
 <Download className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <h2 className="text-base sm:text-lg font-extrabold tracking-tight truncate">
 خروجی و ذخیره تاریخچه
 </h2>
 <p className="text-[11px] sm:text-xs opacity-70 truncate">
 ذخیره گفتگوها در قالب‌های Markdown، JSON، متن یا PDF
 </p>
 </div>
 </div>
 <Tooltip content="بستن پنجره">
 <button
 onClick={onClose}
 className="clay-btn p-2 sm:p-2.5 hover:opacity-90 rounded-xl sm:rounded-2xl shrink-0"
 aria-label="Close export modal"
 >
 <X className="w-5 h-5" />
 </button>
 </Tooltip>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
 {/* Scope Selector */}
 <div>
 <label className="block text-xs font-bold opacity-80 mb-2">
 دامنه خروجی:
 </label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
 <button
 type="button"
 onClick={() => setExportScope('current')}
 disabled={!activeConversation}
 className={`p-3 sm:p-3.5 rounded-2xl text-right transition-all flex items-center gap-3 ${
 exportScope === 'current'
 ? 'clay-btn font-bold text-teal-600 dark:text-teal-400 border border-teal-600 dark:border-teal-400/50 shadow-md'
 : 'clay-input-box text-inherit opacity-75 hover:opacity-100'
 } ${!activeConversation ? 'opacity-50 cursor-not-allowed' : ''}`}
 >
 <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
 <div className="overflow-hidden min-w-0">
 <div className="text-xs font-bold truncate">همین گفتگوی فعلی</div>
 <div className="text-[11px] opacity-70 truncate">
 {activeConversation?.title || 'انتخاب نشده'}
 </div>
 </div>
 </button>

 <button
 type="button"
 onClick={() => setExportScope('all')}
 className={`p-3 sm:p-3.5 rounded-2xl text-right transition-all flex items-center gap-3 ${
 exportScope === 'all'
 ? 'clay-btn font-bold text-teal-600 dark:text-teal-400 border border-teal-600 dark:border-teal-400/50 shadow-md'
 : 'clay-input-box text-inherit opacity-75 hover:opacity-100'
 }`}
 >
 <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
 <div>
 <div className="text-xs font-bold">تمام گفتگوها ({allConversations.length})</div>
 <div className="text-[11px] opacity-70">نسخه پشتیبان کامل</div>
 </div>
 </button>
 </div>
 </div>

 {/* Format Selector */}
 <div>
 <label className="block text-xs font-bold opacity-80 mb-2">
 فرمت فایل خروجی:
 </label>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
 {[
 { id: 'markdown', label: 'Markdown (.md)', icon: FileText, desc: 'قالب‌بندی شده' },
 { id: 'json', label: 'JSON (.json)', icon: Code, desc: 'ساختار داده' },
 { id: 'txt', label: 'Plain Text (.txt)', icon: FileText, desc: 'متن ساده' },
 { id: 'print', label: 'چاپ / PDF', icon: Printer, desc: 'قالب استاندارد' },
 ].map((f) => {
 const Icon = f.icon;
 const isSelected = selectedFormat === f.id;
 return (
 <button
 key={f.id}
 type="button"
 onClick={() => setSelectedFormat(f.id as any)}
 className={`p-2.5 sm:p-3.5 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-1 sm:gap-1.5 ${
 isSelected
 ? 'clay-btn font-bold text-teal-600 dark:text-teal-400 border border-teal-600 dark:border-teal-400/50 shadow-md'
 : 'clay-input-box text-inherit opacity-75 hover:opacity-100'
 }`}
 >
 <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
 <span className="text-xs font-bold">{f.label}</span>
 <span className="text-[10px] opacity-70">{f.desc}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Preview Box */}
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <label className="text-xs font-bold opacity-80">
 پیش‌نمایش محتوا:
 </label>
 <button
 type="button"
 onClick={handleCopyPreview}
 className="text-[11px] opacity-70 hover:opacity-100 flex items-center gap-1 transition-colors"
 >
 {copied ? (
 <>
 <Check className="w-3 h-3 text-emerald-400" />
 <span className="text-emerald-400 font-bold">کپی شد</span>
 </>
 ) : (
 <>
 <Copy className="w-3 h-3" />
 <span>کپی در کلیپ‌بورد</span>
 </>
 )}
 </button>
 </div>
 <pre
 className="p-3.5 sm:p-4 rounded-2xl clay-input-box border border-subtle text-xs font-mono max-h-36 overflow-y-auto leading-relaxed text-inherit select-text whitespace-pre-wrap"
 dir="auto"
 >
 {generatePreview()}
 </pre>
 </div>
 </div>

 {/* Footer */}
 <div className="p-3.5 sm:p-5 border-t border-subtle flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 clay-header shrink-0">
 <button
 type="button"
 onClick={onClose}
 className="clay-btn px-4 py-2.5 text-inherit hover:opacity-90 text-xs sm:text-sm font-semibold justify-center"
 >
 انصراف
 </button>
 <button
 type="button"
 id="execute-export-btn"
 onClick={handleExecuteExport}
 className="clay-btn-primary flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold"
 >
 {selectedFormat === 'print' ? <Printer className="w-4 h-4" /> : <Download className="w-4 h-4" />}
 <span>
 {selectedFormat === 'print' ? 'نمایش نسخه چاپ / PDF' : 'دانلود فایل خروجی'}
 </span>
 </button>
 </div>
 </div>
 </div>
 );
};

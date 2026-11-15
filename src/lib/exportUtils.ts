import { Conversation } from '../types';
import { formatPersianDateTime } from './persianUtils';
import { cleanSuggestionsFromText } from './suggestionParser';

export function exportToJson(conversations: Conversation[]): void {
  const dataStr = JSON.stringify(conversations, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `persian-ai-chat-history-${formatDateForFilename()}.json`);
}

export function exportConversationToMarkdown(conv: Conversation): void {
  let md = `# ${conv.title}\n\n`;
  md += `- **تاریخ شروع:** ${formatPersianDateTime(conv.createdAt, false)}\n`;
  md += `- **مدل استفاده شده:** ${conv.modelUsed || 'هوش مصنوعی'}\n`;
  md += `- **تعداد پیام‌ها:** ${conv.messages.length}\n\n`;
  md += `---\n\n`;

  conv.messages.forEach((msg) => {
    const roleName = msg.role === 'user' ? '👤 کاربر' : '🤖 دستیار هوش مصنوعی';
    const timeStr = formatPersianDateTime(msg.timestamp, false);
    md += `### ${roleName} (${timeStr})\n\n`;
    md += `${cleanSuggestionsFromText(msg.content)}\n\n`;
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const safeTitle = conv.title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'chat';
  downloadBlob(blob, `${safeTitle}-${formatDateForFilename()}.md`);
}

export function exportConversationToText(conv: Conversation): void {
  let txt = `عنوان گفتگو: ${conv.title}\n`;
  txt += `تاریخ: ${formatPersianDateTime(conv.createdAt, false)}\n`;
  txt += `==============================================\n\n`;

  conv.messages.forEach((msg) => {
    const role = msg.role === 'user' ? '[کاربر]' : '[هوش مصنوعی]';
    txt += `${role} (${formatPersianDateTime(msg.timestamp, false)}):\n`;
    txt += `${cleanSuggestionsFromText(msg.content)}\n\n----------------------------------------------\n\n`;
  });

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
  const safeTitle = conv.title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'chat';
  downloadBlob(blob, `${safeTitle}-${formatDateForFilename()}.txt`);
}

export function printOrSavePdfTranscript(conv: Conversation): void {
  const messagesHtml = conv.messages
    .map((msg) => {
      const isUser = msg.role === 'user';
      return `
        <div class="message ${isUser ? 'user' : 'assistant'}">
          <div class="header">
            <span class="role">${isUser ? 'کاربر' : 'دستیار هوش مصنوعی'}</span>
            <span class="time">${formatPersianDateTime(msg.timestamp, false)}</span>
          </div>
          <div class="content">${escapeHtml(cleanSuggestionsFromText(msg.content)).replace(/\n/g, '<br/>')}</div>
        </div>
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(conv.title)} - گزارش گفتگو</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');
    body {
      font-family: 'Vazirmatn', sans-serif;
      background: #fff;
      color: #111;
      padding: 40px;
      margin: 0;
      line-height: 1.8;
      direction: rtl;
    }
    .meta-box {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 { margin: 0 0 10px 0; color: #0f172a; font-size: 24px; }
    .meta { color: #64748b; font-size: 14px; }
    .message {
      margin-bottom: 24px;
      padding: 16px 20px;
      border-radius: 12px;
      page-break-inside: avoid;
    }
    .message.user {
      background-color: #f1f5f9;
      border-right: 4px solid #0284c7;
    }
    .message.assistant {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-right: 4px solid #0d9488;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .role { font-weight: 700; color: #334155; }
    .time { color: #94a3b8; }
    .content { white-space: pre-wrap; word-break: break-word; font-size: 15px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="meta-box">
    <h1>${escapeHtml(conv.title)}</h1>
    <div class="meta">
      <span>تاریخ: ${formatPersianDateTime(conv.createdAt, false)}</span> | 
      <span>تعداد پیام‌ها: ${conv.messages.length}</span>
    </div>
  </div>
  <div class="messages">
    ${messagesHtml}
  </div>
  <script>
    window.onload = function() {
      try { window.print(); } catch(e) {}
    }
  </script>
</body>
</html>`;

  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }
  } catch (e) {
    // Popup blocked
  }

  // Fallback to downloading standalone styled HTML file
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const safeTitle = conv.title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'chat-transcript';
  downloadBlob(blob, `${safeTitle}-print-${formatDateForFilename()}.html`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDateForFilename(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

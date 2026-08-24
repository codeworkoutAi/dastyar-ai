const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/ChatBox.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const emptyStateStart = '{/* Empty State */}';
const emptyStateEnd = '{/* Messages List */}';

const startIndex = content.indexOf(emptyStateStart);
const endIndex = content.indexOf(emptyStateEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const newEmptyState = `{/* Empty State */}
      {messages.length === 0 && (
        <div className="min-h-[75vh] flex flex-col items-center justify-center max-w-4xl mx-auto text-center px-4 py-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-inherit mb-12 tracking-tight" style={{ fontWeight: 400 }}>
            ایده‌های خود را با هوش مصنوعی بسازید
          </h1>
          
          {/* AI Studio Chips (Starter Prompts) */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-3xl">
            {PERSIAN_STARTER_PROMPTS.map((item) => (
              <button
                key={item.id}
                onClick={() => onSendMessage(item.prompt)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:bg-[var(--btn-hover)] transition-colors cursor-pointer text-sm font-medium shadow-sm"
              >
                <div className="text-[var(--text-dim)] flex items-center justify-center opacity-80">
                  {getStarterIcon(item.icon)}
                </div>
                <span className="text-inherit opacity-90 whitespace-nowrap">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      `;
  
  content = content.substring(0, startIndex) + newEmptyState + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Empty state replaced successfully.');
} else {
  console.log('Could not find empty state markers.');
}

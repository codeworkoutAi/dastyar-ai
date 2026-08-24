const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/ChatBox.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const emptyStateStart = '{/* Empty State */}';
const emptyStateEnd = '{/* Messages List */}';

const startIndex = content.indexOf(emptyStateStart);
const endIndex = content.indexOf(emptyStateEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const oldEmptyState = `{/* Empty State */}
      {messages.length === 0 && (
        <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4 py-8">
          <div className="w-16 h-16 rounded-3xl gemini-gradient-bg flex items-center justify-center text-white shadow-md mb-5">
            <Sparkles className="w-8 h-8 " />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-inherit mb-2 tracking-tight">
            دستیار هوشمند شما
          </h2>
          <p className="text-xs sm:text-sm opacity-80 mb-8 max-w-md leading-relaxed">
            پرسش‌های خود را مطرح کنید، کد بنویسید، متون فارسی را ویرایش کنید یا از پیشنهادات زیر شروع کنید.
          </p>
          {/* Starter Prompts Grid - Clay Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-right">
            {PERSIAN_STARTER_PROMPTS.map((item) => (
              <button
                key={item.id}
                onClick={() => onSendMessage(item.prompt)}
                className="clay-card group p-5 text-right flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-2xl gemini-gradient-text group-hover:scale-105 transition-transform">
                    {getStarterIcon(item.icon)}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-inherit group-hover:gemini-gradient-text">
                    {item.title}
                  </span>
                </div>
                <p className="text-[12px] opacity-80 group-hover:opacity-100 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      `;
  
  content = content.substring(0, startIndex) + oldEmptyState + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Reverted empty state.');
} else {
  console.log('Could not find empty state markers.');
}

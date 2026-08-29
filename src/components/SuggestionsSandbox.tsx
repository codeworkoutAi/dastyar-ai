import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { 
  Code2LinearIcon, 
  StarsMinimalisticBoldIcon, 
  DocumentTextLinearIcon,
  AltArrowDownLinearIcon
} from '@solar-icons/react';

export const SuggestionsSandbox: React.FC = () => {
  const { setSimulatedPrompt, setSidebarOpen } = useUIStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const cards = [
    {
      id: 'code',
      title: 'تحلیل کد',
      description: 'نوشتن بازی مار با پایتون',
      icon: <Code2LinearIcon className="w-5 h-5 text-emerald-500" />,
      color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50',
      prompt: 'یک بازی ساده مار (Snake) با زبان پایتون و کتابخانه pygame بنویس.'
    },
    {
      id: 'image',
      title: 'خلق تصویر',
      description: 'منظره فضایی با نئون',
      icon: <StarsMinimalisticBoldIcon className="w-5 h-5 text-purple-500" />,
      color: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/50',
      prompt: '/image یک منظره‌ی فضایی با ستاره‌های درخشان و سیاره‌های نئونی، کیفیت 8k، سینماتیک'
    },
    {
      id: 'text',
      title: 'تحلیل متن',
      description: 'خلاصه کردن متن‌های طولانی',
      icon: <DocumentTextLinearIcon className="w-5 h-5 text-blue-500" />,
      color: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/50',
      prompt: 'لطفاً مهم‌ترین نکات یک متن طولانی را چگونه باید استخراج کنم؟ یک مثال برایم بزن.'
    }
  ];

  return (
    <div className="flex flex-col mt-4 select-none">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 rounded-xl transition-colors w-full cursor-pointer"
      >
        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">بانک ایده‌های سریع</span>
        <AltArrowDownLinearIcon className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-2 px-1 mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => {
                setSimulatedPrompt(card.prompt);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`group relative p-2.5 rounded-xl cursor-pointer transition-all duration-200 
                bg-gradient-to-br ${card.color} border
                hover:-translate-y-0.5 hover:shadow-md
                backdrop-blur-sm overflow-hidden flex items-center gap-3`}
            >
              {/* Background glow effect on hover */}
              <div className="absolute inset-0 bg-white/40 dark:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="w-9 h-9 shrink-0 rounded-lg bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center relative z-10">
                {card.icon}
              </div>
              
              <div className="flex-1 relative z-10 min-w-0">
                <h3 className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100 mb-0.5">{card.title}</h3>
                <p className="text-[9px] text-zinc-600 dark:text-zinc-400 font-medium truncate">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

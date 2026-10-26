import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export interface ChatPromptCTAProps {
  prompt: string;
  label?: string;
  className?: string;
}

export const ChatPromptCTA: React.FC<ChatPromptCTAProps> = ({
  prompt,
  label = 'همین را از دستیار بپرس ←',
  className = ''
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/chat?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`clay-card p-4 sm:p-5 my-6 rounded-card border border-[var(--color-border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md group ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl clay-surface flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[var(--color-text-muted)] line-clamp-1 mb-0.5">
            پرامپت آماده برای گفتگو:
          </p>
          <p className="text-sm font-bold text-[var(--color-text-main)] line-clamp-2">
            «{prompt}»
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-btn clay-btn-primary text-xs sm:text-sm font-bold">
        <span>{label}</span>
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
      </div>
    </div>
  );
};

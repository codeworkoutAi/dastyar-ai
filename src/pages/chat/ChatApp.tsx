import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { ChatBox } from '../../components/ChatBox';
import { MessageInput } from '../../components/MessageInput';
import { ErrorCapsule } from '../../components/ErrorCapsule';
import { InfoCircleBoldIcon } from '@solar-icons/react';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';

export function ChatApp() {
  const { videoNotice, metricsNotice } = useUIStore();
  const { conversations, activeId } = useChatStore();

  const activeConversation = conversations.find(c => c.id === activeId);
  const isEmpty = !activeConversation || activeConversation.messages.length === 0;

  return (
    <div className="flex h-dvh overflow-hidden app-container">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-0">
        <Header />
        
        <main className={`flex-1 overflow-hidden flex flex-col relative h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] transition-all duration-500 ease-in-out ${isEmpty ? 'justify-center items-center' : ''}`}>
          <div className={`flex flex-col w-full transition-all duration-500 ease-in-out ${isEmpty ? 'opacity-0 h-0 flex-none overflow-hidden' : 'flex-1 opacity-100 overflow-hidden'}`}>
            <ChatBox />
          </div>
          
          <div className="flex-none w-full transition-all duration-500 ease-in-out">
            <MessageInput />
          </div>
          
          <ErrorCapsule />

          {/* Floating Action Notices */}
          {metricsNotice && (
            <div className="absolute bottom-28 right-4 md:right-8 bg-zinc-50 dark:bg-zinc-900/95 dark:bg-black/95 text-zinc-900 dark:text-zinc-100 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 dark:border-white/10 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-3 animate-slideUp z-50">
              <InfoCircleBoldIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-400" />
              <span className="text-sm font-bold">{metricsNotice}</span>
            </div>
          )}
          
          {videoNotice && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500/90 text-white px-4 py-2 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-2 animate-bounce z-50 text-sm font-bold">
              <InfoCircleBoldIcon className="w-5 h-5" />
              <span>{videoNotice}</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

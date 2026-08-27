import { useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatBox } from './components/ChatBox';
import { MessageInput } from './components/MessageInput';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { ImageGenStudio } from './components/ImageGenStudio';
import { UiGuideModal } from './components/UiGuideModal';
import { ErrorCapsule } from './components/ErrorCapsule';
import { ReloadPrompt } from './components/ReloadPrompt';
import { InfoCircleBoldDuotoneIcon } from '@solar-icons/react';
import { useUIStore } from './store/uiStore';
import { useSettingsStore } from './store/settingsStore';
import { useChatStore } from './store/chatStore';

export default function App() {
  const { videoNotice, metricsNotice } = useUIStore();
  const { settings, systemIsDark } = useSettingsStore();

  const isDarkMode = settings.appearance.theme === 'dark' || (settings.appearance.theme === 'system' && systemIsDark);
  const direction = settings.appearance.direction === 'auto' ? (settings.appearance.uiLanguage === 'fa' ? 'rtl' : 'ltr') : settings.appearance.direction;

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');

    root.style.setProperty('--font-primary', "'" + settings.appearance.font + "', sans-serif");
    root.style.fontSize = settings.appearance.fontSize + 'px';
    root.dir = direction;
  }, [isDarkMode, settings.appearance.font, settings.appearance.fontSize, direction]);

  return (
    <div className="flex h-dvh overflow-hidden app-container">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-0">
        <Header />
        
        <main className="flex-1 overflow-hidden flex flex-col relative h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)]">
          <ChatBox />
          <MessageInput />
          <ErrorCapsule />

          {/* Floating Action Notices */}
          {metricsNotice && (
            <div className="absolute bottom-28 right-4 md:right-8 bg-zinc-900/95 dark:bg-black/95 text-zinc-100 dark:text-zinc-300 border border-zinc-800 dark:border-white/10 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-3 animate-slideUp z-50">
              <InfoCircleBoldDuotoneIcon className="w-5 h-5 text-zinc-400" />
              <span className="text-sm font-bold">{metricsNotice}</span>
            </div>
          )}
          
          {videoNotice && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500/90 text-white px-4 py-2 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-2 animate-bounce z-50 text-sm font-bold">
              <InfoCircleBoldDuotoneIcon className="w-5 h-5" />
              <span>{videoNotice}</span>
            </div>
          )}
        </main>
      </div>

      <SettingsModal />
      <ExportModal />
      <ImageGenStudio />
      <UiGuideModal />
      <ReloadPrompt />
    </div>
  );
}

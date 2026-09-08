import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { ImageGenStudio } from './components/ImageGenStudio';
import { UiGuideModal } from './components/UiGuideModal';
import { ExploreHub } from './components/ExploreHub';
import { ReloadPrompt } from './components/ReloadPrompt';
import AuthModal from './components/AuthModal';
import { AdminModal } from './components/AdminModal';
import { AboutModal } from './components/AboutModal';
import { ContactModal } from './components/ContactModal';
import { useSettingsStore } from './store/settingsStore';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';

// Pages
import { ChatApp } from './pages/chat/ChatApp';
import { StoreFront } from './pages/store/StoreFront';
import { Blog } from './pages/blog/Blog';
import { TagArchive } from './pages/blog/TagArchive';

export default function App() {
  const { settings, systemIsDark } = useSettingsStore();
  const checkAuth = useAuthStore(state => state.checkAuth);
  const setAuthModalOpen = useAuthStore(state => state.setAuthModalOpen);
  const { isAdminOpen, setIsAdminOpen } = useUIStore();

  const isDarkMode = settings.appearance.theme === 'dark' || (settings.appearance.theme === 'system' && systemIsDark);
  const direction = settings.appearance.direction === 'auto' ? (settings.appearance.uiLanguage === 'fa' ? 'rtl' : 'ltr') : settings.appearance.direction;

  useEffect(() => {
    checkAuth();

    // Listen for custom event to open auth modal
    const handleOpenAuth = () => setAuthModalOpen(true);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    
    return () => {
      window.removeEventListener('open-auth-modal', handleOpenAuth);
    };
  }, [checkAuth, setAuthModalOpen]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');

    if (settings.appearance.font === 'hybrid') {
      root.style.setProperty('--font-primary', 'var(--font-ui)');
    } else {
      root.style.setProperty('--font-primary', "'" + settings.appearance.font + "', sans-serif");
    }
    root.setAttribute('data-font', settings.appearance.font);
    root.style.fontSize = settings.appearance.fontSize + 'px';
    root.dir = direction;
  }, [isDarkMode, settings.appearance.font, settings.appearance.fontSize, direction]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatApp />} />
        <Route path="/store" element={<StoreFront />} />
        <Route path="/store/:id" element={<StoreFront />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<Blog />} />
        <Route path="/blog/tag/:tagName" element={<TagArchive />} />
      </Routes>

      {/* Global Modals */}
      <ExploreHub />
      <SettingsModal />
      <ExportModal />
      <ImageGenStudio />
      <UiGuideModal />
      <AuthModal />
      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <AboutModal />
      <ContactModal />
      <ReloadPrompt />
    </BrowserRouter>
  );
}

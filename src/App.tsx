import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useSettingsStore } from './store/settingsStore';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';

// Critical Pages (loaded immediately)
import { ChatApp } from './pages/chat/ChatApp';

// Lazy-loaded Pages
const LandingPage = lazy(() => import('./pages/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const StoreFront = lazy(() => import('./pages/store/StoreFront').then(m => ({ default: m.StoreFront })));
const UserDashboard = lazy(() => import('./pages/store/UserDashboard').then(m => ({ default: m.UserDashboard })));
const Blog = lazy(() => import('./pages/blog/Blog').then(m => ({ default: m.Blog })));
const TagArchive = lazy(() => import('./pages/blog/TagArchive').then(m => ({ default: m.TagArchive })));

// Lazy-loaded Modals
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const ExportModal = lazy(() => import('./components/ExportModal').then(m => ({ default: m.ExportModal })));
const ImageGenStudio = lazy(() => import('./components/ImageGenStudio').then(m => ({ default: m.ImageGenStudio })));
const UiGuideModal = lazy(() => import('./components/UiGuideModal').then(m => ({ default: m.UiGuideModal })));
const ExploreHub = lazy(() => import('./components/ExploreHub').then(m => ({ default: m.ExploreHub })));
const ReloadPrompt = lazy(() => import('./components/ReloadPrompt').then(m => ({ default: m.ReloadPrompt })));
const AuthModal = lazy(() => import('./components/AuthModal'));
const AdminModal = lazy(() => import('./components/AdminModal').then(m => ({ default: m.AdminModal })));
const AboutModal = lazy(() => import('./components/AboutModal').then(m => ({ default: m.AboutModal })));
const ContactModal = lazy(() => import('./components/ContactModal').then(m => ({ default: m.ContactModal })));
const WalletModal = lazy(() => import('./components/WalletModal').then(m => ({ default: m.WalletModal })));


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
 const { settings, systemIsDark, syncSystemProfiles } = useSettingsStore();
 const checkAuth = useAuthStore(state => state.checkAuth);
 const setAuthModalOpen = useAuthStore(state => state.setAuthModalOpen);
 const { isAdminOpen, setIsAdminOpen, setIsWalletOpen } = useUIStore();

 const isDarkMode = settings.appearance.theme === 'dark' || (settings.appearance.theme === 'system' && systemIsDark);
 const direction = settings.appearance.direction === 'auto' ? (settings.appearance.uiLanguage === 'fa' ? 'rtl' : 'ltr') : settings.appearance.direction;

 useEffect(() => {
 checkAuth();
 syncSystemProfiles();

 // Listen for custom event to open auth modal
 const handleOpenAuth = () => setAuthModalOpen(true);
 const handleOpenWallet = () => setIsWalletOpen(true);
 window.addEventListener('open-auth-modal', handleOpenAuth);
 window.addEventListener('open-wallet-modal', handleOpenWallet);
 
 return () => {
 window.removeEventListener('open-auth-modal', handleOpenAuth);
 window.removeEventListener('open-wallet-modal', handleOpenWallet);
 };
 }, [checkAuth, setAuthModalOpen, setIsWalletOpen, syncSystemProfiles]);

 useEffect(() => {
 const root = document.documentElement;
 if (isDarkMode) root.classList.add('dark');
 else root.classList.remove('dark');

 if (settings.appearance.font === 'hybrid') {
 root.style.setProperty('--font-primary', 'var(--font-ui)');
 } else {
 root.style.setProperty('--font-primary',"'" + settings.appearance.font +"', sans-serif");
 }
 root.setAttribute('data-font', settings.appearance.font);
 root.style.fontSize = settings.appearance.fontSize + 'px';
 root.style.setProperty('--chat-font-size', settings.appearance.fontSize + 'px');
 root.dir = direction;
 }, [isDarkMode, settings.appearance.font, settings.appearance.fontSize, direction]);

 function HomeRoute() {
 const isAuthenticated = useAuthStore(state => state.isAuthenticated);
 return isAuthenticated ? <ChatApp /> : <LandingPage />;
 }

 return (
 <BrowserRouter>
      <ScrollToTop />
 <Suspense fallback={null}>
 <Routes>
 <Route path="/" element={<HomeRoute />} />
 <Route path="/landing" element={<LandingPage />} />
 <Route path="/chat" element={<ChatApp />} />
 <Route path="/store" element={<StoreFront />} />
 <Route path="/store/:id" element={<StoreFront />} />
 <Route path="/blog" element={<Blog />} />
 <Route path="/blog/:id" element={<Blog />} />
 <Route path="/blog/tag/:tagName" element={<TagArchive />} />
 <Route path="/dashboard" element={<UserDashboard />} />
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
 <WalletModal />
 <ReloadPrompt />
 </Suspense>
 </BrowserRouter>
 );
}

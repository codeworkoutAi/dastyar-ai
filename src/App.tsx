import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useSettingsStore } from './store/settingsStore';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { Capacitor } from '@capacitor/core';
import { isBazaarEnvironment, doSilentBazaarLogin } from './lib/bazaarUtils';
import { App as CapacitorApp } from '@capacitor/app';

// Lazy-loaded Pages
const LandingPage = lazy(() => import('./pages/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const StoreFront = lazy(() => import('./pages/store/StoreFront').then(m => ({ default: m.StoreFront })));
const ProductDetails = lazy(() => import('./pages/store/ProductDetails').then(m => ({ default: m.ProductDetails })));
const UserDashboard = lazy(() => import('./pages/store/UserDashboard').then(m => ({ default: m.UserDashboard })));
const Blog = lazy(() => import('./pages/blog/Blog').then(m => ({ default: m.Blog })));
const TagArchive = lazy(() => import('./pages/blog/TagArchive').then(m => ({ default: m.TagArchive })));
const AboutPage = lazy(() => import('./pages/about/AboutPage'));
const ContactPage = lazy(() => import('./pages/contact/ContactPage'));
const AiAssistantPage = lazy(() => import('./pages/ai-assistant/AiAssistantPage'));
const ChatLandingPage = lazy(() => import('./pages/chat/ChatLandingPage'));
const TarapolPage = lazy(() => import('./pages/tarapol/TarapolPage'));

// Lazy-loaded Modals and Widgets
const ShoppingAdvisorWidget = lazy(() => import('./components/store/ShoppingAdvisorWidget').then(m => ({ default: m.ShoppingAdvisorWidget })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const ReloadPrompt = lazy(() => import('./components/ReloadPrompt').then(m => ({ default: m.ReloadPrompt })));
const PWAInstallBanner = lazy(() => import('./components/PWAInstallBanner').then(m => ({ default: m.PWAInstallBanner })));
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
  const login = useAuthStore(state => state.login);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const setAuthModalOpen = useAuthStore(state => state.setAuthModalOpen);
  const isAuthModalOpen = useAuthStore(state => state.isAuthModalOpen);
  const {
    isSettingsOpen,
    isAdminOpen,
    isAboutOpen,
    isContactOpen,
    isWalletOpen,
    setIsAdminOpen,
    setIsWalletOpen
  } = useUIStore();

  const isDarkMode = settings.appearance.theme === 'dark' || (settings.appearance.theme === 'system' && systemIsDark);
  const direction = settings.appearance.direction === 'auto' ? (settings.appearance.uiLanguage === 'fa' ? 'rtl' : 'ltr') : settings.appearance.direction;

  useEffect(() => {
    checkAuth();
    syncSystemProfiles();

    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack || window.location.pathname === '/') {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });
    }

    // Check for promo code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const promoCode = urlParams.get('promo');
    if (promoCode) {
      localStorage.setItem('chatbox_promo', promoCode);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const resetToken = urlParams.get('reset_token');
    if (resetToken) {
      setAuthModalOpen(true);
    }

    const authToken = urlParams.get('auth_token');
    if (authToken) {
      localStorage.setItem('auth_token', authToken);
      checkAuth();
    }

    const paymentStatus = urlParams.get('payment');
    if (paymentStatus === 'success') {
      checkAuth();
      setTimeout(() => {
        const nextParams = new URLSearchParams(window.location.search);
        nextParams.delete('auth_token');
        const newQuery = nextParams.toString();
        const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '');
        window.history.replaceState({}, document.title, newUrl);
      }, 1500);
    }

    // Fetch public settings (ui_style theme) and apply to <html>
    fetch('/api/public-settings')
      .then(res => res.json())
      .then(data => {
        if (data.ui_style) {
          document.documentElement.setAttribute('data-ui-style', data.ui_style);
        }
      })
      .catch(() => {});

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
    if (isBazaarEnvironment() && !isAuthenticated) {
      doSilentBazaarLogin(login);
    }
  }, [isAuthenticated, login]);

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
    root.style.setProperty('--chat-font-size', settings.appearance.fontSize + 'px');
    root.dir = direction;
  }, [isDarkMode, settings.appearance.font, settings.appearance.fontSize, direction]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<StoreFront />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/chat" element={<ChatLandingPage />} />
          <Route path="/store" element={<StoreFront />} />
          <Route path="/store/category/:category" element={<StoreFront />} />
          <Route path="/store/product/:id" element={<ProductDetails />} />
          <Route path="/store/product/:id/:slug" element={<ProductDetails />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/news" element={<TagArchive forcedTag="news" />} />
          <Route path="/blog/:id" element={<Blog />} />
          <Route path="/blog/tag/:tagName" element={<TagArchive />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/ai-assistant" element={<AiAssistantPage />} />
          <Route path="/tarapol" element={<TarapolPage />} />
        </Routes>

        {/* Global Modals - Loaded on demand only when opened */}
        {isSettingsOpen && <SettingsModal />}
        {isAuthModalOpen && <AuthModal />}
        {isAdminOpen && <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />}
        {isAboutOpen && <AboutModal />}
        {isContactOpen && <ContactModal />}
        {isWalletOpen && <WalletModal />}
        <ReloadPrompt />
        <PWAInstallBanner />

        {/* Global AI Shopping Advisor Badge & Drawer - Always available across all pages */}
        <ShoppingAdvisorWidget />
      </Suspense>
    </BrowserRouter>
  );
}

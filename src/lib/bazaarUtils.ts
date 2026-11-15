import { Capacitor } from '@capacitor/core';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    return 'https://dastyarai.com';
  }
  return '';
};

export const isBazaarEnvironment = (): boolean => {
  // 1. Build-time environment flag (e.g. VITE_BUILD_TARGET=bazaar or npm run build:bazaar)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BUILD_TARGET === 'bazaar') {
    return true;
  }
  // 2. Runtime Capacitor user-agent injection
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('BazaarVersion')) {
    return true;
  }
  // 3. Any Capacitor native Android / APK platform build is targeted for Cafe Bazaar
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    return true;
  }
  return false;
};

export const doSilentBazaarLogin = async (login: (user: any, token: string) => void) => {
  // If the user explicitly logged out, don't force them back into a guest account
  if (localStorage.getItem('bazaar_explicit_logout') === 'true') {
    return;
  }

  let guestId = localStorage.getItem('bazaar_guest_id');
  if (!guestId) {
    guestId = 'bz_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem('bazaar_guest_id', guestId);
  }
  
  const email = `${guestId}@bazaar.guest`;
  const password = guestId;

  try {
    // Try to login first (in case they already have this guest account on backend)
    const apiBase = getApiBaseUrl();
    let res = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    // If it fails, they need to register the guest account
    if (!res.ok) {
      res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          name: 'کاربر کافه‌بازار', 
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
          source: 'bazaar'
        })
      });
    }

    if (res.ok) {
      const data = await res.json();
      if (data.token && data.user) {
        login(data.user, data.token);
      }
    }
  } catch (err) {
    console.warn('[Bazaar] Silent login failed:', err);
  }
};

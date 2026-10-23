import { create } from 'zustand';

type AuthChangeListener = (userId: number | null) => void;
const authChangeListeners: AuthChangeListener[] = [];

export function onAuthChange(listener: AuthChangeListener): () => void {
  authChangeListeners.push(listener);
  return () => {
    const idx = authChangeListeners.indexOf(listener);
    if (idx !== -1) authChangeListeners.splice(idx, 1);
  };
}

function notifyAuthChange(userId: number | null) {
  for (const listener of authChangeListeners) {
    try {
      listener(userId);
    } catch (e) {
      console.error('[AuthStore] Listener error:', e);
    }
  }
}

interface User {
  id: number;
  phone?: string;
  email?: string;
  name?: string;
  avatar?: string;
  role: string;
  walletBalance?: number;
  hasReceivedWelcomeBonus?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setWalletBalance: (balance: number) => void;
  setAuthModalOpen: (isOpen: boolean) => void;
  checkAuth: () => Promise<void>;
}

export function getInitialUserIdFromToken(): number | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload.id || payload.userId || null;
  } catch {
    return null;
  }
}

function getValidInitialToken(): string | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

const initialToken = getValidInitialToken();

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isAuthModalOpen: false,

  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.removeItem('chatbox_guest_count');
    set({ user, token, isAuthenticated: true, isAuthModalOpen: false });
    notifyAuthChange(user.id);
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
    notifyAuthChange(null);
  },

  setUser: (user) => {
    set({ user });
    if (user) notifyAuthChange(user.id);
  },

  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null
    }));
  },

  setWalletBalance: (balance) => {
    set((state) => ({
      user: state.user ? { ...state.user, walletBalance: balance } : null
    }));
  },

  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      notifyAuthChange(null);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true });
        notifyAuthChange(data.user.id);
      } else {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
        notifyAuthChange(null);
      }
    } catch (err) {
      console.error('[Auth] Validation failed:', err);
    }
  }
}));


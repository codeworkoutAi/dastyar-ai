import { create } from 'zustand';

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
  updateUser: (updates: Partial<User>) => void;
  setWalletBalance: (balance: number) => void;
  setAuthModalOpen: (isOpen: boolean) => void;
  checkAuth: () => Promise<void>;
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
    set({ user, token, isAuthenticated: true, isAuthModalOpen: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
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
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true });
      } else {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      }
    } catch (err) {
      console.error('[Auth] Validation failed:', err);
    }
  }
}));

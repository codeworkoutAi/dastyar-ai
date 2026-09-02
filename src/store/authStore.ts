import { create } from 'zustand';

interface User {
  id: number;
  phone?: string;
  email?: string;
  name?: string;
  avatar?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setAuthModalOpen: (isOpen: boolean) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isAuthModalOpen: false,

  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, isAuthModalOpen: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
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

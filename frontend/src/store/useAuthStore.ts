import { create } from 'zustand';
import type { UserInfo } from '../types/auth';

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  setAuth: (user: UserInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setAuth: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null }),
}));
import axiosClient from './axiosClient';
import type { LoginRequest, RegisterRequest, AuthResponse, UserInfo } from '@/types/auth';
import { useAuthStore } from '@/store/useAuthStore';

const TOKEN_KEY = 'accessToken';

export const authService = {
  // Gọi API đăng nhập (/auth/login) và lưu user + token vào store & localStorage
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/login', data);
    const authData = response as unknown as AuthResponse;

    const user: UserInfo = {
      email: authData.email,
      username: authData.username,
      role: authData.role,
    };

    useAuthStore.getState().setAuth(user, authData.token);
    return authData;
  },

  // Gọi API đăng ký (/auth/register) của Hồng
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/register', data);
    const authData = response as unknown as AuthResponse;
    return authData;
  },

  // Đăng xuất: xóa state trong store & localStorage
  logout: (): void => {
    useAuthStore.getState().logout();
  },

  // Lấy token hiện tại
  getToken: (): string | null => {
    const storeToken = useAuthStore.getState().token;
    if (storeToken) return storeToken;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },
};
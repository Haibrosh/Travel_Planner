import axiosClient from './axiosClient';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'userInfo';

export const authService = {
  // Gọi API đăng nhập và lưu token
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/login', data);
    const authData = response as unknown as AuthResponse;

    // Lưu token và thông tin user vào localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, authData.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    }

    return authData;
  },

  // Gọi API đăng ký
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/register', data);
    return response as unknown as AuthResponse;
  },

  // Đăng xuất: xóa token khỏi localStorage
  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  // Lấy token hiện tại
  getToken: (): string | null => {
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
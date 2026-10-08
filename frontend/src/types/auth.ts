// ===== Request Types =====

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

// ===== Response Types =====

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user: UserInfo;
}

export interface UserInfo {
  id: string | number;
  fullName: string;
  email: string;
  role?: string;
}

// ===== API Error Type =====

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}

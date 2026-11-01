// ===== Request Types (khớp DTO Backend của Hồng) =====

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

// ===== Response Types (khớp AuthResponse.java của Hồng) =====

export interface AuthResponse {
  token: string;
  email: string;
  username: string;
  role?: string;
}

export interface UserInfo {
  id?: string | number;
  username: string;
  email: string;
  role?: string;
}

// ===== API Error Type (khớp GlobalExceptionHandler.java) =====

export interface ApiError {
  timestamp?: string;
  status: number;
  error?: string;
  message: string;
}


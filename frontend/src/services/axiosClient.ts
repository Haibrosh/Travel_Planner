import axios from 'axios';

// Khoi tao axios instance voi base URL cua Spring Boot
const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tu dong lay token tu localStorage va gan vao header
axiosClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Bat loi toan cuc tu backend
axiosClient.interceptors.response.use(
  (response) => {
    // Chi lay phan data tu response
    return response.data;
  },
  (error) => {
    // Chi redirect ve /login khi 401 neu khong phai dang goi chinh API /auth/login
    const requestUrl = error.config?.url || '';
    if (error.response?.status === 401 && !requestUrl.includes('/auth/login')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userInfo');
        window.location.replace(new URL('/login', window.location.origin).href);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
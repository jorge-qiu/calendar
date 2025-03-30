import api from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

const authService = {
  // 用户登录
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    // 保存token到本地存储
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  // 用户注册
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    // 保存token到本地存储
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data.user;
  },

  // 退出登录
  logout: (): void => {
    localStorage.removeItem('token');
  },

  // 判断用户是否已登录
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  }
};

export default authService; 
/**
 * Flash Sale API client — typed axios wrapper for the FastAPI backend.
 * Proxied via Vite: /api → http://localhost:8000/api/v1
 */

import axios, { AxiosInstance } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  created_at: string;
  product: Product;
}

export interface CheckoutRequest {
  product_id: number;
  quantity: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  role: 'ADMIN' | 'USER';
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  is_active?: boolean;
}

// ─── Client ───────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'flash_sale_token';

function buildClient(): AxiosInstance {
  const client = axios.create({
    baseURL: '/api/v1',
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
  );

  return client;
}

const api = buildClient();

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterDto) =>
    api.post<TokenResponse>('/auth/register', data).then(r => r.data),
  login: (data: LoginDto) =>
    api.post<TokenResponse>('/auth/login', data).then(r => r.data),
  me: () => api.get<User>('/auth/me').then(r => r.data),
  saveToken: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (activeOnly = true) =>
    api.get<Product[]>('/products', { params: { active_only: activeOnly } }).then(r => r.data),
  get: (id: number) => api.get<Product>(`/products/${id}`).then(r => r.data),
  create: (data: CreateProductDto) =>
    api.post<Product>('/products', data).then(r => r.data),
  update: (id: number, data: Partial<CreateProductDto>) =>
    api.put<Product>(`/products/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`/products/${id}`),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  /** Atomic Redis-locked checkout */
  checkout: (data: CheckoutRequest) =>
    api.post<Order>('/orders/checkout', data).then(r => r.data),
  list: (params?: { skip?: number; limit?: number }) =>
    api.get<Order[]>('/orders', { params }).then(r => r.data),
  get: (id: number) => api.get<Order>(`/orders/${id}`).then(r => r.data),
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Books
  books: {
    list: `${API_BASE_URL}/books`,
    detail: (id: string) => `${API_BASE_URL}/books/${id}`,
    search: `${API_BASE_URL}/books/search`,
  },

  gategories: {
    list: `${API_BASE_URL}/categories`,
  },

  // Cart
  cart: {
    list: `${API_BASE_URL}/cart`,
    add: `${API_BASE_URL}/cart/add`,
    update: (itemId: string) => `${API_BASE_URL}/cart/${itemId}`,
    remove: (itemId: string) => `${API_BASE_URL}/cart/${itemId}`,
    clear: `${API_BASE_URL}/cart/clear`,
  },

  // Reviews
  reviews: {
    list: (bookId: string) => `${API_BASE_URL}/books/${bookId}/reviews`,
    create: `${API_BASE_URL}/reviews`,
    update: (id: string) => `${API_BASE_URL}/reviews/${id}`,
    delete: (id: string) => `${API_BASE_URL}/reviews/${id}`,
  },

  // Auth
  auth: {
    login: `${API_BASE_URL}/login`,
    register: `${API_BASE_URL}/register`,
    logout: `${API_BASE_URL}/logout`,
    profile: `${API_BASE_URL}/profile`,
    refresh: `${API_BASE_URL}/refresh`,
    google: `${API_BASE_URL}/auth/google`,
  },

  // Orders
  orders: {
    list: `${API_BASE_URL}/orders`,
    create: `${API_BASE_URL}/orders`,
    createFromCart: `${API_BASE_URL}/orders/from-cart`,
    detail: (id: string) => `${API_BASE_URL}/orders/${id}`,
    cancel: (id: string) => `${API_BASE_URL}/orders/${id}/cancel`,
  },

  // Payments
  payments: {
    list: `${API_BASE_URL}/payments`,
    create: (orderId: string) => `${API_BASE_URL}/orders/${orderId}/payment`,
  },

  // Upload
  upload: {
    avatar: `${API_BASE_URL}/upload/avatar`,
  },
};

export function getHeaders(token?: string, isMultipart: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {};

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

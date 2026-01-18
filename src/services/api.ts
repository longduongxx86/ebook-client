import { API_ENDPOINTS, getHeaders, API_CONFIG } from '../config/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchAPI<T>(
  url: string,
  options: RequestInit & { token?: string; isMultipart?: boolean } = {}
): Promise<T> {
  const { token, isMultipart, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...getHeaders(token, isMultipart),
      ...((fetchOptions.headers as Record<string, string>) || {}),
    },
    signal: AbortSignal.timeout(API_CONFIG.timeout),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.statusText,
      (data?.error as string) || data?.message || 'An error occurred'
    );
  }

  return data;
}

export const bookApi = {
  async getBooks(token?: string) {
    return fetchAPI(API_ENDPOINTS.books.list, { token });
  },

    async getBooksWithFilters(filters: string, token?: string) {
    return fetchAPI(`${API_ENDPOINTS.books.list}?${filters}`, { token });
  },

  async getBook(id: string, token?: string) {
    return fetchAPI(API_ENDPOINTS.books.detail(id), { token });
  },

  async searchBooks(query: string, token?: string) {
    return fetchAPI(`${API_ENDPOINTS.books.search}?q=${encodeURIComponent(query)}`, {
      token,
    });
  },
};

export const categoriApi = {
  async getCategory(token?: string) {
    return fetchAPI(API_ENDPOINTS.gategories.list, { token });
  },
};

export const cartApi = {
  async getCart(token: string) {
    return fetchAPI(API_ENDPOINTS.cart.list, { token });
  },

  async addToCart(bookId: string, quantity: number = 1, token: string) {
    return fetchAPI(API_ENDPOINTS.cart.add, {
      method: 'POST',
      body: JSON.stringify({ bookId: Number(bookId), quantity }),
      token,
    });
  },

  async updateCart(itemId: string, quantity: number, token: string) {
    return fetchAPI(API_ENDPOINTS.cart.update(itemId), {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
      token,
    });
  },

  async removeFromCart(itemId: string, token: string) {
    return fetchAPI(API_ENDPOINTS.cart.remove(itemId), {
      method: 'DELETE',
      token,
    });
  },

  async clearCart(token: string) {
    return fetchAPI(API_ENDPOINTS.cart.clear, {
      method: 'DELETE',
      token,
    });
  },
};

export const reviewApi = {
  async getReviews(bookId: string, token?: string) {
    return fetchAPI(API_ENDPOINTS.reviews.list(bookId), { token });
  },

  async createReview(
    bookId: string,
    rating: number,
    comment: string | null,
    token: string
  ) {
    return fetchAPI(API_ENDPOINTS.reviews.create, {
      method: 'POST',
      body: JSON.stringify({ bookId, rating, comment }),
      token,
    });
  },

  async updateReview(id: string, rating: number, comment: string | null, token: string) {
    return fetchAPI(API_ENDPOINTS.reviews.update(id), {
      method: 'PUT',
      body: JSON.stringify({ rating, comment }),
      token,
    });
  },

  async deleteReview(id: string, token: string) {
    return fetchAPI(API_ENDPOINTS.reviews.delete(id), {
      method: 'DELETE',
      token,
    });
  },
};

export const authApi = {
  async login(email: string, password: string) {
    return fetchAPI(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string, fullName: string) {
    return fetchAPI(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  },

  async logout(token: string) {
    return fetchAPI(API_ENDPOINTS.auth.logout, {
      method: 'POST',
      token,
    });
  },

  async getProfile(token: string) {
    return fetchAPI(API_ENDPOINTS.auth.profile, { token });
  },

  async refreshToken(token: string) {
    return fetchAPI(API_ENDPOINTS.auth.refresh, {
      method: 'POST',
      token,
    });
  },

  async updateProfile(data: unknown, token: string) {
    return fetchAPI(API_ENDPOINTS.auth.profile, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },

  async uploadAvatar(file: File, token: string) {
    const formData = new FormData();
    formData.append('avatar', file);
    return fetchAPI(API_ENDPOINTS.upload.avatar, {
      method: 'POST',
      body: formData,
      token,
      isMultipart: true,
    });
  },
};

export const paymentApi = {
  async getPayments(token: string) {
    return fetchAPI(API_ENDPOINTS.payments.list, { token });
  },

  async createPayment(orderId: string, method: string, token: string) {
    return fetchAPI(API_ENDPOINTS.payments.create(orderId), {
      method: 'POST',
      body: JSON.stringify({ method }),
      token,
    });
  },
};

export const orderApi = {
  async getOrders(token: string) {
    return fetchAPI(API_ENDPOINTS.orders.list, { token });
  },

  async createOrderFromCart(shippingAddress: string, token: string) {
    return fetchAPI(API_ENDPOINTS.orders.createFromCart, {
      method: 'POST',
      body: JSON.stringify({ shipping_address: shippingAddress }),
      token,
    });
  },

  async createOrder(
    items: Array<{ bookId: string; quantity: number }>,
    shippingAddress: string,
    token: string
  ) {
    return fetchAPI(API_ENDPOINTS.orders.create, {
      method: 'POST',
      body: JSON.stringify({ items, shipping_address: shippingAddress }),
      token,
    });
  },

  async getOrder(id: string, token: string) {
    return fetchAPI(API_ENDPOINTS.orders.detail(id), { token });
  },

  async cancelOrder(id: string, token: string) {
    return fetchAPI(API_ENDPOINTS.orders.cancel(id), {
      method: 'PUT',
      token,
    });
  },
};

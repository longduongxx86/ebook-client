// Common API Response Types

export interface Pagination {
  total: number;
  page: number;
  limit: number;
}

// Book Types
export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  cover_url: string | null;
  image_url?: string | null; // Some APIs use image_url instead of cover_url
  excerpt: string | null;
  category: string;
  rating_avg?: number;
  rating_count?: number;
  average_rating?: number;
  review_count?: number;
  stock: number;
}

export interface BooksResponse {
  books: Book[];
  pagination?: Pagination;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at?: number | string;
  updated_at?: number | string;
}

export interface CategoriesResponse {
  categories: Category[];
  pagination?: Pagination;
}

// Cart Types
export interface CartBook {
  id: string;
  title: string;
  author: string;
  price: number;
  image_url: string | null;
  stock: number;
}

export interface CartItem {
  id: string;
  book_id?: string;
  book: CartBook;
  quantity: number;
}

export interface CartResponse {
  cart?: {
    items: CartItem[];
  };
  items?: CartItem[];
}

// Order Types
export interface OrderItem {
  id: string;
  book_id?: string;
  book: {
    id: string;
    title: string;
    author?: string;
  };
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id?: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  notes?: string;
  created_at: string | number;
  updated_at?: string | number;
}

export interface OrdersResponse {
  orders: Order[];
  pagination?: Pagination;
}

// Payment Types
export interface Payment {
  id: string;
  order_id?: string;
  Order?: {
    id?: string;
    order_number: string;
  };
  amount: number;
  method: 'qr' | 'cash' | 'bank_transfer' | string;
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
  qr_code?: string;
  bank_info?: string;
  created_at: string | number;
  updated_at?: string | number;
}

export interface PaymentsResponse {
  payments: Payment[];
  pagination?: Pagination;
}

// User/Profile Types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
}

export interface ProfileResponse {
  user: User;
}

// Book Detail Types (for single book API)
export interface BookDetailSeller {
  id: number;
  created_at: number;
  updated_at: number;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  avatar_url: string;
  role: string;
}

export interface BookDetailCategory {
  id: number;
  created_at: number;
  updated_at: number;
  name: string;
  slug: string;
  description: string;
}

export interface BookDetail {
  id: number;
  created_at: number;
  updated_at: number;
  title: string;
  author: string;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  slug: string;
  image_url: string | null;
  isbn: string | null;
  average_rating: number;
  review_count: number;
  seller_id: number;
  seller: BookDetailSeller;
  category_id: number;
  category: BookDetailCategory | null;
}

export interface ReviewUser {
  id: number;
  created_at: number;
  updated_at: number;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  avatar_url: string;
  role: string;
}

export interface Review {
  id: number;
  created_at: number;
  updated_at: number;
  book_id: number;
  user_id: number;
  user: ReviewUser;
  rating: number;
  comment: string;
  approved: boolean;
}

export interface BookDetailResponse {
  book: BookDetail;
  reviews: Review[];
}

export interface ReviewsResponse {
  reviews: Review[] | Review[];
  data?: Review[];
}

// Filter Params
export interface FilterParams {
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: string;
  search?: string;
  page?: number;
  limit?: number;
}


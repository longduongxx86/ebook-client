import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { useAuth } from './contexts/AuthContext';
import { bookApi, categoriApi, ApiError } from './services/api';
import { API_CONFIG } from './config/api';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import BookCatalog, { FilterParams } from './components/BookCatalog';
import BookDetail from './components/BookDetail';
import CartDrawer from './components/CartDrawer';
import Toast from './components/Toast';
import ProfilePage from './components/ProfilePage';
import type { Book as ApiBook, Category as ApiCategory, BooksResponse, CategoriesResponse, Pagination } from './types/api';

// Types matching BookCatalog's expectations
type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'bestseller';

interface BookCatalogBook {
  id: string;
  title: string;
  author: string;
  price: number;
  image_url: string | null;
  excerpt: string | null;
  category: BookCatalogCategory;
  rating_avg: number;
  rating_count: number;
  stock: number;
}

interface BookCatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: number;
  updated_at: number;
}

interface FilterState {
  categories: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sortBy: SortOption;
  search: string;
  page: number;
  limit: number;
}

const buildQueryString = (params: FilterParams) => {
  const query = new URLSearchParams();
  query.append('page', params.page?.toString() || '1');
  query.append('limit', params.limit?.toString() || '20');

  if (params.categories && params.categories.length > 0) {
    query.append('categories', params.categories.join(','));
  }

  if (params.minPrice !== undefined) query.append('min_price', params.minPrice.toString());
  if (params.maxPrice !== undefined) query.append('max_price', params.maxPrice.toString());
  if (params.minRating !== undefined && params.minRating > 0) query.append('min_rating', params.minRating.toString());
  
  if (params.search) query.append('search', params.search);

  const sortBy = params.sortBy || 'newest';
  let sortField = 'created_at';
  let sortOrder = 'desc';

  switch (sortBy) {
    case 'price-asc':
      sortField = 'price';
      sortOrder = 'asc';
      break;
    case 'price-desc':
      sortField = 'price';
      sortOrder = 'desc';
      break;
    case 'rating':
      sortField = 'rating_avg';
      sortOrder = 'desc';
      break;
    case 'bestseller':
      sortField = 'sold'; 
      sortOrder = 'desc';
      break;
    case 'newest':
    default:
      sortField = 'created_at';
      sortOrder = 'desc';
      break;
  }
  
  query.append('sort_by', sortField);
  query.append('sort_order', sortOrder);

  return query.toString();
};

// Helper to normalize Book from API to BookCatalog format
const normalizeBook = (book: ApiBook, categoryMap: Map<string, BookCatalogCategory>): BookCatalogBook | null => {
  // Get category - API might return category as string (category name/id) or Category object
  let category: BookCatalogCategory | null = null;
  
  if (typeof book.category === 'string') {
    // If category is a string, try to find it in categoryMap
    // For now, create a minimal category object
    category = categoryMap.get(book.category) || {
      id: book.category,
      name: book.category,
      slug: book.category.toLowerCase().replace(/\s+/g, '-'),
      description: '',
      created_at: Date.now(),
      updated_at: Date.now(),
    };
  } else if (book.category && typeof book.category === 'object') {
    // If category is an object, normalize it
    const cat = book.category as unknown as ApiCategory;
    category = {
      id: String(cat.id),
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      created_at: typeof cat.created_at === 'number' ? cat.created_at : Date.now(),
      updated_at: typeof cat.updated_at === 'number' ? cat.updated_at : Date.now(),
    };
  }
  
  if (!category) return null;

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    price: book.price,
    image_url: book.image_url || book.cover_url || null,
    excerpt: book.excerpt,
    category,
    rating_avg: book.rating_avg,
    rating_count: book.rating_count,
    stock: book.stock,
  };
};

function AppContent() {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const [books, setBooks] = useState<BookCatalogBook[]>([]);
  const [pagination, setPagination] = useState<Pagination | undefined>(undefined);
  const [categories, setCategories] = useState<BookCatalogCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingCartAction, setPendingCartAction] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'profile'>('home');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const wsUnauthorizedRef = useRef(false);
  const wsConnectingRef = useRef(false);

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    minPrice: 0,
    maxPrice: 500000,
    minRating: 0,
    sortBy: 'newest',
    search: '',
    page: 1,
    limit: 12
  });

  useEffect(() => {
    fetchCategories().then(() => {
      fetchBooks();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchBooksWithFilters = async () => {
      try {
        // Gọi API với filters
        const queryString = buildQueryString(filters);
        const response = await bookApi.getBooksWithFilters(queryString, token || undefined) as BooksResponse | { data?: BooksResponse; books?: ApiBook[]; pagination?: Pagination };
        const booksArray = (response as BooksResponse).books || (response as { data?: BooksResponse }).data?.books || (response as { books?: ApiBook[] }).books || [];
        const paginationData = (response as BooksResponse).pagination || (response as { data?: BooksResponse }).data?.pagination || (response as { pagination?: Pagination }).pagination;
        
        // Create category map for normalization
        const categoryMap = new Map<string, BookCatalogCategory>();
        categories.forEach(cat => categoryMap.set(cat.id, cat));
        
        const normalizedBooks = booksArray
          .map(book => normalizeBook(book, categoryMap))
          .filter((book): book is BookCatalogBook => book !== null);
        setBooks(normalizedBooks);
        setPagination(paginationData);
      } catch (error) {
        console.error('Error fetching books with filters:', error);
      }
    };

    // Debounce để tránh gọi API quá nhiều
    const timeoutId = setTimeout(() => {
      fetchBooksWithFilters();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, categories]);

  useEffect(() => {
    if (!token || wsUnauthorizedRef.current || wsConnectingRef.current) {
      if (!token && ws) {
        ws.close();
        setWs(null);
      }
      return;
    }
    const base = API_CONFIG.baseURL.replace(/\/api$/, '');
    const protocolBase = base.startsWith('https') ? base.replace(/^https/, 'wss') : base.replace(/^http/, 'ws');
    const url = `${protocolBase}/ws?token=${token}`;
    wsConnectingRef.current = true;
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(url);
    } catch {
      wsConnectingRef.current = false;
      return;
    }
    socket.onopen = () => {
      wsConnectingRef.current = false;
    };
    socket.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (typeof data?.message === 'string') {
          setToast(data.message);
        }
      } catch (err) {
        console.log('WS parse error', err);
      }
    };
    socket.onerror = () => {
      wsUnauthorizedRef.current = true;
      wsConnectingRef.current = false;
    };
    socket.onclose = () => {
      wsConnectingRef.current = false;
    };
    setWs(socket);
    return () => {
      socket?.close();
      setWs(null);
    };
  }, [token, ws]);

  const fetchBooks = async () => {
    try {
      const response = await bookApi.getBooks() as BooksResponse | { data?: BooksResponse; books?: ApiBook[]; pagination?: Pagination };
      const booksArray = (response as BooksResponse).books || (response as { data?: BooksResponse }).data?.books || (response as { books?: ApiBook[] }).books || [];
      const paginationData = (response as BooksResponse).pagination || (response as { data?: BooksResponse }).data?.pagination || (response as { pagination?: Pagination }).pagination;
      
      // Create category map for normalization
      const categoryMap = new Map<string, BookCatalogCategory>();
      categories.forEach(cat => categoryMap.set(cat.id, cat));
      
      const normalizedBooks = booksArray
        .map(book => normalizeBook(book, categoryMap))
        .filter((book): book is BookCatalogBook => book !== null);
      setBooks(normalizedBooks);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriApi.getCategory() as CategoriesResponse | { data?: CategoriesResponse; categories?: ApiCategory[] };
      const categoriesArray = (response as CategoriesResponse).categories || (response as { data?: CategoriesResponse }).data?.categories || (response as { categories?: ApiCategory[] }).categories || [];
      // Normalize categories to BookCatalog format
      const normalizedCategories: BookCatalogCategory[] = categoriesArray.map(cat => ({
        id: String(cat.id),
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        created_at: typeof cat.created_at === 'number' ? cat.created_at : Date.now(),
        updated_at: typeof cat.updated_at === 'number' ? cat.updated_at : Date.now(),
      }));
      setCategories(normalizedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddToCart = async (bookId: string) => {
    if (!user) {
      setPendingCartAction(bookId);
      setLoginMessage('Bạn cần đăng nhập để thêm sách vào giỏ. Đăng nhập ngay bằng Gmail hoặc email.');
      setShowLoginModal(true);
      return;
    }

    try {
      await addToCart(bookId);
      setToast('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error instanceof ApiError && String(error.message).toLowerCase().includes('insufficient stock')) {
        setToast('Sản phẩm đã hết hàng');
      } else {
        setToast('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  const handleLoginSuccess = async () => {
    if (pendingCartAction) {
      try {
        await addToCart(pendingCartAction);
        setToast('Đã thêm vào giỏ hàng');
      } catch (error) {
        console.error('Error adding to cart:', error);
        if (error instanceof ApiError && String(error.message).toLowerCase().includes('insufficient stock')) {
          setToast('Sản phẩm đã hết hàng');
        } else {
          setToast('Có lỗi xảy ra. Vui lòng thử lại.');
        }
      }
      setPendingCartAction(null);
    }
    setLoginMessage('');
  };

  const handleLoginRequired = () => {
    setLoginMessage('Bạn cần đăng nhập để thực hiện chức năng này.');
    setShowLoginModal(true);
  };

  const handleFilterChange = useCallback((filterParams: FilterParams) => {
    setFilters(prev => ({
      ...prev,
      categories: filterParams.categories || [],
      minPrice: filterParams.minPrice ?? prev.minPrice,
      maxPrice: filterParams.maxPrice ?? prev.maxPrice,
      minRating: filterParams.minRating ?? prev.minRating,
      sortBy: (filterParams.sortBy as SortOption) || prev.sortBy,
      search: filterParams.search ?? prev.search,
      page: filterParams.page || 1,
      limit: filterParams.limit || prev.limit
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <Header
        onSearchChange={setSearchQuery}
        onLoginClick={() => {
          setLoginMessage('');
          setShowLoginModal(true);
        }}
        onCartClick={() => setShowCart(true)}
        onCategoryClick={() => { }}
        onProfileClick={() => setView('profile')}
        onLogoClick={() => setView('home')}
      />

      {view === 'home' ? (
        <BookCatalog
          dataBooks={{ books, pagination }}
          dataCategories={categories}
          searchQuery={searchQuery}
          onAddToCart={handleAddToCart}
          onViewDetails={setSelectedBookId}
          onFilterChange={handleFilterChange} // Thêm prop này
        />
      ) : (
        <ProfilePage />
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setLoginMessage('');
          setPendingCartAction(null);
        }}
        message={loginMessage}
        onSuccess={handleLoginSuccess}
      />

      {selectedBookId && (
        <BookDetail
          bookId={selectedBookId}
          onClose={() => setSelectedBookId(null)}
          onAddToCart={handleAddToCart}
          onLoginRequired={handleLoginRequired}
        />
      )}

      <CartDrawer isOpen={showCart} onClose={() => setShowCart(false)} />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900 mb-3">Về Nhà Sách</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nhà sách cá nhân chuyên cung cấp sách văn học, kỹ năng sống, kinh tế và nhiều thể loại khác.
                Chúng tôi cam kết mang đến những cuốn sách chất lượng với giá cả hợp lý.
              </p>
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900 mb-3">Liên hệ</h3>
              <p className="text-sm text-gray-600">Email: contact@nhasach.vn</p>
              <p className="text-sm text-gray-600">Điện thoại: 0123 456 789</p>
              <p className="text-sm text-gray-600">Địa chỉ: 123 Đường Sách, Quận 1, TP.HCM</p>
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900 mb-3">Chính sách</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-amber-600 transition-colors">
                    Điều khoản sử dụng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-amber-600 transition-colors">
                    Chính sách bảo mật
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-amber-600 transition-colors">
                    Chính sách đổi trả
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-600">
            © 2025 Nhà Sách. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

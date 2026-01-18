import { useState, useEffect } from 'react';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import BookCard from './BookCard';
import FilterSidebar from './FilterSidebar';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  image_url: string | null;
  excerpt: string | null;
  category: Category; // Giữ nguyên để hiển thị category của từng book
  rating_avg: number;
  rating_count: number;
  stock: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: number;
  updated_at: number;
}

interface ApiResponse {
  books: Book[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Interface riêng cho categories response
interface CategoriesResponse {
  categories: Category[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

interface BookCatalogProps {
  dataBooks: ApiResponse | Book[];
  dataCategories?: Category[] | CategoriesResponse; // Thêm dataCategories từ props
  searchQuery: string;
  onAddToCart: (bookId: string) => void;
  onViewDetails: (bookId: string) => void;
  onFilterChange?: (filters: FilterParams) => void;
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'bestseller';

export interface FilterParams {
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: SortOption;
  search?: string;
  page?: number;
  limit?: number;
}

export default function BookCatalog({
  dataBooks,
  dataCategories, // Nhận categories từ props
  searchQuery,
  onAddToCart,
  onViewDetails,
  onFilterChange
}: BookCatalogProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [minRating, setMinRating] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Xử lý books data
  const books = Array.isArray(dataBooks) ? dataBooks : (dataBooks?.books || []);

  // Xử lý categories data - lấy từ props thay vì từ books
  const categories = Array.isArray(dataCategories) 
    ? dataCategories 
    : (dataCategories?.categories || []);

  const pagination = !Array.isArray(dataBooks) ? dataBooks?.pagination : undefined;

  useEffect(() => {
    if (onFilterChange) {
      const filterParams: FilterParams = {
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        minRating: minRating > 0 ? minRating : undefined,
        sortBy: sortBy,
        search: searchQuery,
        page: currentPage,
        limit: ITEMS_PER_PAGE
      };

      const timeoutId = setTimeout(() => {
        onFilterChange(filterParams);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedCategories, priceRange, minRating, sortBy, searchQuery, currentPage, onFilterChange]);

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 500000]);
    setMinRating(0);
    setSelectedLetter('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
    setCurrentPage(1);
  };

  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range);
    setCurrentPage(1);
  };

  const handleRatingChange = (rating: number) => {
    setMinRating(rating);
    setCurrentPage(1);
  };

  const handleLetterChange = (letter: string) => {
    setSelectedLetter(letter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // const totalBooks = pagination?.total || books.length;
  const totalPages = pagination ? Math.ceil(pagination.total / ITEMS_PER_PAGE) : Math.ceil(books.length / ITEMS_PER_PAGE) || 1;
  const visibleBooks = pagination ? books : books.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-6">
        {/* Truyền categories vào FilterSidebar */}
        <FilterSidebar
          categories={categories.map(cat => cat)} // Chỉ truyền name cho filter
          selectedCategories={selectedCategories}
          priceRange={priceRange}
          minRating={minRating}
          selectedLetter={selectedLetter}
          onCategoryChange={handleCategoryChange}
          onPriceChange={handlePriceChange}
          onRatingChange={handleRatingChange}
          onLetterChange={handleLetterChange}
          onClearFilters={handleClearFilters}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />

        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-900">
                  Trang chính
                </h2>
                {/* <p className="text-sm text-gray-600 mt-1">
                  {books.length} sách được tìm thấy{pagination ? ` (Tổng: ${totalBooks})` : ''}
                </p> */}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <SlidersHorizontal size={20} />
                  Bộ lọc
                </button>

                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp → Cao</option>
                <option value="price-desc">Giá: Cao → Thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="bestseller">Bán chạy</option>
              </select>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sách</h3>
              <p className="text-gray-600 mb-4">
                Không có sách nào phù hợp với bộ lọc hiện tại
              </p>
              <button
                onClick={handleClearFilters}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {visibleBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                  return false;
                })
                .map((page, index, array) => {
                  // Thêm dấu ... nếu cần
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {showEllipsis && <span className="text-gray-400">...</span>}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded border ${
                          currentPage === page
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                        } transition-colors`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

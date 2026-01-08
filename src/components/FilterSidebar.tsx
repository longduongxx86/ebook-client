import { X } from 'lucide-react';

interface FilterSidebarProps {
  categories: Category[];
  selectedCategories: string[];
  priceRange: [number, number];
  minRating: number;
  selectedLetter: string;
  onCategoryChange: (categories: string[]) => void;
  onPriceChange: (range: [number, number]) => void;
  onRatingChange: (rating: number) => void;
  onLetterChange: (letter: string) => void;
  onClearFilters: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: number;
  updated_at: number;
}


export default function FilterSidebar({
  categories,
  selectedCategories,
  priceRange,
  minRating,
  onCategoryChange,
  onPriceChange,
  onRatingChange,
  onClearFilters,
  isOpen = true,
  onClose,
}: FilterSidebarProps) {
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < count ? 'text-amber-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <div
        className={`lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      <aside
        className={`
        fixed lg:sticky top-0 left-0 h-screen lg:h-auto
        w-80 lg:w-64 bg-white border-r lg:border-r-0 border-gray-200
        overflow-y-auto z-50 lg:z-0
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6 lg:mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <button
            onClick={onClearFilters}
            className="w-full mb-6 px-4 py-2 text-sm text-amber-600 border border-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
          >
            Xóa tất cả bộ lọc
          </button>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Thể loại</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {category.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Khoảng giá</h3>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={priceRange[1]}
                  onChange={(e) => onPriceChange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex items-center justify-between text-sm">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => onPriceChange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                    placeholder="Min"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => onPriceChange([priceRange[0], parseInt(e.target.value) || 500000])}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Đánh giá</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => onRatingChange(rating)}
                      className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-1">
                      {renderStars(rating)}
                      <span className="text-sm text-gray-600 ml-1">trở lên</span>
                    </div>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === 0}
                    onChange={() => onRatingChange(0)}
                    className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Tất cả</span>
                </label>
              </div>
            </div>


          </div>
        </div>
      </aside>
    </>
  );
}

import { ShoppingCart, Eye } from 'lucide-react';
import { useState } from 'react';

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    price: number;
    image_url: string | null;
    excerpt: string | null;
    rating_avg: number;
    rating_count: number;
    stock: number;
  };
  onAddToCart: (bookId: string) => void;
  onViewDetails: (bookId: string) => void;
}

export default function BookCard({ book, onAddToCart, onViewDetails }: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const renderStars = () => {
    const fullStars = Math.floor(book.rating_avg);
    const hasHalfStar = book.rating_avg % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < fullStars) {
            return (
              <span key={i} className="text-amber-400">
                ★
              </span>
            );
          } else if (i === fullStars && hasHalfStar) {
            return (
              <span key={i} className="text-amber-400">
                ★
              </span>
            );
          } else {
            return (
              <span key={i} className="text-gray-300">
                ★
              </span>
            );
          }
        })}
        <span className="text-xs text-gray-600 ml-1">({book.rating_count})</span>
      </div>
    );
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={book.image_url || 'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg'}
          alt={`Bìa: ${book.title} — ${book.author}`}
          className="w-full h-full object-cover"
        />
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center gap-2 transition-opacity">
            <button
              onClick={() => onViewDetails(book.id)}
              className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Xem chi tiết"
            >
              <Eye size={20} />
            </button>
            <button
              onClick={() => onAddToCart(book.id)}
              className="p-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
              aria-label="Thêm vào giỏ"
            >
              <ShoppingCart size={20} />
            </button>
          </div>
        )}
        {book.stock === 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
            Hết hàng
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-serif font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{book.author}</p>

        {book.excerpt && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{book.excerpt}</p>
        )}

        <div className="mt-auto">
          <div className="mb-2">{renderStars()}</div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-amber-600">
              {book.price.toLocaleString('vi-VN')}₫
            </span>
            <button
              onClick={() => onAddToCart(book.id)}
              disabled={book.stock === 0}
              className="px-1 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

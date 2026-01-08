import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart, Star } from 'lucide-react';
import { bookApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { BookDetail, Review, BookDetailResponse } from '../types/api';

interface BookDetailProps {
  bookId: string; // Giữ nguyên string vì prop truyền vào từ component cha
  onClose: () => void;
  onAddToCart: (bookId: string) => void;
  onLoginRequired: () => void;
}

export default function BookDetail({ bookId, onClose, onAddToCart, onLoginRequired }: BookDetailProps) {
  const { user, token } = useAuth();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'description' | 'info' | 'reviews'>('description');
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchBookDetails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookApi.getBook(bookId) as BookDetailResponse | { book?: BookDetail; reviews?: Review[] };
      const bookData = (data as BookDetailResponse).book || (data as { book?: BookDetail }).book;
      const reviewsData = (data as BookDetailResponse).reviews || (data as { reviews?: Review[] }).reviews || [];
      if (bookData) {
        setBook(bookData);
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error fetching book:', error);
    }
    setLoading(false);
  }, [bookId]);

  useEffect(() => {
    fetchBookDetails();
  }, [fetchBookDetails]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !token) {
      onLoginRequired();
      return;
    }

    setSubmitting(true);

    try {
      const { reviewApi } = await import('../services/api');
      await reviewApi.createReview(bookId, newReview.rating, newReview.comment || null, token);
      setNewReview({ rating: 5, comment: '' });
      await fetchBookDetails();
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate')) {
        alert('Bạn đã đánh giá sách này rồi!');
      } else {
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }

    setSubmitting(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
      />
    ));
  };

  if (loading || !book) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex-none bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-2xl font-serif font-bold text-gray-900">Chi tiết sách</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-1">
              <img
                src={book.image_url || 'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg'}
                alt={`Bìa: ${book.title}`}
                className="w-full rounded-lg shadow-md"
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-3xl font-serif font-bold text-gray-900 mb-2">{book.title}</h3>
                <p className="text-lg text-gray-700 mb-1">Tác giả: {book.author}</p>
                <p className="text-sm text-gray-600">Mã sản phẩm: {book.id}</p>
                <p className="text-sm text-gray-600">Người bán: {book.seller?.full_name}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(Math.round(book.average_rating))}</div>
                <span className="text-sm text-gray-600">
                  {book.average_rating.toFixed(1)} ({book.review_count} đánh giá)
                </span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-3xl font-bold text-amber-600 mb-4">
                  {book.price.toLocaleString('vi-VN')}₫
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => onAddToCart(book.id.toString())} // Convert number to string
                    disabled={book.stock === 0}
                    className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={20} />
                    Thêm vào giỏ hàng
                  </button>
                </div>

                {book.stock === 0 && (
                  <p className="text-sm text-red-600 mt-2">Sản phẩm tạm hết hàng</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex gap-4 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'description'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Mô tả
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'info'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Thông tin
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Đánh giá ({book.review_count})
              </button>
            </div>

            <div className="min-h-[200px]">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {book.description || 'Chưa có mô tả cho sách này.'}
                  </p>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="space-y-2">
                  <div className="flex py-2 border-b border-gray-100">
                    <span className="w-40 font-medium text-gray-700">Tác giả:</span>
                    <span className="text-gray-900">{book.author}</span>
                  </div>
                  <div className="flex py-2 border-b border-gray-100">
                    <span className="w-40 font-medium text-gray-700">Thể loại:</span>
                    <span className="text-gray-900">{book.category?.name}</span>
                  </div>
                  <div className="flex py-2 border-b border-gray-100">
                    <span className="w-40 font-medium text-gray-700">Mã sản phẩm:</span>
                    <span className="text-gray-900">{book.id}</span>
                  </div>
                  {book.isbn && (
                    <div className="flex py-2 border-b border-gray-100">
                      <span className="w-40 font-medium text-gray-700">ISBN:</span>
                      <span className="text-gray-900">{book.isbn}</span>
                    </div>
                  )}
                  <div className="flex py-2 border-b border-gray-100">
                    <span className="w-40 font-medium text-gray-700">Ngày tạo:</span>
                    <span className="text-gray-900">
                      {new Date(book.created_at * 1000).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex py-2 border-b border-gray-100">
                    <span className="w-40 font-medium text-gray-700">Còn hàng:</span>
                    <span className="text-gray-900">{book.stock} cuốn</span>
                  </div>
                  <div className="flex py-2 border-b border-gray-100">
                    <span className="w-40 font-medium text-gray-700">Giá gốc:</span>
                    <span className="text-gray-900">{book.cost.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {user ? (
                    <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Viết đánh giá</h4>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Đánh giá của bạn:
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setNewReview({ ...newReview, rating })}
                              className="focus:outline-none"
                            >
                              <Star
                                size={24}
                                className={
                                  rating <= newReview.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nhận xét:
                        </label>
                        <textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                          placeholder="Chia sẻ cảm nhận của bạn về cuốn sách..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                    </form>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                      <p className="text-amber-800 mb-2">Đăng nhập để bình luận</p>
                      <button
                        onClick={onLoginRequired}
                        className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Đăng nhập
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-center text-gray-600 py-8">
                        Chưa có đánh giá nào. Hãy là người đầu tiên!
                      </p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{review.user.full_name}</p>
                              <div className="flex">{renderStars(review.rating)}</div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at * 1000).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
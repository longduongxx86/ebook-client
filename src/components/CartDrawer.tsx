import { useState } from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderApi, ApiError } from '../services/api';
import Toast from './Toast';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartItems, updateQuantity, removeFromCart, loading, refreshCart } = useCart();
  const { user, token } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user || !token) {
      alert('Vui lòng đăng nhập để thanh toán');
      return;
    }
    if (cartItems.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }
    const shippingAddress = user.address || '';
    if (!shippingAddress) {
      alert('Vui lòng cập nhật địa chỉ giao hàng trong Hồ sơ trước khi thanh toán');
      return;
    }
    try {
      setIsProcessing(true);
      await orderApi.createOrderFromCart(shippingAddress, token);
      alert('Đặt hàng thành công!');
      await refreshCart();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIncrease = async (itemId: string, currentQty: number) => {
    try {
      await updateQuantity(itemId, currentQty + 1);
    } catch (e) {
      if (e instanceof ApiError && String(e.message).toLowerCase().includes('insufficient stock')) {
        setToast('Sản phẩm đã hết hàng');
        await refreshCart();
      } else {
        setToast('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  const handleDecrease = async (itemId: string, currentQty: number) => {
    try {
      await updateQuantity(itemId, currentQty - 1);
    } catch {
      setToast('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-serif font-bold text-gray-900">
              Giỏ hàng ({cartItems.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🛒</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Giỏ hàng trống</h3>
              <p className="text-gray-600 text-center mb-4">
                Bạn chưa có sản phẩm nào trong giỏ hàng
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <img
                      src={
                        item.book.image_url ||
                        'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg'
                      }
                      alt={item.book.title}
                      className="w-20 h-28 object-cover rounded"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {item.book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{item.book.author}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecrease(item.id, item.quantity)}
                            disabled={item.quantity === 1}
                            className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleIncrease(item.id, item.quantity)}
                            disabled={item.quantity >= item.book.stock}
                            className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-amber-600 mt-2">
                        {(item.book.price * item.quantity).toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 p-4 space-y-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium text-gray-900">Tổng cộng:</span>
                  <span className="font-bold text-amber-600">
                    {subtotal.toLocaleString('vi-VN')}₫
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isProcessing ? 'Đang xử lý...' : 'Tạo đơn hàng'}
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

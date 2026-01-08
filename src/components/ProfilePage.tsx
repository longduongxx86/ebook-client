import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi, orderApi, paymentApi, cartApi } from '../services/api';
import { Camera, Package, ShoppingCart, CreditCard, User, LogOut, Minus, Plus, X } from 'lucide-react';
import type { Order, OrdersResponse, Payment, PaymentsResponse, CartResponse, CartItem, User as UserType, ProfileResponse } from '../types/api';
import qrImage from '../store/qr/qr.png';

export default function ProfilePage() {
    const { user, signOut, token } = useAuth();
    const [activeTab, setActiveTab] = useState('info');
    const [orders, setOrders] = useState<Order[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [cartData, setCartData] = useState<CartResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Profile state
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);


    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setPhone(user.phone || '');
            setAddress(user.address || '');
            setAvatarPreview(user.avatar_url || null);
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'info') fetchProfile();
        if (activeTab === 'cart') fetchCart();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'payments') fetchPayments();
    }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchProfile = async () => {
        try {
            if (!token) return;
            const res = await authApi.getProfile(token) as ProfileResponse | { user?: UserType };
            if (res && (res as ProfileResponse).user) {
                const u = (res as ProfileResponse).user;
                setFullName(u.full_name || '');
                setPhone(u.phone || '');
                setAddress(u.address || '');
                setAvatarPreview(u.avatar_url || null);
            } else if (res && (res as { user?: UserType }).user) {
                const u = (res as { user?: UserType }).user!;
                setFullName(u.full_name || '');
                setPhone(u.phone || '');
                setAddress(u.address || '');
                setAvatarPreview(u.avatar_url || null);
            }
        } catch (e) { console.error(e); }
    };

    const fetchCart = async () => {
        try {
            if (!token) return;
            const res = await cartApi.getCart(token) as CartResponse | { cart?: CartResponse['cart'] };
            setCartData((res as CartResponse).cart ? { cart: (res as CartResponse).cart } : (res as { cart?: CartResponse['cart'] }).cart ? { cart: (res as { cart?: CartResponse['cart'] }).cart } : res as CartResponse);
        } catch (e) { console.error(e); }
    };

    const fetchOrders = async () => {
        try {
            if (!token) return;
            const res = await orderApi.getOrders(token) as OrdersResponse | { orders?: Order[] };
            setOrders((res as OrdersResponse).orders || (res as { orders?: Order[] }).orders || []);
        } catch (e) { console.error(e); }
    };

    const fetchPayments = async () => {
        try {
            if (!token) return;
            const res = await paymentApi.getPayments(token) as PaymentsResponse | { payments?: Payment[] };
            setPayments((res as PaymentsResponse).payments || (res as { payments?: Payment[] }).payments || []);
        } catch (e) { console.error(e); }
    };

    const handleUpdateProfile = async () => {
        try {
            setIsLoading(true);
            if (!token) return;

            // Upload avatar first if exists
            if (avatarFile) {
                await authApi.uploadAvatar(avatarFile, token);
            }

            // Update info
            const updateData = {
                full_name: fullName,
                phone: phone,
                address: address
            };
            
            const res = await authApi.updateProfile(updateData, token) as ProfileResponse | { user?: UserType };
            
            // Update local storage with new user data if returned
            if (res && res.user) {
                const currentUserStr = localStorage.getItem('bookstore_user');
                if (currentUserStr) {
                    const currentUser = JSON.parse(currentUserStr);
                    const updatedUser = { ...currentUser, ...res.user };
                    localStorage.setItem('bookstore_user', JSON.stringify(updatedUser));
                }
            }

            alert('Cập nhật thành công! Vui lòng tải lại trang để thấy thay đổi.');
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('Có lỗi xảy ra khi cập nhật hồ sơ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
        if (!token) return;
        if (newQuantity < 1) return; // Prevent quantity < 1

        try {
            await cartApi.updateCart(itemId, newQuantity, token);
            fetchCart(); // Refresh cart
        } catch (e) {
            console.error(e);
            alert('Không thể cập nhật số lượng');
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        if (!token || !window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) return;

        try {
            await cartApi.removeFromCart(itemId, token);
            fetchCart();
        } catch (e) {
            console.error(e);
            alert('Không thể xóa sản phẩm');
        }
    };

    const handleCheckout = async () => {
        if (!token) return;
        const cartItems = cartData?.cart?.items || cartData?.items || [];
        if (!cartData || cartItems.length === 0) {
            alert('Giỏ hàng trống');
            return;
        }
        if (!user?.address && !address) {
            alert('Vui lòng cập nhật địa chỉ giao hàng trong phần Thông tin cá nhân trước khi thanh toán');
            setActiveTab('info');
            return;
        }

        try {
            setIsProcessing(true);
            
            // Create order from cart (server handles items and clearing cart)
            await orderApi.createOrderFromCart(address || user?.address || '', token);

            alert('Đặt hàng thành công!');
            fetchCart(); // Should be empty
            fetchOrders(); // Refresh orders
            setActiveTab('orders'); // Switch to orders tab
        } catch (e) {
            console.error(e);
            alert('Có lỗi xảy ra khi thanh toán');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentClick = (order: Order) => {
        setSelectedOrder(order);
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedOrder || !token) return;

        try {
            setIsProcessing(true);
            await paymentApi.createPayment(selectedOrder.id, 'qr', token);
            
            alert('Đã gửi xác nhận thanh toán! Vui lòng chờ admin phê duyệt.');
            setShowPaymentModal(false);
            setSelectedOrder(null);
            fetchOrders(); // Refresh orders
            fetchPayments(); // Refresh payments
        } catch (e) {
            console.error(e);
            alert('Có lỗi xảy ra khi xác nhận thanh toán');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!token) return;
        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
        try {
            setIsProcessing(true);
            await orderApi.cancelOrder(orderId, token);
            alert('Đã hủy đơn hàng thành công');
            fetchOrders();
        } catch (e) {
            console.error(e);
            alert('Không thể hủy đơn hàng');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const tabs = [
        { id: 'info', label: 'Thông tin cá nhân', icon: User },
        { id: 'cart', label: 'Giỏ hàng hiện tại', icon: ShoppingCart },
        { id: 'orders', label: 'Lịch sử đơn hàng', icon: Package },
        { id: 'payments', label: 'Lịch sử thanh toán', icon: CreditCard },
    ];

    if (!user) {
        return <div className="p-8 text-center">Vui lòng đăng nhập để xem hồ sơ.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 flex-shrink-0">
                    <div className="p-6 text-center border-b border-gray-100">
                        <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-3 overflow-hidden">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-amber-600">{user.full_name?.charAt(0) || user.username.charAt(0)}</span>
                            )}
                        </div>
                        <h2 className="font-bold text-gray-900 truncate">{user.full_name || user.username}</h2>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <nav className="p-4 space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
                                    signOut();
                                    window.location.reload();
                                }
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-4"
                        >
                            <LogOut size={18} />
                            Đăng xuất
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[800px]">

                    {/* Info Tab */}
                    {activeTab === 'info' && (
                        <div className="max-w-xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Thông tin cá nhân</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden relative">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-10 h-10 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            )}
                                        </div>
                                        <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2">
                                            <Camera size={16} />
                                            Thay đổi ảnh
                                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Nhập số điện thoại"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                                    <textarea
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Nhập địa chỉ giao hàng"
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
                                    <input
                                        type="text"
                                        value={user.username}
                                        disabled
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                </div>

                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Cart Tab */}
                    {activeTab === 'cart' && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Giỏ hàng hiện tại</h3>
                            {(() => {
                                const items = cartData?.cart?.items || cartData?.items || [];
                                return !cartData || items.length === 0;
                            })() ? (
                                <div className="text-center py-12 text-gray-500">
                                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Giỏ hàng trống</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(cartData?.cart?.items || cartData?.items || []).map((item: CartItem) => (
                                        <div key={item.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                                            <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={item.book.image_url || 'https://via.placeholder.com/150'} alt={item.book.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 line-clamp-1">{item.book.title}</h4>
                                                <p className="text-sm text-gray-500 mb-1">{item.book.author}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                <span className="text-amber-600 font-medium">
                                                    {item.book.price.toLocaleString('vi-VN')}₫
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center border border-gray-200 rounded-lg">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                            className="p-1 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                            className="p-1 hover:bg-gray-50 text-gray-600"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="text-red-500 hover:text-red-600 text-sm"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-gray-100 flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-900">Tổng cộng:</span>
                                        <span className="text-xl font-bold text-amber-600">
                                            {(cartData?.cart?.items || cartData?.items || []).reduce((sum: number, item: CartItem) => sum + item.book.price * item.quantity, 0).toLocaleString('vi-VN')}₫
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isProcessing}
                                        className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
                                    >
                                        {isProcessing ? 'Đang xử lý...' : 'Thanh toán'}
                                    </button>
                                </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Lịch sử đơn hàng</h3>
                            {orders.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Chưa có đơn hàng nào</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-900">Đơn hàng #{order.order_number}</p>
                                                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {order.status === 'pending' ? 'Chờ thanh toán' :
                                                            order.status === 'confirmed' ? 'Chờ xử lý' :
                                                                order.status === 'shipped' ? 'Đang chuyển hàng' :
                                                                    order.status === 'delivered' ? 'Đã nhận' :
                                                                        order.status === 'cancelled' ? 'Đã hủy' : order.status}
                                                    </span>
                                                    {order.status === 'pending' && (
                                                        <button
                                                            onClick={() => handlePaymentClick(order)}
                                                            className="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 transition-colors"
                                                        >
                                                            Thanh toán ngay
                                                        </button>
                                                    )}
                                                    {order.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleCancelOrder(order.id)}
                                                            disabled={isProcessing}
                                                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {isProcessing ? 'Đang hủy...' : 'Hủy đơn'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="space-y-3 mb-4">
                                                    {order.items?.map((item) => (
                                                        <div key={item.id} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">{item.book?.title} x {item.quantity}</span>
                                                            <span className="font-medium">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                                    <span className="text-sm text-gray-500">Tổng tiền</span>
                                                    <span className="font-bold text-amber-600">{order.total_amount.toLocaleString('vi-VN')}₫</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Lịch sử thanh toán</h3>
                            {payments.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Chưa có giao dịch thanh toán nào</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {payments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                                    }`}>
                                                    <CreditCard size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Thanh toán cho đơn #{payment.Order?.order_number}</p>
                                                    <p className="text-sm text-gray-500">{new Date(payment.created_at).toLocaleDateString('vi-VN')} - {payment.method === 'qr' ? 'QR Code' : payment.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{payment.amount.toLocaleString('vi-VN')}₫</p>
                                                <span className={`text-xs font-medium ${payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                                                    }`}>
                                                    {payment.status === 'completed' ? 'Thành công' : 'Đang xử lý'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {/* Payment Modal */}
                    {showPaymentModal && selectedOrder && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900">Thanh toán đơn hàng</h3>
                                    <button 
                                        onClick={() => setShowPaymentModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>
                                
                                <div className="p-6 space-y-6">
                                    <div className="text-center">
                                        <p className="text-gray-600 mb-2">Vui lòng quét mã QR bên dưới để thanh toán</p>
                                        <div className="bg-white p-4 rounded-xl border-2 border-amber-100 inline-block">
                                            <img 
                                                src={qrImage} 
                                                alt="QR Code Payment" 
                                                className="w-48 h-48 object-contain"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Mã đơn hàng:</span>
                                            <span className="font-mono font-bold text-gray-900">{selectedOrder.order_number}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Số tiền cần thanh toán:</span>
                                            <span className="font-bold text-amber-600 text-lg">
                                                {selectedOrder.total_amount.toLocaleString('vi-VN')}₫
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Nội dung chuyển khoản:</span>
                                            <span className="font-mono font-medium text-gray-900">{selectedOrder.order_number}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleConfirmPayment}
                                        disabled={isProcessing}
                                        className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            'Xác nhận đã thanh toán'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

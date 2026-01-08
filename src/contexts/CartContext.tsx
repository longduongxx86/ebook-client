import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartApi } from '../services/api';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string;
  book_id: string;
  quantity: number;
  book: {
    id: string;
    title: string;
    author: string;
    price: number;
    image_url: string | null;
    stock: number;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (bookId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  type CartAPIResponse = { cart?: { items: CartItem[] } } | { items: CartItem[] };

  const refreshCart = async () => {
    if (!user || !token) {
      setCartItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await cartApi.getCart(token) as CartAPIResponse;
      setCartItems((response as { cart?: { items: CartItem[] } }).cart?.items || (response as { items?: CartItem[] }).items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      refreshCart();
    } else {
      setCartItems([]);
    }
  }, [user, token]);

  const addToCart = async (bookId: string) => {
    if (!user || !token) throw new Error('Must be logged in');

    const existingItem = cartItems.find(item => item.book_id === bookId);

    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      try {
        await cartApi.addToCart(bookId, 1, token);
        await refreshCart();
      } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
      }
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!token) throw new Error('Must be logged in');

    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      await cartApi.updateCart(itemId, quantity, token);
      await refreshCart();
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!token) throw new Error('Must be logged in');

    try {
      await cartApi.removeFromCart(itemId, token);
      await refreshCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

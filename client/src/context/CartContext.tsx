import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cart, CartItem, Product } from '../types';
import { api } from '../lib/api';

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    try {
      const updatedCart = await api.addToCart(product.id, quantity);
      setCart(updatedCart);
    } catch (err) {
      console.error('Failed to add item to cart:', err);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }
      const updatedCart = await api.updateCartItem(itemId, quantity);
      setCart(updatedCart);
    } catch (err) {
      console.error('Failed to update cart item:', err);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const updatedCart = await api.removeCartItem(itemId);
      setCart(updatedCart);
    } catch (err) {
      console.error('Failed to remove item from cart:', err);
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      setCart((prev) => (prev ? { ...prev, items: [] } : null));
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const items = cart?.items || [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemCount,
        subtotal,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

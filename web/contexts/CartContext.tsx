'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface CartItem {
  id: string;
  title: string;
  author: string;
  price: number;
  cover_image?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const CartContext = createContext<{
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
} | null>(null);

// Helper functions for localStorage
const getCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    // Test if localStorage is available
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);

    const savedCart = localStorage.getItem('bookzone-cart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
    console.error('localStorage might be disabled or full');
  }
  return [];
};

const saveCartToStorage = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('bookzone-cart', JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

const clearCartFromStorage = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('bookzone-cart');
  } catch (error) {
    console.error('Error clearing cart from localStorage:', error);
  }
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const normalizedPayload = { ...action.payload, price: Number(action.payload.price) };
      const existingItem = state.items.find(item => item.id === normalizedPayload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === normalizedPayload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          total: state.total + normalizedPayload.price,
          itemCount: state.itemCount + 1,
        };
      }
      return {
        ...state,
        items: [...state.items, { ...normalizedPayload, quantity: 1 }],
        total: state.total + normalizedPayload.price,
        itemCount: state.itemCount + 1,
      };
    }
    case 'REMOVE_ITEM': {
      const item = state.items.find(item => item.id === action.payload);
      if (!item) return state;
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        total: state.total - (Number(item.price) * Number(item.quantity)),
        itemCount: state.itemCount - Number(item.quantity),
      };
    }
    case 'UPDATE_QUANTITY': {
      const item = state.items.find(item => item.id === action.payload.id);
      if (!item) return state;
      const quantityDiff = Number(action.payload.quantity) - Number(item.quantity);
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Number(action.payload.quantity) }
            : item
        ),
        total: state.total + (Number(item.price) * quantityDiff),
        itemCount: state.itemCount + quantityDiff,
      };
    }
    case 'CLEAR_CART':
      return {
        items: [],
        total: 0,
        itemCount: 0,
      };
    case 'LOAD_CART':
      // Ensure all prices are numbers
      const normalizedItems = action.payload.map(item => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity)
      }));
      const total = normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
      return {
        items: normalizedItems,
        total,
        itemCount,
      };
    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedItems = getCartFromStorage();
    if (savedItems.length > 0) {
      console.log('Loading cart from localStorage:', savedItems);
      dispatch({ type: 'LOAD_CART', payload: savedItems });
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (state.items.length > 0) {
      console.log('Saving cart to localStorage:', state.items);
      saveCartToStorage(state.items);
    } else {
      clearCartFromStorage();
    }
  }, [state.items]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    console.log('Adding item to cart:', item);
    dispatch({ type: 'ADD_ITEM', payload: { ...item, price: Number(item.price), quantity: 1 } });
  };

  const removeItem = (id: string) => {
    console.log('Removing item from cart:', id);
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    console.log('Updating quantity for item:', id, 'to:', quantity);
    if (quantity <= 0) {
      removeItem(id);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
  };

  const clearCart = () => {
    console.log('Clearing cart');
    dispatch({ type: 'CLEAR_CART' });
    clearCartFromStorage();
  };

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, updateQuantity, clearCart }}>
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

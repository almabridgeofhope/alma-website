import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ProjectItem } from '@/services/clientGoogleSheetsService';

export interface CartItem {
  id: string;
  type: 'item' | 'phase';
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  category: string;
  phase?: string;
  imageUrl?: string;
  projectName?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalAmount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity' | 'totalPrice'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  isOpen: false,
  totalItems: 0,
  totalAmount: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0),
        };
      } else {
        const newItem: CartItem = {
          ...action.payload,
          quantity: 1,
          totalPrice: action.payload.unitPrice,
        };
        
        const updatedItems = [...state.items, newItem];
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0),
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: action.payload.id });
      }
      
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? {
              ...item,
              quantity: action.payload.quantity,
              totalPrice: action.payload.quantity * item.unitPrice,
            }
          : item
      );
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0),
      };
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalAmount: 0,
      };
    
    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };
    
    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false,
      };
    
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload,
        totalItems: action.payload.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: action.payload.reduce((sum, item) => sum + item.totalPrice, 0),
      };
    
    default:
      return state;
  }
}

interface ShoppingCartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity' | 'totalPrice'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  formatCurrency: (amount: number) => string;
  isItemInCart: (id: string) => boolean;
  removeFromCart: (id: string) => void;
  addItemPiece: (item: ProjectItem) => void;
  removeItemPiece: (itemId: string) => void;
  getItemCartQuantity: (itemId: string) => number;
  isItemFullyInCart: (item: ProjectItem) => boolean;
}

const ShoppingCartContext = createContext<ShoppingCartContextType | undefined>(undefined);

export const ShoppingCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('alma-shopping-cart');
    if (savedCart) {
      try {
        const cartItems: CartItem[] = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('alma-shopping-cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (item: Omit<CartItem, 'quantity' | 'totalPrice'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    // Auto-open cart when first item is added
    if (state.items.length === 0) {
      dispatch({ type: 'TOGGLE_CART' });
    }
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isItemInCart = (id: string) => {
    return state.items.some(item => item.id === id);
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const addItemPiece = (item: ProjectItem) => {
    const cartItemId = `item-${item.itemId}`;
    const existingItem = state.items.find(cartItem => cartItem.id === cartItemId);
    
    if (existingItem) {
      // Increase quantity by 1
      updateQuantity(cartItemId, existingItem.quantity + 1);
    } else {
      // Add new item with quantity 1
      addItem({
        id: cartItemId,
        type: 'item',
        name: item.displayName,
        description: item.blurb || `${item.category} - ${item.phase}`,
        unitPrice: item.unitCostEUR,
        category: item.category,
        phase: item.phase,
        imageUrl: item.imageUrl,
        projectName: '', // Will be set by the calling component
      });
    }
  };

  const removeItemPiece = (itemId: string) => {
    const cartItemId = `item-${itemId}`;
    const existingItem = state.items.find(cartItem => cartItem.id === cartItemId);
    
    if (existingItem) {
      if (existingItem.quantity > 1) {
        updateQuantity(cartItemId, existingItem.quantity - 1);
      } else {
        removeItem(cartItemId);
      }
    }
  };

  const getItemCartQuantity = (itemId: string) => {
    const cartItemId = `item-${itemId}`;
    const existingItem = state.items.find(cartItem => cartItem.id === cartItemId);
    return existingItem ? existingItem.quantity : 0;
  };

  const isItemFullyInCart = (item: ProjectItem) => {
    const cartQuantity = getItemCartQuantity(item.itemId);
    return cartQuantity >= item.qtyNeededTotal;
  };

  const value: ShoppingCartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    closeCart,
    formatCurrency,
    isItemInCart,
    removeFromCart,
    addItemPiece,
    removeItemPiece,
    getItemCartQuantity,
    isItemFullyInCart,
  };

  return (
    <ShoppingCartContext.Provider value={value}>
      {children}
    </ShoppingCartContext.Provider>
  );
};

export const useShoppingCart = () => {
  const context = useContext(ShoppingCartContext);
  if (context === undefined) {
    throw new Error('useShoppingCart must be used within a ShoppingCartProvider');
  }
  return context;
};

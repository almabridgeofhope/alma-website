import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ProjectItem } from '@/services/projectCostsService';
import { useLanguage } from '@/contexts/LanguageContext';
import { CartItem, CartState, cartReducer, initialState } from '@/contexts/cartReducer';

export type { CartItem } from '@/contexts/cartReducer';

interface ShoppingCartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity' | 'totalPrice'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateAmount: (id: string, amount: number) => void; // For general donations
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  formatCurrency: (amount: number) => string;
  isItemInCart: (id: string) => boolean;
  removeFromCart: (id: string) => void;
  addItemPiece: (item: ProjectItem, projectName?: string) => void;
  addItemMax: (item: ProjectItem, projectName?: string) => void; // Add item with maximum available quantity
  removeItemPiece: (itemId: string) => void;
  getItemCartQuantity: (itemId: string) => number;
  isItemFullyInCart: (item: ProjectItem) => boolean;
  addOrUpdateGeneralDonation: (amount: number) => void; // Add or update general donation
  getGeneralDonation: () => CartItem | undefined; // Get general donation item if exists
}

const ShoppingCartContext = createContext<ShoppingCartContextType | undefined>(undefined);

export const ShoppingCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { language, t } = useLanguage();
  
  // Helper functions to get translated item fields
  const getItemDisplayName = (item: ProjectItem): string => {
    if (language === 'de' && item.displayNameDe) {
      return item.displayNameDe;
    }
    return item.displayName;
  };
  
  const getItemCategory = (item: ProjectItem): string => {
    if (language === 'de' && item.categoryDe) {
      return item.categoryDe;
    }
    return item.category || '';
  };
  
  const getItemBlurb = (item: ProjectItem): string => {
    if (language === 'de' && item.blurbDe) {
      return item.blurbDe;
    }
    return item.blurb || '';
  };
  
  const getItemPhaseName = (item: ProjectItem): string => {
    if (language === 'de' && item.phaseDe) {
      return item.phaseDe;
    }
    return item.phase;
  };

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
    // Only add to cart. Do NOT auto-open; opening is done explicitly by UI (CTA).
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    const item = state.items.find(cartItem => cartItem.id === id);
    if (item && item.maxQuantity && quantity > item.maxQuantity) {
      quantity = item.maxQuantity;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const updateAmount = (id: string, amount: number) => {
    dispatch({ type: 'UPDATE_AMOUNT', payload: { id, amount } });
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

  const addItemPiece = (item: ProjectItem, projectName?: string) => {
    const cartItemId = `item-${item.itemId}`;
    const existingItem = state.items.find(cartItem => cartItem.id === cartItemId);
    const remainingNeeded = item.qtyNeededTotal - item.qtyFunded;
    
    if (existingItem) {
      // Check if we can add more items
      if (existingItem.quantity < remainingNeeded) {
        updateQuantity(cartItemId, existingItem.quantity + 1);
      }
      // Update projectName if it was not set before
      if (projectName && !existingItem.projectName) {
        const updatedItems = state.items.map(cartItem =>
          cartItem.id === cartItemId
            ? { ...cartItem, projectName }
            : cartItem
        );
        dispatch({ type: 'LOAD_CART', payload: updatedItems });
      }
    } else {
      // Add new item with quantity 1
      const nameEn = item.displayName;
      const nameDe = item.displayNameDe || item.displayName;
      const descriptionEn = item.blurb || `${item.category || ''} - ${item.phase || ''}`;
      const descriptionDe = item.blurbDe || item.blurb || `${item.categoryDe || item.category || ''} - ${item.phaseDe || item.phase || ''}`;
      
      addItem({
        id: cartItemId,
        type: 'item',
        name: getItemDisplayName(item),
        description: getItemBlurb(item) || `${getItemCategory(item)} - ${getItemPhaseName(item)}`,
        unitPrice: item.unitCostEUR,
        category: getItemCategory(item),
        phase: item.phase,
        imageUrl: item.imageUrl,
        projectName: projectName || '',
        maxQuantity: remainingNeeded,
        itemId: item.itemId, // Store original itemId for translation lookup
        nameDe: nameDe,
        nameEn: nameEn,
        descriptionDe: descriptionDe,
        descriptionEn: descriptionEn,
      });
    }
  };

  const addItemMax = (item: ProjectItem, projectName?: string) => {
    const cartItemId = `item-${item.itemId}`;
    const existingItem = state.items.find(cartItem => cartItem.id === cartItemId);
    const remainingNeeded = item.qtyNeededTotal - item.qtyFunded;
    const cartQuantity = existingItem ? existingItem.quantity : 0;
    const maxToAdd = remainingNeeded - cartQuantity;
    
    if (maxToAdd <= 0) {
      return; // Already at max or nothing needed
    }
    
    if (existingItem) {
      // Update to maximum quantity
      updateQuantity(cartItemId, remainingNeeded);
      // Update projectName if it was not set before
      if (projectName && !existingItem.projectName) {
        const updatedItems = state.items.map(cartItem =>
          cartItem.id === cartItemId
            ? { ...cartItem, projectName }
            : cartItem
        );
        dispatch({ type: 'LOAD_CART', payload: updatedItems });
      }
    } else {
      // Add new item with maximum quantity
      const nameEn = item.displayName;
      const nameDe = item.displayNameDe || item.displayName;
      const descriptionEn = item.blurb || `${item.category || ''} - ${item.phase || ''}`;
      const descriptionDe = item.blurbDe || item.blurb || `${item.categoryDe || item.category || ''} - ${item.phaseDe || item.phase || ''}`;
      
      addItem({
        id: cartItemId,
        type: 'item',
        name: getItemDisplayName(item),
        description: getItemBlurb(item) || `${getItemCategory(item)} - ${getItemPhaseName(item)}`,
        unitPrice: item.unitCostEUR,
        category: getItemCategory(item),
        phase: item.phase,
        imageUrl: item.imageUrl,
        projectName: projectName || '',
        maxQuantity: remainingNeeded,
        itemId: item.itemId, // Store original itemId for translation lookup
        nameDe: nameDe,
        nameEn: nameEn,
        descriptionDe: descriptionDe,
        descriptionEn: descriptionEn,
      });
      // Set quantity to maximum
      updateQuantity(cartItemId, remainingNeeded);
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

  const addOrUpdateGeneralDonation = (amount: number) => {
    const generalDonationId = 'general-donation';
    const existingDonation = state.items.find(item => item.id === generalDonationId);
    
    if (existingDonation) {
      updateAmount(generalDonationId, amount);
    } else {
      addItem({
        id: generalDonationId,
        type: 'general-donation',
        name: t("projectItems.unrestrictedDonation.title"),
        description: t("projectItems.unrestrictedDonation.description"),
        unitPrice: amount,
        category: 'donation',
        isEditable: true,
      });
    }
  };

  const getGeneralDonation = () => {
    return state.items.find(item => item.id === 'general-donation');
  };

  const value: ShoppingCartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    updateAmount,
    clearCart,
    toggleCart,
    closeCart,
    formatCurrency,
    isItemInCart,
    removeFromCart,
    addItemPiece,
    addItemMax,
    removeItemPiece,
    getItemCartQuantity,
    isItemFullyInCart,
    addOrUpdateGeneralDonation,
    getGeneralDonation,
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

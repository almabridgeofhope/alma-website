// Zustand des Warenkorbs auf der Spendenseite: Positionen, Mengen und Summen in EUR.
// Als eigenes Modul, damit die Rechenregeln ohne React testbar sind (cartReducer.test.ts).

export interface CartItem {
  id: string;
  type: 'item' | 'phase' | 'general-donation';
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  category: string;
  phase?: string;
  imageUrl?: string;
  projectName?: string;
  maxQuantity?: number; // Maximum quantity that can be added (remaining needed)
  // For general donations, we can directly set the amount
  isEditable?: boolean; // If true, the amount can be edited directly (for general donations)
  itemId?: string; // Original itemId for translation lookup (for type 'item')
  // Store translations for immediate display without waiting for ProjectCosts to load
  nameDe?: string; // German name
  nameEn?: string; // English name
  descriptionDe?: string; // German description
  descriptionEn?: string; // English description
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalAmount: number;
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity' | 'totalPrice'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_AMOUNT'; payload: { id: string; amount: number } } // For general donations
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

export const initialState: CartState = {
  items: [],
  isOpen: false,
  totalItems: 0,
  totalAmount: 0,
};

export function cartReducer(state: CartState, action: CartAction): CartState {
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
          totalItems: updatedItems.length,
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
          totalItems: updatedItems.length,
          totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0),
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.length,
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
        totalItems: updatedItems.length,
        totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0),
      };
    }
    
    case 'UPDATE_AMOUNT': {
      if (action.payload.amount <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: action.payload.id });
      }
      
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? {
              ...item,
              totalPrice: action.payload.amount,
              unitPrice: action.payload.amount, // For general donations, unitPrice = totalPrice
              // Update name if it's still the old name
              name: item.type === 'general-donation' && item.name === 'Allgemeine Spende' 
                ? 'Wirkungsorientierte Spende' 
                : item.name,
              description: item.type === 'general-donation' && item.name === 'Allgemeine Spende'
                ? 'Wirkungsorientierte Spende für unsere Projekte'
                : item.description,
            }
          : item
      );
      
      return {
        ...state,
        items: updatedItems,
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
        totalItems: action.payload.length,
        totalAmount: action.payload.reduce((sum, item) => sum + item.totalPrice, 0),
      };
    
    default:
      return state;
  }
}

// Zustand des Warenkorbs auf der Spendenseite: Positionen, Mengen und Summen in EUR.
// Als eigenes Modul, damit die Rechenregeln ohne React testbar sind (cartReducer.test.ts).
//
// Geldbeträge stehen auf ganze Cent gerundet im Zustand. Gerundet wird nur über die beiden Helfer
// hier: Beträge und Positionssummen über aufCent, die Gesamtsumme über summeInCent. Wer totalPrice
// oder totalAmount liest (form-submit, Erfolgs-URL, Überweisungsdaten, Stripe, PayPal, Anzeige),
// bekommt fertige Cent-Werte.

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

/** Rundet einen EUR-Betrag auf ganze Cent, wie stripeService (`Math.round(amount * 100)`). */
export const aufCent = (eur: number): number => Math.round(eur * 100) / 100;

/** Summiert EUR-Beträge in ganzen Cent: 10,10 + 20,20 ergibt 30,30 statt 30.299999999999997. */
export const summeInCent = (betraege: number[]): number =>
  betraege.reduce((cent, eur) => cent + Math.round(eur * 100), 0) / 100;

const gesamtsumme = (items: CartItem[]): number => summeInCent(items.map(item => item.totalPrice));

/** Die freie Spende hieß früher „Allgemeine Spende“; beim nächsten Betrag bekommt sie den neuen Namen. */
const wirdUmbenannt = (item: CartItem): boolean =>
  item.type === 'general-donation' && item.name === 'Allgemeine Spende';

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
                totalPrice: aufCent((item.quantity + 1) * item.unitPrice),
              }
            : item
        );
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.length,
          totalAmount: gesamtsumme(updatedItems),
        };
      } else {
        const unitPrice = aufCent(action.payload.unitPrice);
        const newItem: CartItem = {
          ...action.payload,
          unitPrice,
          quantity: 1,
          totalPrice: unitPrice,
        };
        
        const updatedItems = [...state.items, newItem];
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.length,
          totalAmount: gesamtsumme(updatedItems),
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.length,
        totalAmount: gesamtsumme(updatedItems),
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
              totalPrice: aufCent(action.payload.quantity * item.unitPrice),
            }
          : item
      );
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.length,
        totalAmount: gesamtsumme(updatedItems),
      };
    }
    
    case 'UPDATE_AMOUNT': {
      const amount = aufCent(action.payload.amount);
      if (amount <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: action.payload.id });
      }

      // Derselbe Betrag auf Cent ändert nichts: kein neues items-Array, sonst laufen Effekte, die
      // auf cartState.items hören (Spende aus ?amount= in Donation.tsx), ohne Ende neu.
      const bisher = state.items.find(item => item.id === action.payload.id);
      if (!bisher || (bisher.totalPrice === amount && bisher.unitPrice === amount && !wirdUmbenannt(bisher))) {
        return state;
      }
      
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? {
              ...item,
              totalPrice: amount,
              unitPrice: amount, // For general donations, unitPrice = totalPrice
              // Update name if it's still the old name
              name: wirdUmbenannt(item) ? 'Wirkungsorientierte Spende' : item.name,
              description: wirdUmbenannt(item) ? 'Wirkungsorientierte Spende für unsere Projekte' : item.description,
            }
          : item
      );
      
      return {
        ...state,
        items: updatedItems,
        totalAmount: gesamtsumme(updatedItems),
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
    
    case 'LOAD_CART': {
      // Gespeicherte Warenkörbe von vor der Cent-Rundung können krumme Beträge enthalten.
      const items = action.payload.map(item => ({
        ...item,
        unitPrice: aufCent(item.unitPrice),
        totalPrice: aufCent(item.totalPrice),
      }));
      return {
        ...state,
        items,
        totalItems: items.length,
        totalAmount: gesamtsumme(items),
      };
    }
    
    default:
      return state;
  }
}

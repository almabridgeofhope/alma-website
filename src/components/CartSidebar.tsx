import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight,
  Package,
  Sprout,
  Droplets,
  Wheat
} from 'lucide-react';
import { useShoppingCart, CartItem } from '@/contexts/ShoppingCartContext';
import { Link } from 'react-router-dom';

interface CartSidebarProps {
  className?: string;
  basePath?: string;
}

const getPhaseIcon = (phase: string) => {
  switch (phase?.toLowerCase()) {
    case 'planning':
      return <Sprout className="w-4 h-4 text-green-600" />;
    case 'implementation':
      return <Droplets className="w-4 h-4 text-blue-600" />;
    case 'impact':
      return <Wheat className="w-4 h-4 text-yellow-600" />;
    default:
      return <Package className="w-4 h-4 text-gray-600" />;
  }
};

const CartItemComponent: React.FC<{ item: CartItem }> = ({ item }) => {
  const { updateQuantity, removeItem, formatCurrency } = useShoppingCart();

  return (
    <Card className="p-3 mb-2">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
          {item.type === 'phase' ? getPhaseIcon(item.phase || '') : <Package className="w-4 h-4 text-gray-600" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {item.name}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(item.id)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          {item.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="h-6 w-6 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-sm font-medium w-8 text-center">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={item.type === 'phase' && item.quantity >= 1}
                className="h-6 w-6 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(item.totalPrice)}
              </div>
              <div className="text-xs text-gray-600">
                {formatCurrency(item.unitPrice)} / Stück
              </div>
            </div>
          </div>

          {/* Phase Badge */}
          {item.phase && (
            <div className="flex items-center gap-1 mt-2">
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {item.phase}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export const CartSidebar: React.FC<CartSidebarProps> = ({ className, basePath = "" }) => {
  const { state, closeCart, formatCurrency } = useShoppingCart();

  // Don't close cart when clicking backdrop if there are items - allow continued shopping
  const handleBackdropClick = () => {
    // Only close cart if it's empty, don't interfere with popup
    if (state.items.length === 0) {
      closeCart();
    }
  };

  if (!state.isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[60] pointer-events-none ${className}`}>
      {/* No backdrop to avoid interfering with popup */}
      
      {/* Sidebar positioned next to popup */}
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Warenkorb</h2>
            <Badge variant="secondary" className="text-xs">
              {state.totalItems}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeCart}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {state.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ihr Warenkorb ist leer
                </h3>
                <p className="text-gray-600 mb-4">
                  Fügen Sie Items oder Bauphasen hinzu, um zu spenden
                </p>
                <Button onClick={closeCart} variant="outline">
                  Weiter einkaufen
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Items List */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2 pr-2">
                  {state.items.map((item) => (
                    <CartItemComponent key={item.id} item={item} />
                  ))}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="border-t p-4 space-y-4 flex-shrink-0">
                <Separator />
                
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Gesamtbetrag:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(state.totalAmount)}
                  </span>
                </div>

                {/* Checkout Button */}
                <Link to={basePath + "/donation"} onClick={closeCart} className="block">
                  <Button className="w-full" size="lg">
                    <span>Zur Spende</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

                <p className="text-xs text-gray-600 text-center">
                  Sie werden zur Spenden-Seite weitergeleitet, um Ihre Spende abzuschließen
                </p>
                <p className="text-xs text-blue-600 text-center mt-2">
                  💡 Sie können weiter shoppen, während der Warenkorb geöffnet ist
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Cart Badge Component for Header
export const CartBadge: React.FC = () => {
  const { state, toggleCart } = useShoppingCart();

  if (state.totalItems === 0) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleCart}
      className="relative"
    >
      <ShoppingCart className="w-4 h-4" />
      <Badge 
        variant="destructive" 
        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
      >
        {state.totalItems}
      </Badge>
    </Button>
  );
};

// Combined Donate/Cart Button Component
export const DonateCartButton: React.FC<{ basePath?: string }> = ({ basePath = "" }) => {
  const { state } = useShoppingCart();

  // Always show donate button that goes directly to donation page
  return (
    <Link to={basePath + "/donation"} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
        Spenden
      </Button>
    </Link>
  );
};

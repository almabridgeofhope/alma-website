import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Wheat,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { useShoppingCart, CartItem } from '@/contexts/ShoppingCartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

const CartItemComponent: React.FC<{ item: CartItem; onClose?: () => void }> = ({ item, onClose }) => {
  const { updateQuantity, removeItem, formatCurrency, closeCart } = useShoppingCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleItemClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or controls
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Only navigate for item types (not phase or general-donation)
    if (item.type !== 'item') {
      return;
    }
    
    // Navigate to projects page with phase hash and itemId to open modal and show the item
    if (item.phase) {
      // Extract itemId from cart item id (format: "item-{itemId}")
      const itemId = item.id.replace('item-', '');
      
      // Close cart drawer if open
      if (onClose) {
        onClose();
      } else {
        closeCart();
      }
      
      // Navigate to projects page with phase hash and itemId as query param
      navigate(`/dev/projects?itemId=${encodeURIComponent(itemId)}#${encodeURIComponent(item.phase)}`);
      
      // Scroll to item after modal opens - use a longer delay and retry mechanism
      let attempts = 0;
      const maxAttempts = 10;
      const scrollToItem = () => {
        attempts++;
        const element = document.querySelector(`[data-item-id="${itemId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (attempts < maxAttempts) {
          setTimeout(scrollToItem, 200);
        }
      };
      setTimeout(scrollToItem, 800);
    } else {
      // For items without phase, just navigate to projects
      navigate('/dev/projects');
      if (onClose) {
        onClose();
      } else {
        closeCart();
      }
    }
  };

  return (
    <Card className="p-3 mb-2 cursor-pointer hover:bg-gray-50 transition-colors w-full" onClick={handleItemClick}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
          {item.type === 'phase' ? getPhaseIcon(item.phase || '') : <Package className="w-4 h-4 text-gray-600" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {item.description && item.type !== 'general-donation' ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <h4 className="font-medium text-sm text-gray-900 truncate cursor-pointer hover:text-primary transition-colors">
                      {item.name}
                    </h4>
                  </TooltipTrigger>
                  <TooltipContent 
                    className="max-w-xs z-[9999]" 
                    side="top"
                    sideOffset={5}
                  >
                    <p className="text-sm">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <h4 className="font-medium text-sm text-gray-900 truncate">
                  {item.type === 'general-donation' ? t("donation.form.unrestrictedDonation") : item.name}
                </h4>
              )}
              {item.type === 'general-donation' && (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent 
                    className="max-w-xs z-[9999]" 
                    side="top"
                    sideOffset={5}
                  >
                    <p className="text-sm">
                      {t("donation.form.generalDonation.info")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {item.projectName && item.type === 'item' && (
                <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                removeItem(item.id);
              }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 flex-shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(item.id, item.quantity - 1);
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.maxQuantity && item.quantity < item.maxQuantity) {
                    updateQuantity(item.id, item.quantity + 1);
                  }
                }}
                disabled={item.type === 'phase' && item.quantity >= 1 || (item.maxQuantity && item.quantity >= item.maxQuantity)}
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

        </div>
      </div>
    </Card>
  );
};

export const CartSidebar: React.FC<CartSidebarProps> = ({ className, basePath = "" }) => {
  const { state, closeCart, formatCurrency } = useShoppingCart();
  const { t } = useLanguage();

  // Lock body scroll while cart is open and render overlay at top layer
  useEffect(() => {
    if (state.isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [state.isOpen]);

  // Don't close cart when clicking backdrop if there are items - allow continued shopping
  const handleBackdropClick = () => {
    // Only close cart if it's empty, don't interfere with popup
    if (state.items.length === 0) {
      closeCart();
    }
  };

  if (!state.isOpen) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[9999] pointer-events-auto overscroll-none ${className}`}>
      {/* Backdrop to block interactions and allow closing by click */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={closeCart}
      />
      
      {/* Sidebar positioned on the right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[85vh] w-full max-w-sm md:max-w-none md:w-[33.333vw] md:min-w-[360px] bg-white shadow-xl flex flex-col min-h-0 overflow-hidden pointer-events-auto overscroll-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-none">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("donation.form.cart")}</h2>
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
        <div className="flex-1 flex flex-col min-h-0">
          {state.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("donation.cart.empty")}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t("donation.cart.emptyDesc")}
                </p>
                <Button onClick={closeCart} variant="outline">
                  {t("donation.cart.continueShopping")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Items List - native scrolling for better trackpad/touch support */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4" style={{ WebkitOverflowScrolling: 'touch' as any, overscrollBehaviorY: 'contain', touchAction: 'pan-y' }}>
                <div className="space-y-2 pr-2">
                  {state.items.map((item) => (
                    <CartItemComponent key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-4 space-y-4 flex-shrink-0">
                
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{t("donation.cart.total")}</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(state.totalAmount)}
                  </span>
                </div>

                {/* Checkout Button */}
                <Link to={basePath + "/donation"} onClick={closeCart} className="block">
                  <Button className="w-full" size="lg">
                    <span>{t("donation.cart.toDonation")}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
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

// Inline Cart panel (for embedding inside modals/pages, no overlay/portal)
export const CartInline: React.FC<{ basePath?: string; className?: string; onClose?: () => void }> = ({ basePath = "", className = "", onClose }) => {
  const { state, closeCart, formatCurrency } = useShoppingCart();
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeCart();
    }
  };

  return (
    <div className={`bg-muted/40 h-full flex flex-col min-h-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Warenkorb</h2>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {state.totalItems}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-7 w-7 p-0 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-muted/30">
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
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 overscroll-contain">
              <div className="space-y-2 pr-1">
                {state.items.map((item) => (
                  <CartItemComponent key={item.id} item={item} onClose={onClose} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-3 space-y-3 flex-shrink-0 bg-white shadow-sm">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Gesamtbetrag:</span>
                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(state.totalAmount)}
                </span>
              </div>
              {/* Checkout Button */}
              <Link to={basePath + "/donation"} onClick={handleClose} className="block">
                <Button className="w-full" size="lg">
                  <span>Zur Spende</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
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

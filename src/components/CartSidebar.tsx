import React, { useEffect, useState } from 'react';
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
  HelpCircle,
  BrickWall,
  Layers,
  Zap,
  Toilet,
  Shield,
  Sofa,
  Paintbrush
} from 'lucide-react';
import { useShoppingCart, CartItem } from '@/contexts/ShoppingCartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useProjectCosts } from '@/hooks/useProjectCosts';
import { ProjectItem } from '@/services/clientGoogleSheetsService';
import { Input } from '@/components/ui/input';

interface CartSidebarProps {
  className?: string;
  basePath?: string;
}

const getPhaseIcon = (phase: string) => {
  const phaseLower = phase?.toLowerCase() || '';
  
  // General project phases
  switch (phaseLower) {
    case 'planning':
      return <Sprout className="w-4 h-4 text-green-600" />;
    case 'implementation':
      return <Droplets className="w-4 h-4 text-blue-600" />;
    case 'impact':
      return <Wheat className="w-4 h-4 text-yellow-600" />;
  }
  
  // Construction phases
  if (phaseLower.includes('security')) {
    return <Shield className="w-4 h-4 text-gray-600" />;
  }
  if ((phaseLower.includes('outer') && phaseLower.includes('walls')) || 
      (phaseLower.includes('outer') && phaseLower.includes('floor')) ||
      (phaseLower.includes('walls') && phaseLower.includes('flooring'))) {
    return <BrickWall className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('foundation') && phaseLower.includes('sealing')) {
    return <Layers className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('water') && phaseLower.includes('system')) {
    return <Droplets className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('septic') || phaseLower.includes('soak')) {
    return <Droplets className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('interior') && phaseLower.includes('furniture')) {
    return <Sofa className="w-4 h-4 text-gray-600" />;
  }
  if ((phaseLower.includes('interior') && phaseLower.includes('walls')) || 
      phaseLower.includes('innenwände')) {
    return <Paintbrush className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('electricity') && phaseLower.includes('lighting')) {
    return <Zap className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('bathroom') && phaseLower.includes('sanitary')) {
    return <Toilet className="w-4 h-4 text-gray-600" />;
  }
  
  // Fallbacks
  if (phaseLower.includes('outer') || (phaseLower.includes('walls') && phaseLower.includes('floor'))) {
    return <BrickWall className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('foundation') || phaseLower.includes('sealing')) {
    return <Layers className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('water')) {
    return <Droplets className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('interior') && phaseLower.includes('finishing')) {
    return <Paintbrush className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('electricity') || phaseLower.includes('lighting')) {
    return <Zap className="w-4 h-4 text-gray-600" />;
  }
  if (phaseLower.includes('bathroom') || phaseLower.includes('sanitary')) {
    return <Toilet className="w-4 h-4 text-gray-600" />;
  }
  
  return <Package className="w-4 h-4 text-gray-600" />;
};

const CartItemComponent: React.FC<{ item: CartItem; onClose?: () => void }> = ({ item, onClose }) => {
  const { updateQuantity, removeItem, formatCurrency, closeCart, updateAmount } = useShoppingCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { getProjectCost } = useProjectCosts();
  const [amountInput, setAmountInput] = useState<string>(item.type === 'general-donation' ? (item.totalPrice > 0 ? item.totalPrice.toString() : '') : '');
  
  // Get translated name and description for items
  const getTranslatedName = (): string => {
    if (item.type === 'general-donation') {
      return t("donation.form.unrestrictedDonation");
    }
    
    // First try to use stored translations (available immediately, no need to wait for ProjectCosts)
    if (item.type === 'item') {
      if (language === 'de' && item.nameDe) {
        return item.nameDe;
      }
      if (language === 'en' && item.nameEn) {
        return item.nameEn;
      }
    }
    
    // Fallback: try to get the original item data and translate it (if ProjectCosts are loaded)
    if (item.type === 'item' && item.itemId && item.projectName) {
      const projectCost = getProjectCost(item.projectName);
      if (projectCost) {
        const originalItem = projectCost.items.find(i => i.itemId === item.itemId);
        if (originalItem) {
          if (language === 'de' && originalItem.displayNameDe) {
            return originalItem.displayNameDe;
          }
          return originalItem.displayName;
        }
      }
    }
    
    // Final fallback to stored name
    return item.name;
  };
  
  const getTranslatedDescription = (): string => {
    if (item.type === 'general-donation') {
      return t("donation.form.generalDonation.info");
    }
    
    // First try to use stored translations (available immediately, no need to wait for ProjectCosts)
    if (item.type === 'item') {
      if (language === 'de' && item.descriptionDe) {
        return item.descriptionDe;
      }
      if (language === 'en' && item.descriptionEn) {
        return item.descriptionEn;
      }
    }
    
    // Fallback: try to get the original item data and translate it (if ProjectCosts are loaded)
    if (item.type === 'item' && item.itemId && item.projectName) {
      const projectCost = getProjectCost(item.projectName);
      if (projectCost) {
        const originalItem = projectCost.items.find(i => i.itemId === item.itemId);
        if (originalItem) {
          const blurb = language === 'de' && originalItem.blurbDe ? originalItem.blurbDe : originalItem.blurb;
          const category = language === 'de' && originalItem.categoryDe ? originalItem.categoryDe : originalItem.category;
          const phase = language === 'de' && originalItem.phaseDe ? originalItem.phaseDe : originalItem.phase;
          return blurb || `${category} - ${phase}`;
        }
      }
    }
    
    // Final fallback to stored description
    return item.description;
  };
  
  const displayName = getTranslatedName();
  const displayDescription = getTranslatedDescription();

  // Update amount input when item changes
  useEffect(() => {
    if (item.type === 'general-donation') {
      setAmountInput(item.totalPrice > 0 ? item.totalPrice.toString() : '');
    }
  }, [item.totalPrice, item.type]);

  // Handle amount change for general donations
  const handleAmountChange = (value: string) => {
    // Allow empty, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmountInput(value);
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        updateAmount(item.id, numValue);
      } else if (value === '') {
        // Set to 0 if empty
        updateAmount(item.id, 0);
      }
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or controls
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Only navigate for item types (not phase or general-donation)
    if (item.type !== 'item') {
      return;
    }
    
    // Navigate to projects page with phase hash to show phase overview
    if (item.phase) {
      // Close cart drawer if open
      if (onClose) {
        onClose();
      } else {
        closeCart();
      }
      
      // Navigate to projects page with phase hash to show phase in overview
      navigate(`/projects#${encodeURIComponent(item.phase)}`);
    } else {
      // For items without phase, just navigate to projects
      navigate('/projects');
      if (onClose) {
        onClose();
      } else {
        closeCart();
      }
    }
  };

  return (
    <Card className={`p-3 mb-2 transition-colors w-full ${item.type === 'general-donation' ? '' : 'cursor-pointer hover:bg-gray-50'}`} onClick={item.type === 'general-donation' ? undefined : handleItemClick}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
          {item.type === 'phase' ? getPhaseIcon(item.phase || '') : <Package className="w-4 h-4 text-gray-600" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-visible">
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h4 className="font-medium text-sm text-gray-900 truncate">
                {displayName}
              </h4>
              {displayDescription && item.type !== 'general-donation' && (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent 
                    className="max-w-xs z-[9999]" 
                    side="top"
                    sideOffset={5}
                  >
                    <p className="text-sm">{displayDescription}</p>
                  </TooltipContent>
                </Tooltip>
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
            </div>
          </div>

          {item.type === 'general-donation' ? (
            /* Amount Input for General Donations */
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <label className="text-xs text-gray-600 mb-1 block">
                  {t("projectItems.unrestrictedDonation.amount")}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("projectItems.unrestrictedDonation.placeholder")}
                  value={amountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={() => {
                    if (amountInput === '' || parseFloat(amountInput) <= 0) {
                      setAmountInput('');
                      updateAmount(item.id, 0);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  className="h-9 text-sm w-full"
                  autoFocus={item.totalPrice === 0}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
                className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 flex-shrink-0 mt-6"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.totalPrice)}
                </div>
                <div className="text-xs text-gray-600">
                  {formatCurrency(item.unitPrice)} {t("cart.perPiece")}
                </div>
              </div>

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
            </div>
          )}

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
                <div className="flex flex-col gap-2">
                  <Link to={basePath + "/donation"} onClick={closeCart} className="block">
                    <Button className="w-full">
                      {t("donation.cart.donateFreeAmount")}
                    </Button>
                  </Link>
                  <Button onClick={closeCart} variant="outline">
                    {t("donation.cart.continueShopping")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Items List - native scrolling for better trackpad/touch support */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4" style={{ WebkitOverflowScrolling: 'touch' as any, overscrollBehaviorY: 'contain', touchAction: 'pan-y' }}>
                <div className="space-y-2 pr-2 overflow-visible">
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
  const { t } = useLanguage();
  
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
          <h2 className="text-base font-semibold">{t("cart.inline.title")}</h2>
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
                {t("cart.inline.empty")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("cart.inline.emptyDesc")}
              </p>
              <Link to={basePath + "/donation"} onClick={handleClose} className="block">
                <Button className="w-full">
                  {t("donation.cart.donateFreeAmount")}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 overscroll-contain">
              <div className="space-y-2 pr-1 overflow-visible">
                {state.items.map((item) => (
                  <CartItemComponent key={item.id} item={item} onClose={onClose} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-3 space-y-3 flex-shrink-0 bg-white shadow-sm">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t("cart.inline.total")}</span>
                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(state.totalAmount)}
                </span>
              </div>
              {/* Checkout Button */}
              <Link to={basePath + "/donation"} onClick={handleClose} className="block">
                <Button className="w-full" size="lg">
                  <span>{t("cart.inline.toDonation")}</span>
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
  const { t } = useLanguage();

  // Always show donate button that goes directly to donation page
  return (
    <Link to={basePath + "/donation"} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
        {t("cart.donate")}
      </Button>
    </Link>
  );
};

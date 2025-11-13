import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShoppingCart } from "@/contexts/ShoppingCartContext";
import { CartInline } from "./CartSidebar";
import { ProjectItem, ProjectCost } from "@/services/clientGoogleSheetsService";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  // Construction phase icons
  FileText,
  Wrench,
  Building,
  // Specific construction icons
  Bed,
  Droplets,
  Toilet,
  Zap,
  BrickWall,
  Paintbrush,
  // UI Icons
  Package,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  Target,
  ShoppingCart,
  Plus,
  Minus,
  HelpCircle,
  X,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  List,
  Grid3x3,
} from "lucide-react";

interface ProjectItemsModalProps {
  projectCost: ProjectCost;
  isOpen: boolean;
  onClose: () => void;
  onItemToggle: (itemId: string, purchased: boolean) => void;
  onItemCostUpdate: (itemId: string, cost: number) => void;
}

export const ProjectItemsModal = ({ 
  projectCost, 
  isOpen, 
  onClose, 
  onItemToggle,
  onItemCostUpdate 
}: ProjectItemsModalProps) => {
  const { t } = useLanguage();
  const { addItem, isItemInCart, removeFromCart, addItemPiece, removeItemPiece, getItemCartQuantity, isItemFullyInCart, state: cartState, toggleCart, closeCart } = useShoppingCart();
  const [showInlineCart, setShowInlineCart] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');
  const [expandedSections, setExpandedSections] = useState({
    funded: false,
    partiallyFunded: true,
    unfunded: true
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'progress' | 'remaining'>('remaining');
  const [viewStyle, setViewStyle] = useState<'compact' | 'detailed'>('compact');
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Handle URL-based navigation using hash fragments
  useEffect(() => {
    const hash = decodeURIComponent(location.hash.replace('#', ''));
    const phase = hash || 'all';
    
    if (phase && phase !== 'all') {
      setViewMode('details');
      setSelectedPhase(phase);
    } else {
      setViewMode('overview');
      setSelectedPhase('all');
    }
  }, [location.hash]);

  // Set initial URL when modal opens
  useEffect(() => {
    if (isOpen) {
      // Always ensure we default to overview when opening
      navigate(`${location.pathname}#all`, { replace: true });
    }
  }, [isOpen, location.pathname, navigate]);

  // Handle swipe gestures for modal navigation
  useEffect(() => {
    if (!isOpen) return;

    let startX = 0;
    let startY = 0;
    let isTracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isTracking = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      // Detect left swipe (back gesture) - swipe left to go back
      if (deltaX < -50 && Math.abs(deltaY) < 100 && viewMode === 'details') {
        navigateToOverview();
        isTracking = false;
      }
    };

    const handleTouchEnd = () => {
      isTracking = false;
    };

    // Add touch event listeners to the modal
    const modalElement = document.querySelector('[role="dialog"]');
    if (modalElement) {
      modalElement.addEventListener('touchstart', handleTouchStart, { passive: true });
      modalElement.addEventListener('touchmove', handleTouchMove, { passive: true });
      modalElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      if (modalElement) {
        modalElement.removeEventListener('touchstart', handleTouchStart);
        modalElement.removeEventListener('touchmove', handleTouchMove);
        modalElement.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isOpen, viewMode]);

  // Helper function to navigate to details view
  const navigateToDetails = (phase: string) => {
    navigate(`${location.pathname}#${encodeURIComponent(phase)}`, { replace: false });
  };

  // Helper function to navigate back to overview
  const navigateToOverview = () => {
    navigate(`${location.pathname}#all`, { replace: false });
  };

  // Ensure overlay cart is closed when opening modal to avoid backdrop-only state
  useEffect(() => {
    if (isOpen && cartState.isOpen) {
      closeCart();
    }
    if (isOpen) {
      setShowInlineCart(false);
    }
  }, [isOpen]);

  const phases = Array.from(new Set(projectCost.items.map(item => item.phase)));
  
  // Keep selectedPhase in sync with location.hash (overview/details)
  useEffect(() => {
    if (!isOpen) return;
    const hash = decodeURIComponent(location.hash.replace('#', '')) || 'all';
    setSelectedPhase(hash);
    setViewMode(hash === 'all' ? 'overview' : 'details');
    // Reset filters when switching phases
    if (hash !== 'all') {
      setSearchQuery("");
      setSelectedCategory("all");
    }
  }, [isOpen, location.hash]);

  // Filter items by phase, search query, and category
  const filteredItems = projectCost.items.filter(item => {
    const matchesPhase = selectedPhase === "all" || item.phase === selectedPhase;
    const matchesSearch = searchQuery === "" || 
      item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.blurb?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesPhase && matchesSearch && matchesCategory;
  });

  // Get categories only from items in the current phase
  const phaseItems = selectedPhase === "all" 
    ? projectCost.items 
    : projectCost.items.filter(item => item.phase === selectedPhase);
  const categories = Array.from(new Set(phaseItems.map(item => item.category).filter(Boolean)));

  const getProgressPercentage = (item: ProjectItem) => {
    if (item.qtyNeededTotal === 0) return 0;
    const cartQuantity = getItemCartQuantity(item.itemId);
    const totalProgress = item.qtyFunded + cartQuantity;
    return Math.min((totalProgress / item.qtyNeededTotal) * 100, 100);
  };

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const cartQuantityA = getItemCartQuantity(a.itemId);
    const cartQuantityB = getItemCartQuantity(b.itemId);
    const remainingA = a.qtyNeededTotal - a.qtyFunded - cartQuantityA;
    const remainingB = b.qtyNeededTotal - b.qtyFunded - cartQuantityB;
    
    switch (sortBy) {
      case 'name':
        return a.displayName.localeCompare(b.displayName);
      case 'price':
        return a.unitCostEUR - b.unitCostEUR; // Günstigste zuerst
      case 'progress': {
        const progressA = getProgressPercentage(a);
        const progressB = getProgressPercentage(b);
        // Handle NaN or undefined values
        if (isNaN(progressA) || isNaN(progressB)) {
          return (isNaN(progressB) ? 0 : progressB) - (isNaN(progressA) ? 0 : progressA);
        }
        return progressB - progressA; // Höchster Fortschritt zuerst
      }
      case 'remaining':
      default:
        // Prioritize unfunded items, then by remaining quantity
        if (a.qtyFunded === 0 && b.qtyFunded > 0) return -1;
        if (a.qtyFunded > 0 && b.qtyFunded === 0) return 1;
        return remainingB - remainingA;
    }
  });

  const fundedItems = sortedItems.filter(item => item.purchased);
  const partiallyFundedItems = sortedItems.filter(item => !item.purchased && item.qtyFunded > 0);
  const unfundedItems = sortedItems.filter(item => !item.purchased && item.qtyFunded === 0);

  // Find the next important item (first unfunded item, or first partially funded item if no unfunded)
  const getNextImportantItem = (): ProjectItem | null => {
    // Use all items for overview, filtered items for details
    const itemsToCheck = viewMode === 'overview' ? projectCost.items : filteredItems;
    const allUnfunded = itemsToCheck.filter(item => !item.purchased && item.qtyFunded === 0);
    const allPartiallyFunded = itemsToCheck.filter(item => !item.purchased && item.qtyFunded > 0);
    
    if (allUnfunded.length > 0) {
      return allUnfunded[0];
    }
    if (allPartiallyFunded.length > 0) {
      return allPartiallyFunded[0];
    }
    return null;
  };

  const nextImportantItem = getNextImportantItem();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Ensure cart is visible when adding items
  const addItemPieceWithCartOpen = (item: ProjectItem) => {
    // In modal we don't force-open overlay cart; the inline cart shows when state.isOpen is true
    addItemPiece(item);
  };

  const getPhaseName = (phase: string) => {
    switch (phase) {
      case 'planning':
        return t("projects.timeline.planning");
      case 'implementation':
        return t("projects.timeline.implementation");
      case 'impact':
        return t("projects.timeline.impact");
      default:
        return phase;
    }
  };

  const getPhaseIcon = (phase: string) => {
    const phaseLower = phase.toLowerCase();
    
    if (phaseLower.includes('outer') || phaseLower.includes('walls') || phaseLower.includes('wall') || phaseLower.includes('floor') || phaseLower.includes('flooring')) {
      return <BrickWall className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('foundation') || phaseLower.includes('sealing')) {
      return <Wrench className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('water') || phaseLower.includes('system')) {
      return <Droplets className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('interior') || phaseLower.includes('bedroom')) {
      return <Bed className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('electricity') || phaseLower.includes('lighting')) {
      return <Zap className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('bathroom') || phaseLower.includes('sanitary')) {
      return <Toilet className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('painting') || phaseLower.includes('finishing') || phaseLower.includes('paint')) {
      return <Paintbrush className="w-8 h-8 text-primary" />;
    }
    
    return <Package className="w-8 h-8 text-primary" />;
  };

  const getStatusColor = (item: ProjectItem) => {
    if (item.purchased) return "text-green-600 bg-green-50 border-green-200";
    if (item.qtyFunded > 0) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getStatusIcon = (item: ProjectItem) => {
    if (item.purchased) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (item.qtyFunded > 0) return <Circle className="w-4 h-4 text-orange-600" />;
    return <Target className="w-4 h-4 text-gray-500" />;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addItemToCart = (item: ProjectItem) => {
    addItem({
      id: `item-${item.itemId}`,
      type: 'item',
      name: item.displayName,
      description: item.blurb || `${item.category} - ${getPhaseName(item.phase)}`,
      unitPrice: item.unitCostEUR,
      category: item.category,
      phase: item.phase,
      imageUrl: item.imageUrl,
      projectName: projectCost.projectName,
    });
  };

  const addPhaseToCart = (phaseGroup: any) => {
    addItem({
      id: `phase-${phaseGroup.phase}`,
      type: 'phase',
      name: `${getPhaseName(phaseGroup.phase)} - ${projectCost.projectName}`,
      description: `Komplette Bauphase mit ${phaseGroup.items.length} Items`,
      unitPrice: phaseGroup.budget,
      category: 'Bauphase',
      phase: phaseGroup.phase,
      projectName: projectCost.projectName,
    });
  };

  // Group items by phase for overview
  const phaseGroups = phases.map(phase => {
    const phaseItems = projectCost.items.filter(item => item.phase === phase);
    const phaseBudget = phaseItems.reduce((sum, item) => sum + (item.totalCostEUR || 0), 0);
    const phaseSpent = phaseItems.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0);
    const phaseProgress = phaseBudget > 0 ? (phaseSpent / phaseBudget) * 100 : 0;
    
    return {
      phase,
      items: phaseItems,
      budget: phaseBudget,
      spent: phaseSpent,
      progress: phaseProgress,
      fundedCount: phaseItems.filter(item => item.purchased).length,
      partiallyFundedCount: phaseItems.filter(item => !item.purchased && item.qtyFunded > 0).length,
      unfundedCount: phaseItems.filter(item => !item.purchased && item.qtyFunded === 0).length
    };
  }).sort((a, b) => {
    return b.progress - a.progress;
  });

  const renderItemCard = (item: ProjectItem, isNextImportant: boolean = false) => {
    const cartQuantity = getItemCartQuantity(item.itemId);
    const isFullyInCart = isItemFullyInCart(item);
    const remainingPieces = item.qtyNeededTotal - item.qtyFunded - cartQuantity;
    const isCompact = viewStyle === 'compact';
    
    if (isCompact) {
      // Compact view - single line
      return (
        <div 
          key={item.itemId} 
          data-item-id={item.itemId}
          className={`group flex items-center gap-2 px-3 py-2 rounded-md transition-all hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${isNextImportant ? 'bg-primary/5 border-l-4 border-l-primary' : ''} ${isFullyInCart ? 'bg-green-50/50' : ''}`}
        >
          {/* Status Icon */}
          <div className="flex-shrink-0 w-4">
            {isFullyInCart ? <CheckCircle className="w-4 h-4 text-green-600" /> : getStatusIcon(item)}
          </div>

          {/* Item Name & Category */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 truncate text-sm">{item.displayName}</h4>
              {item.category && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                  {item.category}
                </Badge>
              )}
              {item.blurb && (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs z-[9999]" side="top" sideOffset={5}>
                    <p className="text-sm">{item.blurb}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Progress - compact */}
          <div className="flex items-center gap-2 flex-shrink-0 w-24">
            <div className="w-16">
              <Progress value={getProgressPercentage(item)} className="h-1.5" />
            </div>
            <div className="text-xs font-medium text-gray-600 w-8 text-right">
              {getProgressPercentage(item).toFixed(0)}%
            </div>
          </div>

          {/* Quantity Info */}
          <div className="text-xs text-gray-600 flex-shrink-0 w-16 text-right">
            {item.qtyFunded + cartQuantity}/{item.qtyNeededTotal}
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0 w-20">
            <div className="text-xs font-semibold text-gray-900">
              {formatCurrency(item.unitCostEUR)}
            </div>
            <div className="text-[10px] text-gray-500">{item.unit}</div>
          </div>

          {/* Cart Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeItemPiece(item.itemId)}
              disabled={cartQuantity === 0}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            
            <span className="text-xs font-medium w-6 text-center">
              {cartQuantity}
            </span>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addItemPieceWithCartOpen(item)}
              disabled={remainingPieces === 0}
              className="h-7 w-7 p-0 disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      );
    } else {
      // Grid view - vertical card layout
      return (
        <Card 
          key={item.itemId} 
          data-item-id={item.itemId}
          className={`p-3 transition-all hover:shadow-lg flex flex-col h-full ${isNextImportant ? 'ring-2 ring-primary ring-offset-2 bg-primary/5 border-primary' : ''} ${isFullyInCart ? 'bg-green-50 border-green-200' : getStatusColor(item)}`}
        >
          {/* Header with Status Icon and Name */}
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-shrink-0 mt-0.5">
              {isFullyInCart ? <CheckCircle className="w-4 h-4 text-green-600" /> : getStatusIcon(item)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5 mb-1">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight">{item.displayName}</h4>
                {item.blurb && (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <HelpCircle 
                        className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0 mt-0.5" 
                      />
                    </TooltipTrigger>
                    <TooltipContent 
                      className="max-w-xs z-[9999]" 
                      side="top"
                      sideOffset={5}
                    >
                      <p className="text-sm">{item.blurb}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {item.category && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 mt-0.5">
                  {item.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="mb-2">
            <div className="text-base font-bold text-gray-900">
              {formatCurrency(item.unitCostEUR)}
            </div>
            <div className="text-xs text-gray-500">
              pro {item.unit}
            </div>
          </div>

          {/* Progress */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">
                {item.qtyFunded + cartQuantity} / {item.qtyNeededTotal}
              </span>
              <span className="text-xs font-semibold text-gray-700">
                {getProgressPercentage(item).toFixed(0)}%
              </span>
            </div>
            <Progress value={getProgressPercentage(item)} className="h-2" />
          </div>

          {/* Cart Controls */}
          <div className="mt-auto pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                Im Warenkorb: <span className="font-semibold">{cartQuantity}</span>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeItemPiece(item.itemId)}
                  disabled={cartQuantity === 0}
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addItemPieceWithCartOpen(item)}
                  disabled={remainingPieces === 0}
                  className="h-7 w-7 p-0 disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`z-[60] h-[85vh] flex flex-col pr-0 transition-all duration-300 max-w-7xl bg-white touch-pan-y overscroll-none`}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking on cart
          if (cartState.isOpen) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-lg flex-1 min-w-0">
              <Package className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="truncate">{projectCost.projectName}</span>
                {viewMode === 'details' && selectedPhase !== 'all' && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                        {getPhaseIcon(selectedPhase)}
                      </div>
                      <span className="text-sm text-gray-600 whitespace-nowrap">{getPhaseName(selectedPhase)}</span>
                    </div>
                  </>
                )}
              </div>
            </DialogTitle>
            {viewMode === 'details' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToOverview}
                className="flex items-center gap-1.5 h-8 flex-shrink-0"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                <span className="text-xs">Zurück</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content Area - optional inline cart at md+ */}
        <div className={`grid gap-4 flex-1 min-h-0 ${showInlineCart ? 'md:grid-cols-[2fr_1fr]' : 'grid-cols-1'}`}>
          {/* Left: Modal content */}
          <div className="min-w-0 h-full overflow-y-auto pr-2 pb-4">
            {viewMode === 'overview' ? (
              /* Phase Overview */
              <div className="space-y-4">
                {/* Next Important Item Highlight */}
                {nextImportantItem && (
                  <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 border-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-primary">Nächstes wichtiges Item</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{nextImportantItem.displayName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-600">
                            {nextImportantItem.qtyNeededTotal - nextImportantItem.qtyFunded - getItemCartQuantity(nextImportantItem.itemId)} von {nextImportantItem.qtyNeededTotal} noch benötigt
                          </p>
                          <span className="text-xs font-semibold text-primary">
                            {formatCurrency(nextImportantItem.unitCostEUR)} / {nextImportantItem.unit}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          navigateToDetails(nextImportantItem.phase);
                          // Scroll to item after navigation
                          setTimeout(() => {
                            const element = document.querySelector(`[data-item-id="${nextImportantItem.itemId}"]`);
                            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 100);
                        }}
                        className="flex-shrink-0"
                      >
                        <ChevronRight className="w-4 h-4 mr-1" />
                        Anzeigen
                      </Button>
                    </div>
                  </Card>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {phaseGroups.map((phaseGroup) => (
                   <Card key={phaseGroup.phase} className="p-4 cursor-pointer transition-all hover:shadow-lg flex flex-col h-full">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Phase Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getPhaseIcon(phaseGroup.phase)}
                        </div>
                      </div>

                      {/* Phase Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-base">{getPhaseName(phaseGroup.phase)}</h3>
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            {phaseGroup.items.length} Items
                          </Badge>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <Progress value={phaseGroup.progress} className="h-2.5" />
                          </div>
                          <div className="text-xs font-semibold text-gray-700 min-w-[35px] text-right">
                            {phaseGroup.progress.toFixed(0)}%
                          </div>
                        </div>

                        {/* Budget Info */}
                        <div className="flex items-center justify-between text-xs mb-3">
                          <div className="text-gray-600">
                            <span className="font-medium">Bezahlt:</span> {formatCurrency(phaseGroup.spent)}
                          </div>
                          <div className="text-orange-600 font-semibold">
                            Offen: {formatCurrency(phaseGroup.budget - phaseGroup.spent)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      {/* Add all unfunded items button with tooltip */}
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              const unfundedItems = phaseGroup.items.filter(item => !item.purchased && item.qtyFunded === 0);
                              unfundedItems.forEach(item => {
                                addItemPiece(item);
                              });
                            }}
                            className="flex-1 text-xs font-medium border-orange-200 text-orange-700 hover:bg-orange-50"
                            disabled={phaseGroup.unfundedCount === 0}
                          >
                            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                            Alle offenen Items hinzufügen
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">
                            Fügt alle {phaseGroup.unfundedCount} noch nicht finanzierten Items dieser Phase zum Warenkorb hinzu
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Details Button */}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToDetails(phaseGroup.phase);
                        }}
                        className="flex-1 text-xs font-medium"
                      >
                        <ChevronRight className="w-3.5 h-3.5 mr-1.5" />
                        Details
                      </Button>
                    </div>
                   </Card>
                 ))}
                </div>
              </div>
            ) : (
              /* Details View */
              <div className="space-y-2">
              {/* Compact Filter Bar */}
              <div className="sticky top-0 z-20 bg-white border-b pb-2 -mx-2 px-2">
                <div className="flex items-center justify-between gap-2">
                  {/* Item Count */}
                  <div className="text-xs text-gray-500">
                    {filteredItems.length} Items {searchQuery && `• gefiltert`}
                  </div>

                  {/* Filter Toggle & View Style */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1 border rounded-md p-0.5">
                      <Button
                        size="sm"
                        variant={viewStyle === 'compact' ? 'default' : 'ghost'}
                        onClick={() => setViewStyle('compact')}
                        className="h-7 px-2"
                      >
                        <List className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewStyle === 'detailed' ? 'default' : 'ghost'}
                        onClick={() => setViewStyle('detailed')}
                        className="h-7 px-2"
                      >
                        <Grid3x3 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFiltersExpanded(!filtersExpanded)}
                      className="h-7 px-2"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      {filtersExpanded ? <ChevronDown className="w-3.5 h-3.5 ml-1" /> : <ChevronRight className="w-3.5 h-3.5 ml-1" />}
                    </Button>
                  </div>
                </div>

                {/* Collapsible Search & Filter Bar */}
                {filtersExpanded && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input
                        placeholder="Durchsuchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>

                    {/* Category Filter */}
                    {categories.length > 0 && (
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <Filter className="w-3 h-3 mr-1.5" />
                          <SelectValue placeholder="Kategorie" />
                        </SelectTrigger>
                        <SelectContent className="z-[70]">
                          <SelectItem value="all">Alle Kategorien</SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Sort */}
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <ArrowUpDown className="w-3 h-3 mr-1.5" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="remaining">Priorität</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Preis</SelectItem>
                        <SelectItem value="progress">Fortschritt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* Funded Items */}
              {fundedItems.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('funded')}
                    className="sticky top-[60px] z-10 w-full text-left text-xs font-semibold text-green-700 mb-1.5 flex items-center justify-between hover:bg-green-50 px-2 py-1.5 rounded transition-colors bg-green-50/80 backdrop-blur-sm border border-green-200"
                  >
                    <div className="flex items-center gap-1.5">
                      {expandedSections.funded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Vollständig finanziert</span>
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{fundedItems.length}</Badge>
                    </div>
                  </button>
                  {expandedSections.funded && (
                    <div className={viewStyle === 'compact' ? 'space-y-0 bg-white border rounded-md overflow-hidden' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pl-1 pb-2'}>
                      {fundedItems.map(item => renderItemCard(item, false))}
                    </div>
                  )}
                </div>
              )}

              {/* Partially Funded Items */}
              {partiallyFundedItems.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('partiallyFunded')}
                    className="sticky top-[60px] z-10 w-full text-left text-xs font-semibold text-orange-700 mb-1.5 flex items-center justify-between hover:bg-orange-50 px-2 py-1.5 rounded transition-colors bg-orange-50/80 backdrop-blur-sm border border-orange-200"
                  >
                    <div className="flex items-center gap-1.5">
                      {expandedSections.partiallyFunded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <Circle className="w-3.5 h-3.5" />
                      <span>Teilweise finanziert</span>
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{partiallyFundedItems.length}</Badge>
                    </div>
                  </button>
                  {expandedSections.partiallyFunded && (
                    <div className={viewStyle === 'compact' ? 'space-y-0 bg-white border rounded-md overflow-hidden' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pl-1 pb-2'}>
                      {partiallyFundedItems.map(item => renderItemCard(item, nextImportantItem?.itemId === item.itemId && unfundedItems.length === 0))}
                    </div>
                  )}
                </div>
              )}

              {/* Unfunded Items */}
              {unfundedItems.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('unfunded')}
                    className="sticky top-[60px] z-10 w-full text-left text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between hover:bg-gray-50 px-2 py-1.5 rounded transition-colors bg-gray-50/80 backdrop-blur-sm border border-gray-200"
                  >
                    <div className="flex items-center gap-1.5">
                      {expandedSections.unfunded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <Target className="w-3.5 h-3.5" />
                      <span>Ausstehend</span>
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{unfundedItems.length}</Badge>
                    </div>
                  </button>
                  {expandedSections.unfunded && (
                    <div className={viewStyle === 'compact' ? 'space-y-0 bg-white border rounded-md overflow-hidden' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pl-1 pb-2'}>
                      {unfundedItems.map(item => {
                        const isNextImportant = nextImportantItem?.itemId === item.itemId;
                        return renderItemCard(item, isNextImportant);
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* No items found */}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Keine Items gefunden</p>
                  <p className="text-sm">Versuchen Sie andere Suchbegriffe oder Filter</p>
                </div>
              )}
            </div>
          )}
          </div>

          {/* Right: Inline Cart */}
          {showInlineCart && (
            <div className="hidden md:block h-full overflow-hidden">
              <CartInline />
            </div>
          )}
        </div>

        {/* Floating CTA removed - now using footer cart link */}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t px-4 bg-white flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {viewMode === 'overview' ? `${projectCost.totalItems} Items insgesamt` : `${filteredItems.length} von ${projectCost.totalItems} Items angezeigt`}
          </div>
          
          {/* Budget Summary - centered */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm font-bold text-green-600">
                {viewMode === 'overview' 
                  ? formatCurrency(projectCost.items.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0))
                  : formatCurrency(filteredItems.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0))
                }
              </div>
              <div className="text-xs text-gray-600">Bezahlt</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-600">
                {viewMode === 'overview'
                  ? formatCurrency(projectCost.totalBudget - projectCost.items.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0))
                  : formatCurrency(filteredItems.reduce((sum, item) => sum + (item.totalCostEUR || 0), 0) - filteredItems.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0))
                }
              </div>
              <div className="text-xs text-gray-600">Ausstehend</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-primary">
                {viewMode === 'overview'
                  ? ((projectCost.items.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0) / projectCost.totalBudget) * 100).toFixed(1)
                  : filteredItems.reduce((sum, item) => sum + (item.totalCostEUR || 0), 0) > 0 
                    ? ((filteredItems.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0) / filteredItems.reduce((sum, item) => sum + (item.totalCostEUR || 0), 0)) * 100).toFixed(1)
                    : '0.0'
                }%
              </div>
              <div className="text-xs text-gray-600">Fortschritt</div>
            </div>
          </div>
          
          {/* Cart Actions */}
          <div className="flex items-center gap-2">
            {cartState.totalItems > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInlineCart(!showInlineCart)}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {showInlineCart ? 'Warenkorb schließen' : `Warenkorb (${cartState.totalItems})`}
                </Button>
                <Link to="/dev/donation" onClick={closeCart}>
                  <Button 
                    size="sm"
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                  >
                    Zur Spende
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
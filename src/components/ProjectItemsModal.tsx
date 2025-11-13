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
  const { addItem, isItemInCart, removeFromCart, addItemPiece, addItemMax, removeItemPiece, getItemCartQuantity, isItemFullyInCart, state: cartState, toggleCart, closeCart } = useShoppingCart();
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');
  const [expandedSections, setExpandedSections] = useState({
    funded: false
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
      setShowCartDrawer(false);
    }
  }, [isOpen]);

  // Extract phases in the order they appear in the Excel table (based on sortOrder)
  // Sort items by sortOrder to maintain Excel table order
  const itemsSortedByOrder = [...projectCost.items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  // Extract unique phases in the order they first appear (maintains Excel table order)
  const phases: string[] = [];
  const seenPhases = new Set<string>();
  for (const item of itemsSortedByOrder) {
    if (!seenPhases.has(item.phase)) {
      seenPhases.add(item.phase);
      phases.push(item.phase);
    }
  }
  
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

    // Check if there's an itemId in query params and scroll to it
    const params = new URLSearchParams(location.search);
    const itemId = params.get('itemId');
    if (itemId && hash !== 'all') {
      // Wait for the view to update, then scroll to item
      setTimeout(() => {
        const element = document.querySelector(`[data-item-id="${itemId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Remove itemId from URL after scrolling
          const newParams = new URLSearchParams(location.search);
          newParams.delete('itemId');
          const newSearch = newParams.toString();
          navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}${location.hash}`, { replace: true });
        }
      }, 300);
    }
  }, [isOpen, location.hash, location.search, navigate, location.pathname]);

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

  const getFundedPercentage = (item: ProjectItem) => {
    if (item.qtyNeededTotal === 0) return 0;
    return Math.min((item.qtyFunded / item.qtyNeededTotal) * 100, 100);
  };

  const getCartPercentage = (item: ProjectItem) => {
    if (item.qtyNeededTotal === 0) return 0;
    const cartQuantity = getItemCartQuantity(item.itemId);
    return Math.min((cartQuantity / item.qtyNeededTotal) * 100, 100);
  };

  // Render multi-segment progress bar
  const renderProgressBar = (item: ProjectItem, className: string = "h-1.5") => {
    const fundedPercent = getFundedPercentage(item);
    const cartPercent = getCartPercentage(item);
    
    return (
      <div className={`relative w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
        {/* Funded segment (gray) */}
        {fundedPercent > 0 && (
          <div
            className="absolute left-0 top-0 h-full bg-gray-500 transition-all"
            style={{ width: `${fundedPercent}%` }}
          />
        )}
        {/* Cart segment (primary color) - positioned after funded */}
        {cartPercent > 0 && (
          <div
            className="absolute top-0 h-full bg-primary transition-all"
            style={{ left: `${fundedPercent}%`, width: `${cartPercent}%` }}
          />
        )}
      </div>
    );
  };

  // Render tooltip content for item details
  const renderItemTooltip = (item: ProjectItem) => {
    const cartQuantity = getItemCartQuantity(item.itemId);
    
    if (item.qtyFunded === 0 && cartQuantity === 0) {
      return null;
    }

    return (
      <TooltipContent className="z-[9999]" side="top" sideOffset={5}>
        <div className="text-sm space-y-1">
          {item.qtyFunded > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-500"></span>
              <span>{item.qtyFunded} bereits finanziert</span>
            </div>
          )}
          {cartQuantity > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <span>{cartQuantity} im Warenkorb</span>
            </div>
          )}
        </div>
      </TooltipContent>
    );
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
    addItemPiece(item, projectCost.projectName);
    // Auto-open cart drawer when adding first item
    if (cartState.totalItems === 0) {
      setShowCartDrawer(true);
    }
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
    // Use same icon for both partially funded and unfunded items
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
    
    // Calculate cart value for this phase
    const phaseCartValue = phaseItems.reduce((sum, item) => {
      const cartQuantity = getItemCartQuantity(item.itemId);
      return sum + (cartQuantity * item.unitCostEUR);
    }, 0);
    
    const phaseTotalProgress = phaseSpent + phaseCartValue;
    const phaseProgress = phaseBudget > 0 ? (phaseTotalProgress / phaseBudget) * 100 : 0;
    const phaseFundedPercent = phaseBudget > 0 ? (phaseSpent / phaseBudget) * 100 : 0;
    const phaseCartPercent = phaseBudget > 0 ? (phaseCartValue / phaseBudget) * 100 : 0;
    
    return {
      phase,
      items: phaseItems,
      budget: phaseBudget,
      spent: phaseSpent,
      cartValue: phaseCartValue,
      progress: phaseProgress,
      fundedPercent: phaseFundedPercent,
      cartPercent: phaseCartPercent,
      fundedCount: phaseItems.filter(item => item.purchased).length,
      partiallyFundedCount: phaseItems.filter(item => !item.purchased && item.qtyFunded > 0).length,
      unfundedCount: phaseItems.filter(item => !item.purchased && item.qtyFunded === 0).length,
      incompleteCount: phaseItems.filter(item => !item.purchased && item.qtyFunded < item.qtyNeededTotal).length,
      // Check if all open items are already fully in cart
      allOpenItemsInCart: phaseItems
        .filter(item => !item.purchased && item.qtyFunded < item.qtyNeededTotal)
        .every(item => {
          const cartQuantity = getItemCartQuantity(item.itemId);
          const remainingNeeded = item.qtyNeededTotal - item.qtyFunded;
          return cartQuantity >= remainingNeeded;
        })
    };
  });
  // Keep phases in original order (as defined in Excel table), don't sort by progress

  const renderItemCard = (item: ProjectItem, isNextImportant: boolean = false) => {
    const cartQuantity = getItemCartQuantity(item.itemId);
    const isFullyInCart = isItemFullyInCart(item);
    const isFullyComplete = item.qtyFunded + cartQuantity >= item.qtyNeededTotal;
    const remainingPieces = item.qtyNeededTotal - item.qtyFunded - cartQuantity;
    const isCompact = viewStyle === 'compact';
    
    if (isCompact) {
      // Compact view - responsive layout
      const tooltipContent = renderItemTooltip(item);
      const itemContent = (
        <div 
          key={item.itemId} 
          data-item-id={item.itemId}
          className={`group flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 rounded-md transition-all hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
            isNextImportant ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
          } ${
            isFullyComplete ? 'bg-green-50/50' : 
            cartQuantity > 0 ? 'bg-primary-light/30 border-l-2 border-l-primary' : 
            item.qtyFunded > 0 ? 'bg-green-50/20' : ''
          }`}
        >
          {/* Top Row: Status, Name, Category */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {isFullyComplete ? <CheckCircle className="w-4 h-4 text-green-600" /> : getStatusIcon(item)}
            </div>

            {/* Item Name & Category */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-medium text-gray-900 truncate text-sm">{item.displayName}</h4>
                {item.category && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0 hidden sm:inline-flex">
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
              {/* Category on mobile - below name */}
              {item.category && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 mt-0.5 sm:hidden">
                  {item.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Bottom Row on Mobile / Right Side on Desktop: Progress, Quantity, Price, Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-2 sm:flex-shrink-0">
            {/* Progress - shown on larger screens, hidden on very small mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 hidden min-[400px]:flex sm:w-20">
              <div className="w-12 sm:w-16">
                {renderProgressBar(item, "h-1.5")}
              </div>
              <div className="text-xs font-medium text-gray-600 w-6 sm:w-8 text-right">
                {getProgressPercentage(item).toFixed(0)}%
              </div>
            </div>

            {/* Quantity Info - simple gray total */}
            <div className="text-xs flex-shrink-0 text-right sm:w-auto min-w-[60px]">
              <div className="flex items-center gap-1 justify-end">
                <span className="text-gray-600">{item.qtyFunded + cartQuantity}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">{item.qtyNeededTotal}</span>
              </div>
            </div>

            {/* Price - compact on mobile */}
            <div className="text-right flex-shrink-0 sm:w-20">
              <div className="text-xs font-semibold text-gray-900">
                {formatCurrency(item.unitCostEUR)}
              </div>
              <div className="text-[10px] text-gray-500 hidden sm:block">{item.unit}</div>
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
              
              <span className="text-xs font-medium w-5 sm:w-6 text-center">
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
        </div>
      );

      // Wrap with tooltip if there's info to show
      if (tooltipContent) {
        return (
          <Tooltip key={item.itemId} delayDuration={0}>
            <TooltipTrigger asChild>
              {itemContent}
            </TooltipTrigger>
            {tooltipContent}
          </Tooltip>
        );
      }

      return itemContent;
    } else {
      // Grid view - vertical card layout
      const tooltipContent = renderItemTooltip(item);
      const cardContent = (
        <Card 
          key={item.itemId} 
          data-item-id={item.itemId}
          className={`p-3 transition-all hover:shadow-lg flex flex-col h-full ${
            isNextImportant ? 'ring-2 ring-orange-500 ring-offset-2 bg-orange-50 border-orange-500' : ''
          } ${
            isFullyComplete ? 'bg-green-50 border-green-200' : 
            cartQuantity > 0 ? 'bg-primary-light/40 border-primary/40' : 
            item.qtyFunded > 0 ? 'bg-green-50/30 border-green-200' : 
            getStatusColor(item)
          }`}
        >
          {/* Header with Status Icon and Name */}
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-shrink-0 mt-0.5">
              {isFullyComplete ? <CheckCircle className="w-4 h-4 text-green-600" /> : getStatusIcon(item)}
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
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-600">{item.qtyFunded + cartQuantity}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">{item.qtyNeededTotal}</span>
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {getProgressPercentage(item).toFixed(0)}%
              </span>
            </div>
            {renderProgressBar(item, "h-2")}
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

      // Wrap with tooltip if there's info to show
      if (tooltipContent) {
        return (
          <Tooltip key={item.itemId} delayDuration={0}>
            <TooltipTrigger asChild>
              {cardContent}
            </TooltipTrigger>
            {tooltipContent}
          </Tooltip>
        );
      }

      return cardContent;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`z-[60] h-[85vh] flex flex-col p-0 transition-all duration-300 max-w-7xl bg-white touch-pan-y overscroll-none`}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking on cart
          if (cartState.isOpen) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="pb-2 px-4 sm:px-6 pt-6">
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

        {/* Cart Drawer - Overlay über Content, starts at header level */}
        {showCartDrawer && (
          <>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 z-40 animate-in fade-in-0 duration-300"
              onClick={() => setShowCartDrawer(false)}
            />
            {/* Drawer - extends over full height of dialog */}
            <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 max-w-[90vw] bg-muted/40 border-l-2 border-border shadow-2xl z-50 flex flex-col min-h-0 transform transition-transform duration-300 ease-out translate-x-0">
              <CartInline basePath="/dev" onClose={() => setShowCartDrawer(false)} className="rounded-none border-0 shadow-none h-full" />
            </div>
          </>
        )}

        {/* Content Area */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {/* Main Content */}
          <div className="min-w-0 h-full overflow-y-auto px-4 sm:px-6 pb-4 relative">
            {viewMode === 'overview' ? (
              /* Phase Overview */
              <div className="space-y-4">
                {/* Next Important Item Highlight */}
                {nextImportantItem && (
                  <Card className="p-4 bg-gradient-to-r from-orange-50 to-orange-50/50 border-orange-300 border-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-orange-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-orange-600">Nächstes wichtiges Item</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{nextImportantItem.displayName}</h4>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-600">{nextImportantItem.qtyFunded + getItemCartQuantity(nextImportantItem.itemId)}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{nextImportantItem.qtyNeededTotal}</span>
                            <span className="text-gray-500 ml-1">• noch benötigt: {nextImportantItem.qtyNeededTotal - nextImportantItem.qtyFunded - getItemCartQuantity(nextImportantItem.itemId)}</span>
                          </div>
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
                   <Card 
                     key={phaseGroup.phase} 
                     onClick={() => navigateToDetails(phaseGroup.phase)}
                     className="p-4 cursor-pointer transition-all hover:shadow-lg flex flex-col h-full"
                   >
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
                          <div className="flex-1 min-w-0 relative">
                            {(phaseGroup.spent > 0 || phaseGroup.cartValue > 0) ? (
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <div className="relative w-full overflow-hidden rounded-full bg-gray-200 h-2.5 cursor-help">
                                    {/* Funded segment (gray) */}
                                    {phaseGroup.fundedPercent > 0 && (
                                      <div
                                        className="absolute left-0 top-0 h-full bg-gray-500 transition-all"
                                        style={{ width: `${phaseGroup.fundedPercent}%` }}
                                      />
                                    )}
                                    {/* Cart segment (primary color) - positioned after funded */}
                                    {phaseGroup.cartPercent > 0 && (
                                      <div
                                        className="absolute top-0 h-full bg-primary transition-all"
                                        style={{ left: `${phaseGroup.fundedPercent}%`, width: `${phaseGroup.cartPercent}%` }}
                                      />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="z-[9999]" side="top" sideOffset={5}>
                                  <div className="text-sm space-y-1">
                                    {phaseGroup.spent > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                                        <span>{formatCurrency(phaseGroup.spent)} bereits finanziert</span>
                                      </div>
                                    )}
                                    {phaseGroup.cartValue > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-primary"></span>
                                        <span>{formatCurrency(phaseGroup.cartValue)} im Warenkorb</span>
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="relative w-full overflow-hidden rounded-full bg-gray-200 h-2.5">
                                {/* Empty progress bar */}
                              </div>
                            )}
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
                            Offen: {formatCurrency(phaseGroup.budget - phaseGroup.spent - phaseGroup.cartValue)}
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
                              // Add all items that are not fully funded (including partially funded)
                              const itemsToAdd = phaseGroup.items.filter(item => 
                                !item.purchased && item.qtyFunded < item.qtyNeededTotal
                              );
                              itemsToAdd.forEach(item => {
                                addItemMax(item, projectCost.projectName);
                              });
                            }}
                            className="flex-1 text-xs font-medium border-orange-200 text-orange-700 hover:bg-orange-50"
                            disabled={phaseGroup.incompleteCount === 0 || phaseGroup.allOpenItemsInCart}
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
              <div className="sticky top-0 z-20 bg-white border-b pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
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
              
              {/* Funded Items - Collapsed by default */}
              {fundedItems.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('funded')}
                    className="sticky top-[60px] z-10 w-full text-left text-xs font-semibold text-green-700 mb-1.5 flex items-center justify-between hover:bg-green-50 px-4 sm:px-6 py-1.5 rounded transition-colors bg-green-50/80 backdrop-blur-sm border border-green-200"
                  >
                    <div className="flex items-center gap-1.5">
                      {expandedSections.funded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Vollständig finanziert</span>
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{fundedItems.length}</Badge>
                    </div>
                  </button>
                  {expandedSections.funded && (
                    <div className={viewStyle === 'compact' ? 'space-y-0 bg-white border rounded-md overflow-hidden' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:pl-1 pb-2'}>
                      {fundedItems.map(item => renderItemCard(item, false))}
                    </div>
                  )}
                </div>
              )}

              {/* Active Items - Combined Partially Funded & Unfunded - No Toggle */}
              {(partiallyFundedItems.length > 0 || unfundedItems.length > 0) && (
                <div className={viewStyle === 'compact' ? 'space-y-0 bg-white border rounded-md overflow-hidden' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:pl-1 pb-2'}>
                  {[...partiallyFundedItems, ...unfundedItems].map(item => {
                    const isNextImportant = nextImportantItem?.itemId === item.itemId;
                    return renderItemCard(item, isNextImportant);
                  })}
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

        </div>

        {/* Floating CTA removed - now using footer cart link */}

        {/* Footer */}
        <div className="grid grid-cols-3 items-center pt-4 pb-6 sm:pb-8 border-t px-4 sm:px-6 bg-white flex-shrink-0">
          {/* Left: Item Count */}
          <div className="text-sm text-muted-foreground">
            {viewMode === 'overview' ? `${projectCost.totalItems} Items insgesamt` : `${filteredItems.length} von ${projectCost.totalItems} Items angezeigt`}
          </div>
          
          {/* Center: Budget Summary - always centered */}
          <div className="flex items-center justify-center gap-6">
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
          
          {/* Right: Cart Actions */}
          <div className="flex items-center justify-end gap-2">
            {cartState.totalItems > 0 && (
              <>
                <Button 
                  size="sm"
                  onClick={() => setShowCartDrawer(!showCartDrawer)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Warenkorb</span>
                  <span className="font-semibold">
                    {formatCurrency(cartState.totalAmount)}
                  </span>
                </Button>
                {showCartDrawer && (
                  <Link to="/dev/donation" onClick={() => { closeCart(); setShowCartDrawer(false); }}>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
                    >
                      Jetzt spenden
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
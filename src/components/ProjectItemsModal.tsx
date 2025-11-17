import React, { useState, useEffect } from "react";
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
  Shield,
  Sofa,
  Layers,
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
  Info,
  Heart,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const { t, language } = useLanguage();
  const { addItem, isItemInCart, removeFromCart, addItemPiece, addItemMax, removeItemPiece, getItemCartQuantity, isItemFullyInCart, state: cartState, toggleCart, closeCart, addOrUpdateGeneralDonation } = useShoppingCart();
  
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
  
  const getItemUnit = (item: ProjectItem): string => {
    // Always use "Stück" in German, otherwise use the original unit
    if (language === 'de') {
      return 'Stück';
    }
    return item.unit || '';
  };
  
  const getItemPhaseName = (item: ProjectItem): string => {
    if (language === 'de' && item.phaseDe) {
      return item.phaseDe;
    }
    return getPhaseName(item.phase);
  };
  
  // Helper function to get phase name translation when we only have the phase string
  const getPhaseNameTranslated = (phase: string): string => {
    if (phase === 'all') return phase;
    // Find first item with this phase to get translation
    const itemWithPhase = projectCost.items.find(item => item.phase === phase);
    if (itemWithPhase) {
      return getItemPhaseName(itemWithPhase);
    }
    return getPhaseName(phase);
  };
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
  const [showCompletedPhases, setShowCompletedPhases] = useState(false);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0); // For timeline navigation
  const [expandedPhaseItems, setExpandedPhaseItems] = useState<string | null>(null); // Track which phase items are expanded

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
    const displayName = getItemDisplayName(item);
    const category = getItemCategory(item);
    const blurb = getItemBlurb(item);
    const matchesSearch = searchQuery === "" || 
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blurb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Also search in original language fields
      item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.blurb?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || category === selectedCategory || item.category === selectedCategory;
    return matchesPhase && matchesSearch && matchesCategory;
  });

  // Get categories only from items in the current phase
  const phaseItems = selectedPhase === "all" 
    ? projectCost.items 
    : projectCost.items.filter(item => item.phase === selectedPhase);
  const categories = Array.from(new Set(phaseItems.map(item => {
    const category = getItemCategory(item);
    return category || item.category;
  }).filter(Boolean)));

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
              <span>{item.qtyFunded} {t("projectItems.funded")}</span>
            </div>
          )}
          {cartQuantity > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <span>{cartQuantity} {t("projectItems.inCart")}</span>
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
        return getItemDisplayName(a).localeCompare(getItemDisplayName(b));
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

  // Find the next important item phasenübergreifend (first item not fully funded or in cart, sorted by Excel order)
  const getNextImportantItem = (): ProjectItem | null => {
    // Always use all items from the project, regardless of view mode or filters
    // This ensures phasenübergreifend (across all phases) only one next item is shown
    const allItems = projectCost.items;
    
    // Sort items by sortOrder (Excel table order) to maintain priority across all phases
    const sortedItems = [...allItems].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    // Find the first item across all phases that:
    // 1. Is not purchased
    // 2. Still needs more items (not fully funded AND not fully in cart)
    for (const item of sortedItems) {
      if (item.purchased) continue;
      
      const cartQuantity = getItemCartQuantity(item.itemId);
      const totalAvailable = item.qtyFunded + cartQuantity;
      const remainingNeeded = item.qtyNeededTotal - totalAvailable;
      
      // Item is the next important item if it still needs more (remainingNeeded > 0)
      // This ensures it switches automatically when fully funded or in cart
      if (remainingNeeded > 0) {
        return item;
      }
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
    // Only allow adding items from purchasable phases
    if (!isItemPurchasable(item)) {
      return;
    }
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
    
    // Security - Sicherheitsmaßnahmen (check first as it's a single word)
    if (phaseLower.includes('security')) {
      return <Shield className="w-8 h-8 text-primary" />;
    }
    
    // Outer walls & flooring - Äußere Wände & Boden
    if ((phaseLower.includes('outer') && phaseLower.includes('walls')) || 
        (phaseLower.includes('outer') && phaseLower.includes('floor')) ||
        (phaseLower.includes('walls') && phaseLower.includes('flooring'))) {
      return <BrickWall className="w-8 h-8 text-primary" />;
    }
    
    // Foundation sealing - Fundamentabdichtung
    if (phaseLower.includes('foundation') && phaseLower.includes('sealing')) {
      return <Layers className="w-8 h-8 text-primary" />;
    }
    
    // Water system - Wassersystem
    if (phaseLower.includes('water') && phaseLower.includes('system')) {
      return <Droplets className="w-8 h-8 text-primary" />;
    }
    
    // Septic & soak pit - Klärgrube & Sickergrube (check before water fallback)
    if (phaseLower.includes('septic') || phaseLower.includes('soak')) {
      return <Droplets className="w-8 h-8 text-primary" />;
    }
    
    // Interior & furniture - Inneneinrichtung (check before interior walls)
    if (phaseLower.includes('interior') && phaseLower.includes('furniture')) {
      return <Sofa className="w-8 h-8 text-primary" />;
    }
    
    // Interior walls & finishing - Innenwände & Außendekoration
    if (phaseLower.includes('interior') && phaseLower.includes('walls') && phaseLower.includes('finishing')) {
      return <Paintbrush className="w-8 h-8 text-primary" />;
    }
    
    // Electricity & lighting
    if (phaseLower.includes('electricity') && phaseLower.includes('lighting')) {
      return <Zap className="w-8 h-8 text-primary" />;
    }
    
    // Bathroom & sanitary
    if (phaseLower.includes('bathroom') && phaseLower.includes('sanitary')) {
      return <Toilet className="w-8 h-8 text-primary" />;
    }
    
    // Fallback: Check for partial matches (for backwards compatibility)
    if (phaseLower.includes('outer') || (phaseLower.includes('walls') && phaseLower.includes('floor'))) {
      return <BrickWall className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('foundation') || phaseLower.includes('sealing')) {
      return <Layers className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('water')) {
      return <Droplets className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('interior') && phaseLower.includes('finishing')) {
      return <Paintbrush className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('electricity') || phaseLower.includes('lighting')) {
      return <Zap className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('bathroom') || phaseLower.includes('sanitary')) {
      return <Toilet className="w-8 h-8 text-primary" />;
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
    const nameEn = item.displayName;
    const nameDe = item.displayNameDe || item.displayName;
    const descriptionEn = item.blurb || `${item.category || ''} - ${item.phase || ''}`;
    const descriptionDe = item.blurbDe || item.blurb || `${item.categoryDe || item.category || ''} - ${item.phaseDe || item.phase || ''}`;
    
    addItem({
      id: `item-${item.itemId}`,
      type: 'item',
      name: getItemDisplayName(item),
      description: getItemBlurb(item) || `${getItemCategory(item)} - ${getItemPhaseName(item)}`,
      unitPrice: item.unitCostEUR,
      category: getItemCategory(item),
      phase: item.phase,
      imageUrl: item.imageUrl,
      projectName: projectCost.projectName,
      itemId: item.itemId, // Store original itemId for translation lookup
      nameDe: nameDe,
      nameEn: nameEn,
      descriptionDe: descriptionDe,
      descriptionEn: descriptionEn,
    });
  };

  const addPhaseToCart = (phaseGroup: any) => {
    // Only allow adding phases that are purchasable
    if (!isPhasePurchasable(phaseGroup.phase)) {
      return;
    }
    addItem({
      id: `phase-${phaseGroup.phase}`,
      type: 'phase',
      name: `${getPhaseNameTranslated(phaseGroup.phase)} - ${projectCost.projectName}`,
      description: t("projectItems.completePhase").replace("{count}", phaseGroup.items.length.toString()),
      unitPrice: phaseGroup.budget,
      category: t("projectItems.phase"),
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
        }),
      // A phase is completed when progress is 100% (all items are fully funded)
      isCompleted: phaseProgress >= 100
    };
  });
  // Keep phases in original order (as defined in Excel table), don't sort by progress
  
  // Separate active and completed phases
  const activePhases = phaseGroups.filter(phase => !phase.isCompleted);
  const completedPhases = phaseGroups.filter(phase => phase.isCompleted);
  
  // Find the first incomplete phase index (the current active phase)
  const firstIncompletePhaseIndex = phaseGroups.findIndex(phase => !phase.isCompleted);
  
  // Determine which phases are purchasable: only the next 2 phases (including the current one)
  // If all phases are completed, allow all phases
  const getPurchasablePhaseIndices = (): Set<number> => {
    const purchasableIndices = new Set<number>();
    
    if (firstIncompletePhaseIndex === -1) {
      // All phases completed - allow all phases
      phaseGroups.forEach((_, index) => purchasableIndices.add(index));
    } else {
      // Allow the first incomplete phase and the next 2 phases (max 2 phases total)
      const maxPurchasableIndex = Math.min(firstIncompletePhaseIndex + 1, phaseGroups.length - 1);
      for (let i = firstIncompletePhaseIndex; i <= maxPurchasableIndex; i++) {
        purchasableIndices.add(i);
      }
    }
    
    return purchasableIndices;
  };
  
  const purchasablePhaseIndices = getPurchasablePhaseIndices();
  
  // Helper function to check if a phase is purchasable
  const isPhasePurchasable = (phase: string): boolean => {
    const phaseIndex = phaseGroups.findIndex(pg => pg.phase === phase);
    return phaseIndex !== -1 && purchasablePhaseIndices.has(phaseIndex);
  };
  
  // Helper function to check if an item is purchasable
  const isItemPurchasable = (item: ProjectItem): boolean => {
    return isPhasePurchasable(item.phase);
  };
  
  // Find the first incomplete phase index for initial active phase
  useEffect(() => {
    if (viewMode === 'overview' && phaseGroups.length > 0) {
      const firstIncompleteIndex = phaseGroups.findIndex(phase => !phase.isCompleted);
      if (firstIncompleteIndex >= 0) {
        setActivePhaseIndex(firstIncompleteIndex);
      } else {
        // All phases completed, show last one
        setActivePhaseIndex(phaseGroups.length - 1);
      }
    }
  }, [viewMode, phaseGroups.length]);

  // Auto-scroll timeline to active phase
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const activePhaseCardRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (viewMode === 'overview' && timelineRef.current && phaseGroups.length > 0) {
      const activeElement = timelineRef.current.children[activePhaseIndex] as HTMLElement;
      if (activeElement) {
        setTimeout(() => {
          activeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest', 
            inline: 'center' 
          });
        }, 100);
      }
    }
  }, [activePhaseIndex, viewMode, phaseGroups.length]);

  // Scroll to active phase card when phase is clicked
  const handlePhaseClick = (index: number) => {
    setActivePhaseIndex(index);
    const clickedPhase = phaseGroups[index];
    // Auto-expand items when clicking on a phase
    if (clickedPhase && !clickedPhase.isCompleted) {
      setExpandedPhaseItems(clickedPhase.phase);
    }
    // Scroll to the active phase card after a short delay
    setTimeout(() => {
      if (activePhaseCardRef.current) {
        activePhaseCardRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 150);
  };
  
  // Get current active phase
  const currentActivePhase = phaseGroups[activePhaseIndex] || phaseGroups[0];
  
  // Auto-expand items when phase changes
  useEffect(() => {
    if (viewMode === 'overview' && currentActivePhase && !currentActivePhase.isCompleted) {
      setExpandedPhaseItems(currentActivePhase.phase);
    }
  }, [activePhaseIndex, viewMode, currentActivePhase]);
  
  // Navigation functions for timeline
  const goToNextPhase = () => {
    if (activePhaseIndex < phaseGroups.length - 1) {
      setActivePhaseIndex(activePhaseIndex + 1);
    }
  };
  
  const goToPreviousPhase = () => {
    if (activePhaseIndex > 0) {
      setActivePhaseIndex(activePhaseIndex - 1);
    }
  };
  
  // Enhanced swipe for phase navigation in overview
  useEffect(() => {
    if (!isOpen || viewMode !== 'overview') return;

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
      
      // Swipe left = next phase, swipe right = previous phase
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
        if (deltaX < 0 && activePhaseIndex < phaseGroups.length - 1) {
          setActivePhaseIndex(activePhaseIndex + 1);
        } else if (deltaX > 0 && activePhaseIndex > 0) {
          setActivePhaseIndex(activePhaseIndex - 1);
        }
        isTracking = false;
      }
    };

    const handleTouchEnd = () => {
      isTracking = false;
    };

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
  }, [isOpen, viewMode, activePhaseIndex, phaseGroups.length]);

  const renderItemCard = (item: ProjectItem, isNextImportant: boolean = false) => {
    const cartQuantity = getItemCartQuantity(item.itemId);
    const isFullyInCart = isItemFullyInCart(item);
    const isFullyComplete = item.qtyFunded + cartQuantity >= item.qtyNeededTotal;
    const remainingPieces = item.qtyNeededTotal - item.qtyFunded - cartQuantity;
    const isCompact = viewStyle === 'compact';
    const progressPercent = getProgressPercentage(item);
    const itemPurchasable = isItemPurchasable(item);
    
    if (isCompact) {
      // Modern compact card view - no longer table-like
      const tooltipContent = renderItemTooltip(item);
      const itemContent = (
        <Card
          key={item.itemId} 
          data-item-id={item.itemId}
          className={`group p-4 transition-all hover:shadow-md ${
            isNextImportant ? 'ring-2 ring-orange-500 ring-offset-2 bg-gradient-to-r from-orange-50 to-orange-50/50 border-orange-300' : ''
          } ${
            !itemPurchasable && !isFullyComplete ? 'bg-gray-50/50 border-gray-300 opacity-75' :
            isFullyComplete ? 'bg-green-50/80 border-green-200' : 
            cartQuantity > 0 ? 'bg-primary-light/20 border-primary/30' : 
            item.qtyFunded > 0 ? 'bg-green-50/30 border-green-200/50' : 
            'bg-white border-gray-200'
          }`}
        >
          <div className="flex flex-col gap-3">
            {/* Header: Name, Category, Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="flex-shrink-0 mt-0.5">
                    {isFullyComplete ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center">
                        {getStatusIcon(item)}
            </div>
                    )}
                  </div>
            <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-gray-900 text-base leading-tight">
                        {getItemDisplayName(item)}
                      </h4>
                      {isNextImportant && (
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5 cursor-help">
                              {t("projectItems.nextImportant")}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="z-[9999] max-w-xs" side="top" sideOffset={5}>
                            <p className="text-sm leading-relaxed">
                              {t("projectItems.nextImportant.explanation")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                {getItemCategory(item) && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5 mb-1">
                    {getItemCategory(item)}
                  </Badge>
                )}
                {getItemBlurb(item) && (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1 cursor-help">
                            {getItemBlurb(item)}
                          </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs z-[9999]" side="top" sideOffset={5}>
                      <p className="text-sm">{getItemBlurb(item)}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

              {/* Price - Prominent */}
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(item.unitCostEUR)}
              </div>
                <div className="text-xs text-gray-500">
                  {t("projectItems.perUnit").replace("{unit}", getItemUnit(item))}
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {item.qtyFunded + cartQuantity} / {item.qtyNeededTotal} {getItemUnit(item)}
                  </span>
                  {remainingPieces > 0 && (
                    <span className="text-orange-600 font-medium">
                      • {remainingPieces} {t("projectItems.stillNeeded")}
                    </span>
                  )}
              </div>
                <span className="font-semibold text-gray-700">
                  {progressPercent.toFixed(0)}%
                </span>
            </div>
              <div className="w-full">
                {renderProgressBar(item, "h-2.5")}
              </div>
            </div>

            {/* Action Section */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              {cartQuantity > 0 ? (
                /* Quantity Selector - when items are in cart */
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                      variant="outline"
                onClick={() => removeItemPiece(item.itemId)}
                      className="h-8 w-8 p-0"
              >
                      <Minus className="w-4 h-4" />
              </Button>
                    <div className="flex items-center justify-center min-w-[2rem]">
                      <span className="text-sm font-semibold text-gray-900">
                {cartQuantity}
              </span>
                    </div>
                    {!isFullyComplete && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                            variant="outline"
                    onClick={() => addItemPieceWithCartOpen(item)}
                    disabled={remainingPieces === 0 || !itemPurchasable}
                            className="h-8 w-8 p-0 disabled:opacity-30"
                  >
                            <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                {!itemPurchasable && !isFullyComplete && (
                  <TooltipContent className="z-[9999] max-w-xs" side="top" sideOffset={5}>
                    <p className="text-sm">{t("projectItems.phaseNotAvailable.itemDisabled")}</p>
                  </TooltipContent>
                )}
              </Tooltip>
                    )}
            </div>
          </div>
              ) : (
                /* Add to Cart Button - when no items in cart */
                !isFullyComplete && (
                  <div className="flex justify-end w-full">
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => addItemPieceWithCartOpen(item)}
                          disabled={remainingPieces === 0 || !itemPurchasable}
                          className="h-9 px-4 bg-primary hover:bg-primary/90 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1.5" />
                          {t("projectItems.addToCart")}
                        </Button>
                      </TooltipTrigger>
                      {!itemPurchasable && !isFullyComplete && (
                        <TooltipContent className="z-[9999] max-w-xs" side="top" sideOffset={5}>
                          <p className="text-sm">{t("projectItems.phaseNotAvailable.itemDisabled")}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                )
              )}
        </div>
        </div>
        </Card>
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
      // Enhanced grid view - modern card design
      const tooltipContent = renderItemTooltip(item);
      const cardContent = (
        <Card 
          key={item.itemId} 
          data-item-id={item.itemId}
          className={`p-5 transition-all hover:shadow-xl flex flex-col h-full border-2 ${
            isNextImportant ? 'ring-2 ring-orange-500 ring-offset-2 bg-gradient-to-br from-orange-50 to-orange-50/50 border-orange-400 shadow-lg' : ''
          } ${
            !itemPurchasable && !isFullyComplete ? 'bg-gradient-to-br from-gray-50/50 to-gray-50/30 border-gray-300 opacity-75' :
            isFullyComplete ? 'bg-gradient-to-br from-green-50 to-green-50/50 border-green-300' : 
            cartQuantity > 0 ? 'bg-gradient-to-br from-primary-light/30 to-primary-light/10 border-primary/40' : 
            item.qtyFunded > 0 ? 'bg-gradient-to-br from-green-50/40 to-green-50/20 border-green-200' : 
            'bg-white border-gray-200 hover:border-primary/30'
          }`}
        >
          {/* Header Section */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
                <div className="flex-shrink-0 mt-1">
                  {isFullyComplete ? (
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getStatusIcon(item)}
                    </div>
                  )}
            </div>
            <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight">
                      {getItemDisplayName(item)}
                    </h4>
                    {isNextImportant && (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Badge className="bg-orange-500 text-white text-xs px-2 py-1 cursor-help">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {t("projectItems.nextImportant")}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="z-[9999] max-w-xs" side="top" sideOffset={5}>
                          <p className="text-sm leading-relaxed">
                            {t("projectItems.nextImportant.explanation")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {getItemCategory(item) && (
                    <Badge variant="outline" className="text-xs px-2 py-1 mb-2">
                      {getItemCategory(item)}
                    </Badge>
                  )}
                {getItemBlurb(item) && (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <p className="text-sm text-gray-600 line-clamp-2 cursor-help">
                          {getItemBlurb(item)}
                        </p>
                    </TooltipTrigger>
                    <TooltipContent 
                      className="max-w-xs z-[9999]" 
                      side="top"
                      sideOffset={5}
                    >
                      <p className="text-sm">{getItemBlurb(item)}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              </div>
            </div>
          </div>

          {/* Price Section - Prominent */}
          <div className="mb-4 p-3 bg-white/60 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-primary mb-1">
              {formatCurrency(item.unitCostEUR)}
            </div>
            <div className="text-xs text-gray-500">
              {t("projectItems.perUnit").replace("{unit}", getItemUnit(item))}
            </div>
          </div>

          {/* Progress Section */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-700">
                  {item.qtyFunded + cartQuantity} / {item.qtyNeededTotal}
                </span>
                {remainingPieces > 0 && (
                  <span className="text-orange-600 font-medium">
                    • {remainingPieces} {t("projectItems.stillNeeded")}
                  </span>
                )}
              </div>
              <span className="text-base font-bold text-gray-900">
                {progressPercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full">
              {renderProgressBar(item, "h-3")}
            </div>
          </div>

          {/* Cart Controls */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            {cartQuantity > 0 ? (
              /* Quantity Selector - when items are in cart */
              <div className="flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeItemPiece(item.itemId)}
                  className="h-9 w-9 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex items-center justify-center min-w-[2rem]">
                  <span className="text-lg font-bold text-primary">
                    {cartQuantity}
                  </span>
                </div>
                {!isFullyComplete && (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addItemPieceWithCartOpen(item)}
                      disabled={remainingPieces === 0 || !itemPurchasable}
                        className="h-9 w-9 p-0 disabled:opacity-30"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  {!itemPurchasable && !isFullyComplete && (
                    <TooltipContent className="z-[9999] max-w-xs" side="top" sideOffset={5}>
                      <p className="text-sm">{t("projectItems.phaseNotAvailable.itemDisabled")}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                )}
              </div>
            ) : (
              /* Add to Cart Button - when no items in cart */
              !isFullyComplete && (
                <div className="flex justify-end w-full">
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => addItemPieceWithCartOpen(item)}
                        disabled={remainingPieces === 0 || !itemPurchasable}
                        className="h-9 px-4 bg-primary hover:bg-primary/90 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1.5" />
                        {t("projectItems.addToCart")}
                      </Button>
                    </TooltipTrigger>
                    {!itemPurchasable && !isFullyComplete && (
                      <TooltipContent className="z-[9999] max-w-xs" side="top" sideOffset={5}>
                        <p className="text-sm">{t("projectItems.phaseNotAvailable.itemDisabled")}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              )
            )}
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
                      <span className="text-sm text-gray-600 whitespace-nowrap">{getPhaseNameTranslated(selectedPhase)}</span>
                    </div>
                  </>
                )}
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent 
                    className="max-w-xs z-[9999]" 
                    side="top"
                    sideOffset={5}
                  >
                    <p className="text-sm leading-relaxed">
                      {t("donation.itemFlexibility.warning")}
                    </p>
                  </TooltipContent>
                </Tooltip>
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
                <span className="text-xs">{t("projectItems.back")}</span>
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
              <CartInline basePath="" onClose={() => setShowCartDrawer(false)} className="rounded-none border-0 shadow-none h-full" />
            </div>
          </>
        )}

        {/* Content Area */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {/* Main Content */}
          <div className="min-w-0 h-full overflow-y-auto overflow-x-hidden px-4 sm:px-6 pb-4 relative">
            {viewMode === 'overview' ? (
              /* New Timeline-Based Phase Overview */
              <div className="space-y-6">
                {/* Enhanced Next Important Item Highlight with Flexible Donation Option */}
                {nextImportantItem && (
                  <Card className="p-4 sm:p-5 bg-gradient-to-br from-orange-50 via-orange-50/80 to-primary-light/20 border-2 border-orange-400 shadow-lg">
                    {/* Primary Action: Next Important Item */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <Badge className="bg-orange-500 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 cursor-help">
                                {t("projectItems.nextImportant")}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="z-[9999] max-w-xs" side="top" sideOffset={5}>
                              <p className="text-sm leading-relaxed">
                                {t("projectItems.nextImportant.explanation")}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-[10px] sm:text-xs text-gray-600">
                            {getPhaseNameTranslated(nextImportantItem.phase)}
                          </span>
                        </div>
                        <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-1.5 sm:mb-2 leading-tight">{getItemDisplayName(nextImportantItem)}</h4>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-gray-700 font-semibold">{nextImportantItem.qtyFunded + getItemCartQuantity(nextImportantItem.itemId)}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-700 font-semibold">{nextImportantItem.qtyNeededTotal}</span>
                            <span className="text-gray-500 ml-1 sm:ml-2 text-xs">
                              {t("projectItems.stillNeeded")} {nextImportantItem.qtyNeededTotal - nextImportantItem.qtyFunded - getItemCartQuantity(nextImportantItem.itemId)}
                            </span>
                          </div>
                        </div>
                        {getItemBlurb(nextImportantItem) && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 line-clamp-2 leading-relaxed">{getItemBlurb(nextImportantItem)}</p>
                        )}
                      </div>
                      {/* Desktop: Price and Button on the right */}
                      <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="text-xl font-bold text-primary">
                            {formatCurrency(nextImportantItem.unitCostEUR)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t("projectItems.perUnit")?.replace("{unit}", getItemUnit(nextImportantItem)) || `pro ${getItemUnit(nextImportantItem)}`}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const remaining = nextImportantItem.qtyNeededTotal - nextImportantItem.qtyFunded - getItemCartQuantity(nextImportantItem.itemId);
                            if (remaining > 0) {
                              addItemPieceWithCartOpen(nextImportantItem);
                            }
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm"
                          disabled={nextImportantItem.qtyNeededTotal - nextImportantItem.qtyFunded - getItemCartQuantity(nextImportantItem.itemId) === 0}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1.5" />
                          {t("projectItems.addToCart")}
                        </Button>
                      </div>
                      {/* Mobile: Price and Button Row */}
                      <div className="flex sm:hidden items-center justify-between gap-3 w-full pt-2 border-t border-orange-200/50">
                        <div className="flex flex-col gap-0.5">
                          <div className="text-lg font-bold text-primary">
                            {formatCurrency(nextImportantItem.unitCostEUR)}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {t("projectItems.perUnit")?.replace("{unit}", getItemUnit(nextImportantItem)) || `pro ${getItemUnit(nextImportantItem)}`}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const remaining = nextImportantItem.qtyNeededTotal - nextImportantItem.qtyFunded - getItemCartQuantity(nextImportantItem.itemId);
                            if (remaining > 0) {
                              addItemPieceWithCartOpen(nextImportantItem);
                            }
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex-1 shadow-sm h-9"
                          disabled={nextImportantItem.qtyNeededTotal - nextImportantItem.qtyFunded - getItemCartQuantity(nextImportantItem.itemId) === 0}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                          {language === 'de' ? 'Hinzufügen' : 'Add'}
                        </Button>
                      </div>
                    </div>

                    {/* Divider with "or" text */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-orange-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-gradient-to-br from-orange-50 to-orange-50/80 px-3 text-gray-500 font-medium">
                          {t("projectItems.unrestrictedDonation.or")}
                        </span>
                      </div>
                    </div>

                    {/* Secondary Action: Flexible Donation */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center border border-primary/20">
                            <Heart className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm text-gray-900 mb-1">
                            {t("projectItems.unrestrictedDonation.title")}
                          </h5>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {t("projectItems.unrestrictedDonation.description")}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Add general donation with initial amount of 0 (user will enter amount in cart)
                          addOrUpdateGeneralDonation(0);
                          // Open cart drawer
                          setShowCartDrawer(true);
                          // Don't close modal, let user see the cart
                        }}
                        className="h-9 px-3 sm:px-4 bg-white hover:bg-primary-light/10 border-primary/30 text-primary text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm flex-shrink-0 w-full sm:w-auto"
                      >
                        <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                        <span className="sm:hidden">{language === 'de' ? 'Betrag' : 'Amount'}</span>
                        <span className="hidden sm:inline">{t("projectItems.unrestrictedDonation.button")}</span>
                      </Button>
                    </div>
                  </Card>
                )}
                
                {/* Timeline with All Phases Visible */}
                <div className="space-y-4">
                  {/* Timeline Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t("projectItems.projectPhases")}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{activePhaseIndex + 1} / {phaseGroups.length}</span>
                      <span>•</span>
                      <span>{completedPhases.length} {t("projectItems.completed")}</span>
                        </div>
                      </div>

                  {/* Timeline Stepper - All Phases Visible */}
                  <div className="relative py-1">
                    <div 
                      ref={timelineRef}
                      className="flex items-start gap-2 overflow-x-auto overflow-y-visible pb-3 pl-4 pr-4 scrollbar-hide scroll-smooth"
                      style={{ scrollPadding: '0 1rem' }}
                    >
                      {phaseGroups.map((phaseGroup, index) => {
                        const isActive = index === activePhaseIndex;
                        const isCompleted = phaseGroup.isCompleted;
                        // A phase is "past" if it's completed OR if it's before the active phase AND completed
                        // But we should only mark as past if it's actually completed, not just before active
                        const isPast = isCompleted && index < activePhaseIndex;
                        const phaseName = getPhaseNameTranslated(phaseGroup.phase);
                        const isPurchasable = purchasablePhaseIndices.has(index);
                        
                        // Determine if this phase should be grayed out (same logic as warnings)
                        // Only gray out if: not completed, not purchasable, and after purchasable phases
                        const shouldGrayOut = !isCompleted && !isPurchasable && 
                          firstIncompletePhaseIndex !== -1 && 
                          purchasablePhaseIndices.size > 0 && 
                          index > Math.max(...Array.from(purchasablePhaseIndices));
                        
                        return (
                          <div key={phaseGroup.phase} className="flex items-center flex-shrink-0 min-w-[100px]">
                            {/* Phase Dot */}
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                <button
                                  onClick={() => handlePhaseClick(index)}
                                  className={`relative z-10 flex flex-col items-center gap-1.5 transition-all pt-1 pb-2 ${
                                    isActive ? 'scale-110' : 'hover:scale-105'
                                  }`}
                                >
                                  {/* Active indicator dot - positioned above circle */}
                                  {isActive && (
                                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full z-20 shadow-sm" />
                                  )}
                                  <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0
                                    ${isCompleted 
                                      ? 'bg-green-500 border-green-600 shadow-lg' 
                                      : shouldGrayOut
                                        ? 'bg-gray-100 border-gray-200 opacity-60'
                                        : isPurchasable
                                          ? isActive
                                            ? 'bg-primary border-primary shadow-lg ring-2 ring-primary/20'
                                            : 'bg-primary/10 border-primary shadow-sm'
                                          : isPast
                                            ? 'bg-gray-300 border-gray-400'
                                            : 'bg-gray-200 border-gray-300'
                                    }
                                  `}>
                                    {isCompleted ? (
                                      <CheckCircle className="w-5 h-5 text-white" />
                                    ) : (
                                      <div className={`w-5 h-5 flex items-center justify-center ${
                                        shouldGrayOut 
                                          ? 'text-gray-400 opacity-60' 
                                          : isPurchasable 
                                            ? 'text-primary' 
                                            : 'text-white'
                                      }`}>
                                        {(() => {
                                          const icon = getPhaseIcon(phaseGroup.phase);
                                          // Clone the icon and override its color and size classes
                                          if (icon && icon.props) {
                                            const originalClassName = icon.props.className || '';
                                            let iconColor = 'text-white';
                                            if (shouldGrayOut) {
                                              iconColor = 'text-gray-400';
                                            } else if (isPurchasable) {
                                              iconColor = 'text-primary';
                                            }
                                            const newClassName = originalClassName
                                              .replace('text-primary', '')
                                              .replace('w-8 h-8', 'w-5 h-5')
                                              + ' ' + iconColor;
                                            return React.cloneElement(icon, {
                                              className: newClassName.trim()
                                            });
                                          }
                                          return icon;
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                  <div className={`
                                    text-xs font-medium text-center px-1 w-full
                                    ${isActive ? 'text-primary font-semibold' : 'text-gray-600'}
                                  `}>
                                    <div className="line-clamp-2 leading-tight min-h-[2rem]">
                                      {phaseName}
                                    </div>
                                  </div>
                                </button>
                                </TooltipTrigger>
                                <TooltipContent className="z-[9999]" side="top" sideOffset={5}>
                                <p className="text-sm font-medium">{phaseName}</p>
                                {isCompleted && (
                                  <p className="text-xs text-gray-500 mt-1">{t("projectItems.completed")}</p>
                                )}
                                {!isCompleted && !isPurchasable && (
                                  <p className="text-xs text-gray-500 mt-1">{t("projectItems.phaseNotAvailable.itemDisabled")}</p>
                                )}
                                </TooltipContent>
                              </Tooltip>
                            
                            {/* Connector Line */}
                            {index < phaseGroups.length - 1 && (
                              <div className={`
                                w-16 sm:w-20 md:w-24 h-0.5 mx-2 transition-all flex-shrink-0
                                ${isPast || isActive ? 'bg-green-500' : 'bg-gray-300'}
                              `} 
                              style={{ marginTop: '-20px' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation for non-purchasable phases */}
                  {(() => {
                    // DEBUG: Log all relevant values
                    console.log('=== WARNING DEBUG ===');
                    console.log('viewMode:', viewMode);
                    console.log('firstIncompletePhaseIndex:', firstIncompletePhaseIndex);
                    console.log('purchasablePhaseIndices:', Array.from(purchasablePhaseIndices));
                    console.log('phaseGroups.length:', phaseGroups.length);
                    console.log('phaseGroups:', phaseGroups.map((pg, idx) => ({
                      index: idx,
                      phase: pg.phase,
                      isCompleted: pg.isCompleted,
                      progress: pg.progress,
                      isPurchasable: purchasablePhaseIndices.has(idx)
                    })));
                    console.log('currentActivePhase index:', activePhaseIndex);
                    console.log('currentActivePhase:', currentActivePhase?.phase, 'isPurchasable:', currentActivePhase ? purchasablePhaseIndices.has(activePhaseIndex) : 'N/A');
                    
                    // Only show warning in overview mode
                    if (viewMode !== 'overview') {
                      console.log('❌ Not in overview mode');
                      return false;
                    }
                    
                    // Case 1: All phases are completed - no warning needed
                    if (firstIncompletePhaseIndex === -1) {
                      console.log('❌ All phases completed');
                      return false;
                    }
                    
                    // Case 2: No purchasable phases (shouldn't happen, but safety check)
                    if (purchasablePhaseIndices.size === 0) {
                      console.log('❌ No purchasable phases');
                      return false;
                    }
                    
                    // Get the maximum purchasable phase index
                    const purchasableIndicesArray = Array.from(purchasablePhaseIndices);
                    if (purchasableIndicesArray.length === 0) {
                      console.log('❌ Purchasable indices array is empty');
                      return false;
                    }
                    const maxPurchasableIndex = Math.max(...purchasableIndicesArray);
                    console.log('maxPurchasableIndex:', maxPurchasableIndex);
                    console.log('activePhaseIndex:', activePhaseIndex);
                    console.log('Is active phase purchasable?', purchasablePhaseIndices.has(activePhaseIndex));
                    
                    // NEW: Only show warning if the user is currently viewing a NON-purchasable phase
                    // This way the warning only appears when relevant
                    const isViewingPurchasablePhase = purchasablePhaseIndices.has(activePhaseIndex);
                    if (isViewingPurchasablePhase) {
                      console.log('❌ Currently viewing a purchasable phase - no warning needed');
                      return false;
                    }
                    
                    // Safety check: if maxPurchasableIndex is already the last phase, no warning needed
                    if (maxPurchasableIndex >= phaseGroups.length - 1) {
                      console.log('❌ Max purchasable index is last phase');
                      return false;
                    }
                    
                    // Now check: Are there any incomplete phases AFTER the last purchasable phase?
                    // We iterate through all phases AFTER the last purchasable one
                    // and check if any of them are incomplete (not completed)
                    
                    // Start checking from the phase AFTER the last purchasable one
                    // We explicitly skip all purchasable phases and only check phases after them
                    console.log(`Checking phases from index ${maxPurchasableIndex + 1} to ${phaseGroups.length - 1}`);
                    for (let i = maxPurchasableIndex + 1; i < phaseGroups.length; i++) {
                      // Double-check: this index should NOT be in purchasable phases
                      if (purchasablePhaseIndices.has(i)) {
                        console.log(`⚠️ Index ${i} is in purchasable phases (should not happen), skipping`);
                        continue;
                      }
                      
                      const phaseGroup = phaseGroups[i];
                      
                      // Safety check: phaseGroup must exist
                      if (!phaseGroup) {
                        console.log(`⚠️ PhaseGroup at index ${i} does not exist, skipping`);
                        continue;
                      }
                      
                      console.log(`Checking phase ${i} (${phaseGroup.phase}): isCompleted=${phaseGroup.isCompleted}, progress=${phaseGroup.progress}`);
                      
                      // Check if this phase is incomplete
                      // A phase is incomplete if isCompleted is explicitly false
                      // We use strict equality to avoid truthy/falsy issues
                      if (phaseGroup.isCompleted === false) {
                        console.log(`✅ Found incomplete phase at index ${i} - SHOWING WARNING`);
                        return true;
                      } else {
                        console.log(`Phase ${i} is completed, continuing...`);
                      }
                    }
                    
                    // No incomplete phases found after purchasable phases
                    console.log('❌ No incomplete phases found after purchasable phases');
                    return false;
                  })() && (
                    <Card className="p-4 bg-blue-50/50 border-blue-200/50 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <Info className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-blue-900 text-sm mb-1">
                            {t("projectItems.phaseNotAvailable.title")}
                          </h4>
                          <p className="text-xs text-blue-700 leading-relaxed">
                            {t("projectItems.phaseNotAvailable.description")}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Active Phase Card - Redesigned with Expandable Items */}
                  {currentActivePhase && (
                    <div ref={activePhaseCardRef} className="relative">
                      {/* Navigation Arrows */}
                      {phaseGroups.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToPreviousPhase}
                            disabled={activePhaseIndex === 0}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 hidden lg:flex"
                          >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToNextPhase}
                            disabled={activePhaseIndex === phaseGroups.length - 1}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 hidden lg:flex"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </>
                      )}

                      <Card 
                        className={`transition-all duration-300 ${
                          currentActivePhase.isCompleted 
                            ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-300' 
                            : 'bg-gradient-to-br from-white to-primary-light/10 border-2 border-primary/30 shadow-lg'
                        }`}
                      >
                        {/* Phase Header - Compact */}
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                              <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                                ${currentActivePhase.isCompleted 
                                  ? 'bg-green-500' 
                                  : 'bg-primary'
                                }
                              `}>
                                {currentActivePhase.isCompleted ? (
                                  <CheckCircle className="w-6 h-6 text-white" />
                                ) : (
                                  <div className="text-white">
                                    {getPhaseIcon(currentActivePhase.phase)}
                              </div>
                            )}
                          </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h3 className="text-lg font-bold text-gray-900 break-words">
                                    {getPhaseNameTranslated(currentActivePhase.phase)}
                                  </h3>
                                  {currentActivePhase.isCompleted && (
                                    <Badge className="bg-green-600 text-white text-xs">
                                      {t("projectItems.completed")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-600">
                                  <span>{currentActivePhase.items.length} {t("projectItems.items")}</span>
                                  <span>•</span>
                                  <span className="font-semibold">{currentActivePhase.progress.toFixed(0)}% {t("projectItems.progress")}</span>
                                </div>
                          </div>
                        </div>

                            {/* Progress Bar - Compact */}
                            <div className="flex flex-col items-end gap-1 flex-shrink-0 w-full sm:w-auto">
                              <div className="w-full sm:w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-green-500 via-primary to-primary" 
                                  style={{ width: `${currentActivePhase.progress}%` }} 
                                />
                          </div>
                              <div className="text-xs text-gray-500">
                                {formatCurrency(currentActivePhase.spent + currentActivePhase.cartValue)} / {formatCurrency(currentActivePhase.budget)}
                          </div>
                        </div>
                      </div>
                    </div>

                        {/* One-Click Add Next Item - Prominent */}
                        {!currentActivePhase.isCompleted && (() => {
                          const nextItemInPhase = currentActivePhase.items
                            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                            .find(item => {
                              const cartQuantity = getItemCartQuantity(item.itemId);
                              return !item.purchased && (item.qtyFunded + cartQuantity) < item.qtyNeededTotal;
                            });
                          
                          return nextItemInPhase ? (
                            <div className="p-4 bg-gradient-to-r from-orange-50 to-primary-light/20 border-b border-orange-200">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex-1 min-w-0 w-full">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                                      {t("projectItems.nextItem") || "Nächstes Item"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-gray-900 text-base break-words">
                                      {getItemDisplayName(nextItemInPhase)}
                                    </h4>
                                    {getItemBlurb(nextItemInPhase) && (
                                      <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                          <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                                        </TooltipTrigger>
                                        <TooltipContent 
                                          className="max-w-xs z-[9999]" 
                                          side="top"
                                          sideOffset={5}
                                        >
                                          <p className="text-sm">{getItemBlurb(nextItemInPhase)}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-700 font-semibold">{nextItemInPhase.qtyFunded + getItemCartQuantity(nextItemInPhase.itemId)}</span>
                                      <span className="text-gray-400">/</span>
                                      <span className="text-gray-700 font-semibold">{nextItemInPhase.qtyNeededTotal}</span>
                                      <span className="text-gray-500 ml-2">
                                        {t("projectItems.stillNeeded")} {nextItemInPhase.qtyNeededTotal - nextItemInPhase.qtyFunded - getItemCartQuantity(nextItemInPhase.itemId)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0 w-full sm:w-auto">
                                  {/* Price - Above cart button */}
                                  <div className="flex flex-col items-end gap-0.5">
                                    <div className="text-xl font-bold text-primary">
                                      {formatCurrency(nextItemInPhase.unitCostEUR)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {t("projectItems.perUnit")?.replace("{unit}", getItemUnit(nextItemInPhase)) || `pro ${getItemUnit(nextItemInPhase)}`}
                                    </div>
                                  </div>
                                  {/* Quantity Controls */}
                                  {(() => {
                                    const nextItemCartQuantity = getItemCartQuantity(nextItemInPhase.itemId);
                                    const nextItemRemaining = nextItemInPhase.qtyNeededTotal - nextItemInPhase.qtyFunded - nextItemCartQuantity;
                                    const nextItemIsFullyFunded = nextItemInPhase.qtyFunded >= nextItemInPhase.qtyNeededTotal;
                                    
                                    return !nextItemIsFullyFunded ? (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeItemPiece(nextItemInPhase.itemId)}
                                          disabled={nextItemCartQuantity === 0}
                                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </Button>
                                        <span className="text-xs font-medium text-gray-600 min-w-[1.25rem] text-center">
                                          {nextItemCartQuantity}
                                        </span>
                                        <Tooltip delayDuration={0}>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => addItemPieceWithCartOpen(nextItemInPhase)}
                                              disabled={nextItemRemaining === 0 || !isItemPurchasable(nextItemInPhase)}
                                              className="h-7 w-7 p-0 text-gray-500 hover:text-primary hover:bg-primary/10 disabled:opacity-30"
                                            >
                                              <Plus className="w-3.5 h-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          {!isItemPurchasable(nextItemInPhase) && !nextItemIsFullyFunded && (
                                            <TooltipContent className="z-[9999] max-w-xs" side="top" sideOffset={5}>
                                              <p className="text-sm">{t("projectItems.phaseNotAvailable.itemDisabled")}</p>
                                            </TooltipContent>
                                          )}
                                        </Tooltip>
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {/* Expandable Items List */}
                        <Collapsible 
                          open={expandedPhaseItems === currentActivePhase.phase}
                          onOpenChange={(open) => setExpandedPhaseItems(open ? currentActivePhase.phase : null)}
                        >
                          <CollapsibleTrigger asChild>
                            <button className="w-full p-4 border-b border-gray-200 hover:bg-gray-50/50 transition-colors text-left">
                              <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-700">
                                    {t("projectItems.allItems") || "Items"}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {(() => {
                                      const nextItemInPhase = currentActivePhase.items
                                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                        .find(i => {
                                          const cq = getItemCartQuantity(i.itemId);
                                          return !i.purchased && (i.qtyFunded + cq) < i.qtyNeededTotal;
                                        });
                                      // Subtract 1 if nextItemInPhase exists (it's shown separately)
                                      return nextItemInPhase ? currentActivePhase.items.length - 1 : currentActivePhase.items.length;
                                    })()}
                                  </Badge>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
                                  expandedPhaseItems === currentActivePhase.phase ? 'rotate-180' : ''
                                }`} />
                      </div>
                    </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-3 space-y-1.5 overflow-x-hidden">
                              {currentActivePhase.items
                                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                .filter((item) => {
                                  // Exclude the next item in phase from the list (it's shown separately above)
                                  const cartQuantity = getItemCartQuantity(item.itemId);
                                  const isNextItem = !item.purchased && (item.qtyFunded + cartQuantity) < item.qtyNeededTotal;
                                  const nextItemInPhase = currentActivePhase.items
                                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                    .find(i => {
                                      const cq = getItemCartQuantity(i.itemId);
                                      return !i.purchased && (i.qtyFunded + cq) < i.qtyNeededTotal;
                                    });
                                  return !nextItemInPhase || item.itemId !== nextItemInPhase.itemId;
                                })
                                .map((item) => {
                                  const cartQuantity = getItemCartQuantity(item.itemId);
                                  const isFullyFunded = item.qtyFunded >= item.qtyNeededTotal; // Only funded via Excel, not cart
                                  const isFullyComplete = item.qtyFunded + cartQuantity >= item.qtyNeededTotal; // Visual state (green)
                                  const remainingPieces = item.qtyNeededTotal - item.qtyFunded - cartQuantity;
                                  const progressPercent = getProgressPercentage(item);
                                  
                                  return (
                                    <div
                                      key={item.itemId}
                                      className={`group relative p-3 rounded-lg border transition-all hover:shadow-sm ${
                                        isFullyComplete 
                                          ? 'bg-green-50/30 border-green-200/50' 
                                          : cartQuantity > 0 
                                            ? 'bg-primary-light/10 border-primary/20' 
                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      {/* Main Content Row */}
                                      <div className="flex items-start justify-between gap-3 mb-2">
                                        {/* Left: Name and Quantity Info */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start gap-2 mb-1">
                                            {isFullyComplete ? (
                                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            ) : (
                                              <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                              <h5 className="font-medium text-sm text-gray-900 break-words leading-snug">
                                                {getItemDisplayName(item)}
                                              </h5>
                                              {getItemBlurb(item) && (
                                                <Tooltip delayDuration={0}>
                                                  <TooltipTrigger asChild>
                                                    <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                                                  </TooltipTrigger>
                                                  <TooltipContent 
                                                    className="max-w-xs z-[9999]" 
                                                    side="top"
                                                    sideOffset={5}
                                                  >
                                                    <p className="text-sm">{getItemBlurb(item)}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {/* Quantity and Progress Info */}
                                          <div className="flex items-center gap-2 text-xs text-gray-500 ml-6">
                                            <span>
                                              {item.qtyFunded + cartQuantity} / {item.qtyNeededTotal} {getItemUnit(item)}
                                            </span>
                                            {remainingPieces > 0 && (
                                              <>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-orange-600 font-medium">
                                                  {remainingPieces} {t("projectItems.stillNeeded")}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {/* Right: Quantity Controls and Price */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {/* Quantity Controls - Only hide if fully funded via Excel (not just cart) */}
                                          {!isFullyFunded && (
                                            <div className="flex items-center gap-1">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeItemPiece(item.itemId)}
                                                disabled={cartQuantity === 0}
                                                className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                                              >
                                                <Minus className="w-3.5 h-3.5" />
                                              </Button>
                                              <span className="text-xs font-medium text-gray-600 min-w-[1.25rem] text-center">
                                                {cartQuantity}
                                              </span>
                                              <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => addItemPieceWithCartOpen(item)}
                                                    disabled={remainingPieces === 0 || !isItemPurchasable(item)}
                                                    className="h-7 w-7 p-0 text-gray-500 hover:text-primary hover:bg-primary/10 disabled:opacity-30"
                                                  >
                                                    <Plus className="w-3.5 h-3.5" />
                                                  </Button>
                                                </TooltipTrigger>
                                                {!isItemPurchasable(item) && !isFullyComplete && (
                                                  <TooltipContent className="z-[9999] max-w-xs" side="top" sideOffset={5}>
                                                    <p className="text-sm">{t("projectItems.phaseNotAvailable.itemDisabled")}</p>
                                                  </TooltipContent>
                                                )}
                                              </Tooltip>
                                            </div>
                                          )}
                                          
                                          {/* Price */}
                                          <div className="flex flex-col items-end gap-0.5">
                                            <div className="text-base font-bold text-primary">
                                              {formatCurrency(item.unitCostEUR)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                              {t("projectItems.perUnit")?.replace("{unit}", getItemUnit(item)) || `pro ${getItemUnit(item)}`}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Progress Bar - Visual Indicator */}
                                      {progressPercent < 100 && (
                                        <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                                          <div 
                                            className="h-full bg-primary/60 transition-all"
                                            style={{ width: `${progressPercent}%` }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                          </Card>
                      </div>
                    )}

                  {/* Mobile Navigation Dots */}
                  {phaseGroups.length > 1 && (
                    <div className="flex items-center justify-center gap-2 lg:hidden">
                      {phaseGroups.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActivePhaseIndex(index)}
                          className={`
                            w-2 h-2 rounded-full transition-all
                            ${index === activePhaseIndex 
                              ? 'w-8 bg-primary' 
                              : 'bg-gray-300'
                            }
                          `}
                          aria-label={`Go to phase ${index + 1}`}
                        />
                        ))}
                  </div>
                )}
                  </div>
              </div>
            ) : (
              /* Details View */
              <div className="space-y-2">
              {/* Flexible Donation Option - Compact */}
              <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-primary-light/15 to-primary-light/5 rounded-lg border border-primary/20 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Heart className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs text-gray-700">
                    {t("projectItems.unrestrictedDonation.description")}
                  </span>
                </div>
                <Link 
                  to={`/donation?project=${encodeURIComponent(projectCost.projectName)}`}
                  onClick={() => {
                    closeCart();
                    onClose();
                  }}
                >
                  <Button
                    size="sm"
                    className="h-8 px-3 bg-primary hover:bg-primary/90 text-white text-xs font-semibold whitespace-nowrap flex-shrink-0"
                  >
                    <Heart className="w-3 h-3 mr-1.5" />
                    {t("projectItems.unrestrictedDonation.button")}
                  </Button>
                </Link>
              </div>

              {/* Compact Filter Bar */}
              <div className="sticky top-0 z-20 bg-white border-b pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  {/* Item Count */}
                  <div className="text-xs text-gray-500">
                    {searchQuery 
                      ? t("projectItems.itemsFiltered").replace("{count}", filteredItems.length.toString())
                      : `${filteredItems.length} ${t("projectItems.items")}`}
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
                        placeholder={t("projectItems.search")}
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
                          <SelectValue placeholder={t("projectItems.category")} />
                        </SelectTrigger>
                        <SelectContent className="z-[70]">
                          <SelectItem value="all">{t("projectItems.allCategories")}</SelectItem>
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
                        <SelectItem value="remaining">{t("projectItems.sort.priority")}</SelectItem>
                        <SelectItem value="name">{t("projectItems.sort.name")}</SelectItem>
                        <SelectItem value="price">{t("projectItems.sort.price")}</SelectItem>
                        <SelectItem value="progress">{t("projectItems.sort.progress")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* Funded Items - Collapsed by default */}
              {fundedItems.length > 0 && (
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection('funded')}
                    className="sticky top-[60px] z-10 w-full text-left text-sm font-semibold text-green-700 mb-2 flex items-center justify-between hover:bg-green-50 px-4 sm:px-6 py-3 rounded-lg transition-colors bg-green-50/80 backdrop-blur-sm border-2 border-green-200 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      {expandedSections.funded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <CheckCircle className="w-5 h-5" />
                      <span>{t("projectItems.fullyFunded")}</span>
                      <Badge variant="secondary" className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-700">
                        {fundedItems.length}
                      </Badge>
                    </div>
                  </button>
                  {expandedSections.funded && (
                    <div className={viewStyle === 'compact' 
                      ? 'grid grid-cols-1 gap-3' 
                      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    }>
                      {fundedItems.map(item => renderItemCard(item, false))}
                    </div>
                  )}
                </div>
              )}

              {/* Active Items - Combined Partially Funded & Unfunded - No Toggle */}
              {(partiallyFundedItems.length > 0 || unfundedItems.length > 0) && (
                <div className="space-y-4">
                  {(partiallyFundedItems.length > 0 || unfundedItems.length > 0) && (
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {t("projectItems.availableItems") || "Available Items"}
                      </h3>
                      <Badge variant="outline" className="ml-2">
                        {partiallyFundedItems.length + unfundedItems.length}
                      </Badge>
                    </div>
                  )}
                  <div className={viewStyle === 'compact' 
                    ? 'grid grid-cols-1 gap-3' 
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  }>
                  {[...partiallyFundedItems, ...unfundedItems].map(item => {
                    const isNextImportant = nextImportantItem?.itemId === item.itemId;
                    return renderItemCard(item, isNextImportant);
                  })}
                  </div>
                </div>
              )}

              {/* No items found */}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>{t("projectItems.noItemsFound")}</p>
                  <p className="text-sm">{t("projectItems.tryOtherFilters")}</p>
                </div>
              )}
            </div>
          )}
          </div>

        </div>

        {/* Floating CTA removed - now using footer cart link */}

        {/* Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-3 items-center pt-4 pb-6 sm:pb-8 border-t px-4 sm:px-6 bg-white flex-shrink-0">
          {/* Left: Item Count */}
          <div className="text-sm text-muted-foreground">
            {viewMode === 'overview' 
              ? t("projectItems.itemsTotal").replace("{count}", projectCost.totalItems.toString())
              : t("projectItems.itemsShown").replace("{shown}", filteredItems.length.toString()).replace("{total}", projectCost.totalItems.toString())}
          </div>
          
          {/* Center: Budget Summary - always centered, hidden on mobile */}
          <div className="hidden sm:flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-sm font-bold text-green-600">
                {viewMode === 'overview' 
                  ? formatCurrency(projectCost.items.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0))
                  : formatCurrency(filteredItems.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0))
                }
              </div>
              <div className="text-xs text-gray-600">{t("projectItems.paid")}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-600">
                {viewMode === 'overview'
                  ? formatCurrency(projectCost.totalBudget - projectCost.items.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0))
                  : formatCurrency(filteredItems.reduce((sum, item) => sum + (item.totalCostEUR || 0), 0) - filteredItems.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0))
                }
              </div>
              <div className="text-xs text-gray-600">{t("projectItems.pending")}</div>
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
              <div className="text-xs text-gray-600">{t("projectItems.progress")}</div>
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
                  <span>{t("projectItems.cart")}</span>
                  <span className="font-semibold">
                    {formatCurrency(cartState.totalAmount)}
                  </span>
                </Button>
                {showCartDrawer && (
                  <Link to="/donation" onClick={() => { closeCart(); setShowCartDrawer(false); }}>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
                    >
                      {t("projectItems.donateNow")}
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
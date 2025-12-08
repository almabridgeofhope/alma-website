import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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
    // Always use "Stück" in German, otherwise use the original unit or fallback to "piece"
    if (language === 'de') {
      return 'Stück';
    }
    return item.unit || 'piece';
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
  const [expandedSections, setExpandedSections] = useState({
    funded: false
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'progress' | 'remaining'>('remaining');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [showCompletedPhases, setShowCompletedPhases] = useState(false);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0); // For timeline navigation
  const [expandedPhaseItems, setExpandedPhaseItems] = useState<string | null>(null); // Track which phase items are expanded


  // Track if modal was just opened to handle cart navigation differently
  const isInitialOpenRef = React.useRef(false);
  // Track if hash change is from external source (cart click) - should scroll
  const isExternalHashChangeRef = React.useRef(false);
  
  // Set initial URL when modal opens - don't override hash from cart
  useEffect(() => {
    if (isOpen) {
      // Only set isInitialOpenRef if it's not already set (first time opening)
      if (!isInitialOpenRef.current) {
        isInitialOpenRef.current = true;
        // Check if hash is provided from external source (cart click)
        const currentHash = location.hash.replace('#', '');
        const params = new URLSearchParams(location.search);
        const itemId = params.get('itemId');
        
        console.log('[Scroll Debug] Modal opened with:', { currentHash, itemId, isOpen });
        
        if (currentHash && currentHash !== 'all' && itemId) {
          // Hash from cart with itemId - mark as external navigation (should scroll)
          console.log('[Scroll Debug] Marking as external hash change from cart');
          isExternalHashChangeRef.current = true;
          // Reset previousHash so Effect 1 recognizes this as a change
          previousHashRef.current = '';
        } else if (!currentHash || currentHash === 'all') {
          // No hash - normal modal open, set to 'all' only if not already set
          // Use requestAnimationFrame to avoid conflicts with other effects
          requestAnimationFrame(() => {
            if (location.hash !== '#all') {
              navigate(`${location.pathname}#all`, { replace: true });
              previousHashRef.current = '#all';
            }
          });
        }
      }
    } else if (!isOpen) {
      // Modal closed - reset all refs
      isInitialOpenRef.current = false;
      isExternalHashChangeRef.current = false;
      isInternalNavigationRef.current = false;
      // Reset scroll state when modal closes
      setPendingScrollTarget(null);
      scrollAttemptsRef.current = 0;
      previousHashRef.current = '';
    }
  }, [isOpen, location.pathname, location.hash, location.search, navigate]);


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

  // Track if we're navigating internally to prevent useEffect from overriding manual clicks
  const isInternalNavigationRef = React.useRef(false);
  // Track previous hash to detect external changes
  const previousHashRef = React.useRef<string>('');
  // Track highlighted item from cart
  const [highlightedItemId, setHighlightedItemId] = React.useState<string | null>(null);
  // Ref for the scroll container
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  // Track pending scroll target (itemId to scroll to)
  const [pendingScrollTarget, setPendingScrollTarget] = React.useState<{ itemId: string; phase: string } | null>(null);
  // Track scroll attempts to prevent infinite retries
  const scrollAttemptsRef = React.useRef(0);
  // Trigger retry by updating this state
  const [scrollRetryTrigger, setScrollRetryTrigger] = React.useState(0);

  // Effect 1: Handle hash-based phase selection (separate from scrolling)
  useEffect(() => {
    if (!isOpen) return;
    
    // Skip if this is an internal navigation (user clicked phase)
    // This prevents Effect 1 from overriding manual phase clicks
    if (isInternalNavigationRef.current) {
      isInternalNavigationRef.current = false;
      previousHashRef.current = location.hash;
      // Still update expanded phase to match hash if needed
      const hash = decodeURIComponent(location.hash.replace('#', '')) || 'all';
      const phaseIndex = phases.findIndex(p => p === hash);
      if (phaseIndex !== -1 && phaseIndex !== activePhaseIndex) {
        setActivePhaseIndex(phaseIndex);
      }
      return;
    }
    
    const hash = decodeURIComponent(location.hash.replace('#', '')) || 'all';
    const params = new URLSearchParams(location.search);
    const itemId = params.get('itemId');
    
    // Determine if this is an external hash change (cart click)
    // Check if modal was just opened with hash and itemId (from cart)
    const isModalOpenWithCartItem = isInitialOpenRef.current && hash !== 'all' && !!itemId;
    
    // If modal opened with cart item, reset previousHash to ensure hash change is detected
    if (isModalOpenWithCartItem && previousHashRef.current === location.hash) {
      previousHashRef.current = '';
    }
    
    const previousHash = decodeURIComponent(previousHashRef.current.replace('#', '')) || 'all';
    
    // Only treat as external change if:
    // 1. Explicitly marked as external (from cart click)
    // 2. Modal opened with cart item (has itemId) AND this is the first time we're processing it
    // 3. Hash changed AND not from internal navigation AND has itemId (cart click while modal open)
    // Note: isInitialOpenRef is only true on the very first render after modal opens
    const isExternalChange = !!isExternalHashChangeRef.current || 
      (isModalOpenWithCartItem && isInitialOpenRef.current) ||
      (hash !== previousHash && hash !== 'all' && !isInitialOpenRef.current && !!itemId && !isInternalNavigationRef.current);
    
    console.log('[Scroll Debug] Effect 1 - Hash change:', {
      hash,
      previousHash,
      itemId,
      isExternalChange,
      isInitialOpen: isInitialOpenRef.current,
      isExternalHashChangeRef: isExternalHashChangeRef.current,
      isModalOpenWithCartItem
    });
    
    // Find phase index for current hash
    const phaseIndex = phases.findIndex(p => p === hash);
    
    // Always update phase index if hash is valid and different from current
    if (hash !== 'all' && phaseIndex !== -1) {
      const shouldUpdatePhase = phaseIndex !== activePhaseIndex;
      
      if (shouldUpdatePhase) {
        console.log('[Scroll Debug] Phase index found:', phaseIndex, 'for hash:', hash);
        // Use functional update to ensure we're using the latest state
        setActivePhaseIndex(prevIndex => {
          if (prevIndex !== phaseIndex) {
            return phaseIndex;
          }
          return prevIndex;
        });
      }
      
      // If external change with itemId, set up scroll target FIRST
      // This must happen before expanding phase to ensure proper coordination
      if (isExternalChange && itemId) {
        console.log('[Scroll Debug] Setting scroll target:', { itemId, phase: hash });
        setPendingScrollTarget({ itemId, phase: hash });
        setHighlightedItemId(itemId);
        scrollAttemptsRef.current = 0; // Reset attempts for new target
        setScrollRetryTrigger(0); // Reset retry trigger
        // Remove highlight after 3 seconds
        setTimeout(() => setHighlightedItemId(null), 3000);
        // Effect 2 will expand the phase
        // Mark that we've processed this external change
        isExternalHashChangeRef.current = false;
      } else if (!isExternalChange) {
        // External hash change without itemId (e.g., direct link or browser back)
        // Expand phase immediately
        if (expandedPhaseItems !== hash) {
          console.log('[Scroll Debug] Expanding phase (external hash):', hash);
          setExpandedPhaseItems(hash);
        }
      }
    } else if (hash === 'all' && activePhaseIndex !== 0) {
      setActivePhaseIndex(0);
    }
    
    // Update previous hash
    previousHashRef.current = location.hash;
    
    // Reset isInitialOpenRef after processing completes
    // This ensures phase clicks work correctly after modal has been open
    if (isInitialOpenRef.current) {
      if (!itemId || !isExternalChange) {
        // If no itemId or not an external change, reset immediately
        // This handles normal modal opens and internal navigation
        isInitialOpenRef.current = false;
      } else if (itemId && isExternalChange) {
        // If we're processing an external change with itemId, reset after scroll completes
        // This is handled in Effect 3 when scroll completes
        // Don't reset here to allow scroll to complete
      }
    }
    
    // Note: isExternalHashChangeRef is reset inside the if block above to prevent loops
    // Note: We don't include activePhaseIndex or expandedPhaseItems in dependencies to avoid loops
    // These are read from state inside the effect, which is safe because we only update them conditionally
  }, [isOpen, location.hash, location.search, phases]);

  // Effect 2: Expand phase when scroll target is set
  useEffect(() => {
    if (pendingScrollTarget) {
      console.log('[Scroll Debug] Effect 2 - Expanding phase:', pendingScrollTarget.phase);
      setExpandedPhaseItems(pendingScrollTarget.phase);
      // Also ensure activePhaseIndex is set correctly
      const phaseIndex = phases.findIndex(p => p === pendingScrollTarget.phase);
      if (phaseIndex !== -1) {
        setActivePhaseIndex(phaseIndex);
      }
    }
  }, [pendingScrollTarget, phases]);

  // Effect 3: Scroll to item when phase is expanded and scroll target exists
  useEffect(() => {
    if (!pendingScrollTarget || !scrollContainerRef.current) {
      if (!pendingScrollTarget) {
        console.log('[Scroll Debug] Effect 3 - No pending scroll target');
      } else {
        console.log('[Scroll Debug] Effect 3 - Scroll container not ready');
      }
      scrollAttemptsRef.current = 0;
      return;
    }
    
    const { itemId, phase } = pendingScrollTarget;
    
    console.log('[Scroll Debug] Effect 3 - Attempting scroll:', {
      itemId,
      phase,
      expandedPhaseItems,
      attempts: scrollAttemptsRef.current,
      scrollContainerReady: !!scrollContainerRef.current
    });
    
    // Check if phase is expanded - wait for it
    if (expandedPhaseItems !== phase) {
      // Wait for phase to expand - but don't reset attempts, just wait
      console.log('[Scroll Debug] Waiting for phase expansion. Current:', expandedPhaseItems, 'Target:', phase);
      // Don't increment attempts while waiting for expansion
      if (scrollAttemptsRef.current === 0) {
        scrollAttemptsRef.current = 1; // Start counting only after expansion
      }
      return;
    }
    
    // Increment attempts
    scrollAttemptsRef.current += 1;
    
    // Max attempts: 20 (about 2 seconds with delays)
    if (scrollAttemptsRef.current > 20) {
      // Give up after max attempts
      console.warn(`[Scroll Debug] Could not find item ${itemId} after ${scrollAttemptsRef.current} attempts`);
      
      // Debug: Check what items are actually in the DOM
      const allItems = document.querySelectorAll('[data-item-id]');
      console.log('[Scroll Debug] Available items in DOM:', Array.from(allItems).map(el => el.getAttribute('data-item-id')));
      
      setPendingScrollTarget(null);
      scrollAttemptsRef.current = 0;
      
      // Clean up URL
      const params = new URLSearchParams(location.search);
      params.delete('itemId');
      const newSearch = params.toString();
      navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}${location.hash}`, { replace: true });
      return;
    }
    
    // Use requestAnimationFrame to ensure DOM is updated
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        const scrollContainer = scrollContainerRef.current;
        
        console.log('[Scroll Debug] Looking for item:', {
          selector: `[data-item-id="${itemId}"]`,
          found: !!itemElement,
          scrollContainerFound: !!scrollContainer,
          attempt: scrollAttemptsRef.current
        });
        
        if (itemElement && scrollContainer) {
          console.log('[Scroll Debug] Item found! Scrolling...');
          
          // Use scrollIntoView with scroll container as the viewport
          // First, ensure the item is in the viewport of the scroll container
          const containerRect = scrollContainer.getBoundingClientRect();
          const itemRect = itemElement.getBoundingClientRect();
          
          // Check if item is already visible in container
          const isItemVisible = itemRect.top >= containerRect.top && 
                               itemRect.bottom <= containerRect.bottom;
          
          if (!isItemVisible) {
            // Calculate position relative to scroll container
            const scrollTop = scrollContainer.scrollTop;
            const itemOffsetTop = itemRect.top - containerRect.top + scrollTop;
            const containerHeight = scrollContainer.clientHeight;
            const itemHeight = itemRect.height;
            const targetScrollTop = itemOffsetTop - (containerHeight / 2) + (itemHeight / 2);
            
            console.log('[Scroll Debug] Scroll calculation:', {
              scrollTop,
              itemOffsetTop,
              containerHeight,
              itemHeight,
              targetScrollTop,
              isItemVisible
            });
            
            // Scroll in the container
            scrollContainer.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth'
            });
          } else {
            console.log('[Scroll Debug] Item already visible, no scroll needed');
          }
          
          // Add highlight class with animation
          itemElement.classList.add('ring-4', 'ring-orange-500', 'ring-offset-2', 'transition-all', 'animate-pulse');
          
          // Remove highlight class after animation
          setTimeout(() => {
            itemElement.classList.remove('ring-4', 'ring-orange-500', 'ring-offset-2', 'animate-pulse');
          }, 3000);
          
          // Clean up: remove itemId from URL and clear scroll target
          const params = new URLSearchParams(location.search);
          params.delete('itemId');
          const newSearch = params.toString();
          navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}${location.hash}`, { replace: true });
          
          setPendingScrollTarget(null);
          scrollAttemptsRef.current = 0;
          // Reset external hash change flag since we've processed the scroll
          isExternalHashChangeRef.current = false;
          // Reset isInitialOpenRef after scroll completes so phase clicks work
          isInitialOpenRef.current = false;
          console.log('[Scroll Debug] Scroll completed successfully!');
        } else if (!itemElement) {
          console.log('[Scroll Debug] Item not found, retrying...');
          // Item not found yet, retry after a short delay
          const timeoutId = setTimeout(() => {
            // Trigger retry by updating retry trigger
            setScrollRetryTrigger(prev => prev + 1);
          }, 100);
          
          return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(rafId);
          };
        }
      });
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [pendingScrollTarget, expandedPhaseItems, scrollRetryTrigger, navigate, location.pathname, location.hash, location.search]);

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
    
    // Interior walls - Innenwände (includes finishing)
    if (phaseLower.includes('innenwände') || 
        (phaseLower.includes('interior') && phaseLower.includes('walls'))) {
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
    if (phaseLower.includes('innenwände') || 
        (phaseLower.includes('interior') && (phaseLower.includes('finishing') || phaseLower.includes('walls')))) {
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
  
  // Find the first incomplete phase index for initial active phase, or use hash if present
  useEffect(() => {
    if (phaseGroups.length > 0) {
      // Check if there's a hash in URL that matches a phase
      const hash = decodeURIComponent(location.hash.replace('#', '')) || 'all';
      if (hash !== 'all') {
        const hashPhaseIndex = phaseGroups.findIndex(pg => pg.phase === hash);
        if (hashPhaseIndex >= 0) {
          setActivePhaseIndex(hashPhaseIndex);
          setExpandedPhaseItems(hash);
          return;
        }
      }
      
      // Otherwise, use first incomplete phase
      const firstIncompleteIndex = phaseGroups.findIndex(phase => !phase.isCompleted);
      if (firstIncompleteIndex >= 0) {
        setActivePhaseIndex(firstIncompleteIndex);
      } else {
        // All phases completed, show last one
        setActivePhaseIndex(phaseGroups.length - 1);
      }
    }
  }, [phaseGroups.length, location.hash]);

  // Auto-scroll timeline to active phase
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const activePhaseCardRef = React.useRef<HTMLDivElement>(null);
  
  // Removed auto-scroll timeline - only scroll on explicit user actions

  // Scroll to active phase card when phase is clicked
  const handlePhaseClick = (index: number) => {
    const clickedPhase = phaseGroups[index];
    if (!clickedPhase) return;
    
    // CRITICAL: Set refs BEFORE any state updates to prevent race conditions
    isInternalNavigationRef.current = true;
    isInitialOpenRef.current = false;
    
    // Update state immediately (synchronous) - this ensures UI updates instantly
    setActivePhaseIndex(index);
    setExpandedPhaseItems(clickedPhase.phase);
    
    // Clear any pending scroll targets from previous navigation
    setPendingScrollTarget(null);
    
    // Remove itemId from URL if present (from previous cart click)
    const params = new URLSearchParams(location.search);
    params.delete('itemId');
    const newSearch = params.toString();
    
    // Update URL hash AFTER state update - this syncs URL with state, not the other way around
    // Use requestAnimationFrame to ensure state updates have been processed
    requestAnimationFrame(() => {
      navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}#${encodeURIComponent(clickedPhase.phase)}`, { replace: false });
      
      // Scroll to the active phase card after DOM updates
      requestAnimationFrame(() => {
        if (activePhaseCardRef.current) {
          activePhaseCardRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      });
    });
  };
  
  // Get current active phase
  const currentActivePhase = phaseGroups[activePhaseIndex] || phaseGroups[0];
  
  // Auto-expand items when phase changes (only if not already expanded)
  // This handles cases where phase changes via URL hash (browser back/forward)
  useEffect(() => {
    if (currentActivePhase && !currentActivePhase.isCompleted) {
      // Only expand if not already expanded and not from internal navigation
      // Internal navigation already sets expandedPhaseItems in handlePhaseClick
      if (expandedPhaseItems !== currentActivePhase.phase && !isInternalNavigationRef.current) {
        setExpandedPhaseItems(currentActivePhase.phase);
      }
    }
  }, [activePhaseIndex, currentActivePhase, expandedPhaseItems]);
  
  // Navigation functions for timeline - update state first, then sync URL
  const goToNextPhase = () => {
    if (activePhaseIndex < phaseGroups.length - 1) {
      const nextIndex = activePhaseIndex + 1;
      const nextPhase = phaseGroups[nextIndex];
      if (nextPhase) {
        // Set refs first to prevent race conditions
        isInternalNavigationRef.current = true;
        isInitialOpenRef.current = false;
        
        // Update state immediately
        setActivePhaseIndex(nextIndex);
        setExpandedPhaseItems(nextPhase.phase);
        setPendingScrollTarget(null);
        
        // Sync URL after state update
        const params = new URLSearchParams(location.search);
        params.delete('itemId');
        const newSearch = params.toString();
        
        requestAnimationFrame(() => {
          navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}#${encodeURIComponent(nextPhase.phase)}`, { replace: false });
        });
      }
    }
  };
  
  const goToPreviousPhase = () => {
    if (activePhaseIndex > 0) {
      const prevIndex = activePhaseIndex - 1;
      const prevPhase = phaseGroups[prevIndex];
      if (prevPhase) {
        // Set refs first to prevent race conditions
        isInternalNavigationRef.current = true;
        isInitialOpenRef.current = false;
        
        // Update state immediately
        setActivePhaseIndex(prevIndex);
        setExpandedPhaseItems(prevPhase.phase);
        setPendingScrollTarget(null);
        
        // Sync URL after state update
        const params = new URLSearchParams(location.search);
        params.delete('itemId');
        const newSearch = params.toString();
        
        requestAnimationFrame(() => {
          navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}#${encodeURIComponent(prevPhase.phase)}`, { replace: false });
        });
      }
    }
  };
  
  // Enhanced swipe for phase navigation
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
      
      // Swipe left = next phase, swipe right = previous phase
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
        isInitialOpenRef.current = false;
        
        if (deltaX < 0 && activePhaseIndex < phaseGroups.length - 1) {
          const nextIndex = activePhaseIndex + 1;
          const nextPhase = phaseGroups[nextIndex];
          if (nextPhase) {
            isInternalNavigationRef.current = true;
            setActivePhaseIndex(nextIndex);
            setExpandedPhaseItems(nextPhase.phase);
            setPendingScrollTarget(null);
            
            const params = new URLSearchParams(location.search);
            params.delete('itemId');
            const newSearch = params.toString();
            
            requestAnimationFrame(() => {
              navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}#${encodeURIComponent(nextPhase.phase)}`, { replace: false });
            });
          }
        } else if (deltaX > 0 && activePhaseIndex > 0) {
          const prevIndex = activePhaseIndex - 1;
          const prevPhase = phaseGroups[prevIndex];
          if (prevPhase) {
            isInternalNavigationRef.current = true;
            setActivePhaseIndex(prevIndex);
            setExpandedPhaseItems(prevPhase.phase);
            setPendingScrollTarget(null);
            
            const params = new URLSearchParams(location.search);
            params.delete('itemId');
            const newSearch = params.toString();
            
            requestAnimationFrame(() => {
              navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}#${encodeURIComponent(prevPhase.phase)}`, { replace: false });
            });
          }
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
  }, [isOpen, activePhaseIndex, phaseGroups.length]);

  // Effect 4: Scroll to active phase card when modal opens with hash
  useEffect(() => {
    if (!isOpen || !activePhaseCardRef.current) return;
    
    const hash = decodeURIComponent(location.hash.replace('#', '')) || 'all';
    if (hash !== 'all' && activePhaseIndex >= 0) {
      // Use requestAnimationFrame for better synchronization
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (activePhaseCardRef.current) {
            activePhaseCardRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        });
      });
    }
  }, [isOpen, activePhaseIndex, location.hash]);

  const renderItemCard = (item: ProjectItem, isNextImportant: boolean = false) => {
    const cartQuantity = getItemCartQuantity(item.itemId);
    const isFullyInCart = isItemFullyInCart(item);
    const isFullyComplete = item.qtyFunded + cartQuantity >= item.qtyNeededTotal;
    const remainingPieces = item.qtyNeededTotal - item.qtyFunded - cartQuantity;
    const progressPercent = getProgressPercentage(item);
    const itemPurchasable = isItemPurchasable(item);
    const isHighlighted = highlightedItemId === item.itemId;
    
    // Always use compact card view
    const tooltipContent = renderItemTooltip(item);
    const itemContent = (
        <Card
          key={item.itemId} 
          data-item-id={item.itemId}
          className={`group p-4 transition-all hover:shadow-md ${
            isHighlighted ? 'ring-4 ring-orange-500 ring-offset-2 bg-orange-50/50 animate-pulse' : ''
          } ${
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
                          <TooltipTrigger>
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
  };

  return (
    <TooltipProvider delayDuration={0}>
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
          <div 
            ref={scrollContainerRef}
            className="min-w-0 h-full overflow-y-auto overflow-x-hidden px-4 sm:px-6 pb-4 relative"
          >
            {/* Timeline-Based Phase Overview */}
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
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger>
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
                                          : isActive
                                            ? 'text-white'
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
                                            } else if (isActive) {
                                              // Active phase: white icon on blue background
                                              iconColor = 'text-white';
                                            } else if (isPurchasable) {
                                              // Purchasable but not active: blue icon
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
                    
                    // Check if the currently viewed phase is completed
                    // If viewing a completed phase, no warning needed (even if it's not purchasable)
                    const currentPhase = phaseGroups[activePhaseIndex];
                    if (currentPhase && currentPhase.isCompleted) {
                      console.log('❌ Currently viewing a completed phase - no warning needed');
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
                        data-phase={currentActivePhase.phase}
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
                                      data-item-id={item.itemId}
                                      className={`group relative p-3 rounded-lg border transition-all hover:shadow-sm ${
                                        highlightedItemId === item.itemId ? 'ring-4 ring-orange-500 ring-offset-2 bg-orange-50/50 animate-pulse' : ''
                                      } ${
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
          </div>

        </div>

        {/* Floating CTA removed - now using footer cart link */}

        {/* Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-3 items-center pt-4 pb-6 sm:pb-8 border-t px-4 sm:px-6 bg-white flex-shrink-0">
          {/* Left: Item Count */}
          <div className="text-sm text-muted-foreground">
            {t("projectItems.itemsTotal").replace("{count}", projectCost.totalItems.toString())}
          </div>
          
          {/* Center: Budget Summary - always centered, hidden on mobile */}
          <div className="hidden sm:flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-sm font-bold text-green-600">
                {formatCurrency(projectCost.items.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0))}
              </div>
              <div className="text-xs text-gray-600">{t("projectItems.paid")}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-600">
                {formatCurrency(projectCost.totalBudget - projectCost.items.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0))}
              </div>
              <div className="text-xs text-gray-600">{t("projectItems.pending")}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-primary">
                {((projectCost.items.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0) / projectCost.totalBudget) * 100).toFixed(1)}%
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
                  <Button 
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
                    onClick={() => {
                      closeCart();
                      setShowCartDrawer(false);
                      navigate("/donation");
                    }}
                  >
                    {t("projectItems.donateNow")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
};
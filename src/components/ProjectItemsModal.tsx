import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShoppingCart } from "@/contexts/ShoppingCartContext";
import { ProjectItem, ProjectCost } from "@/services/clientGoogleSheetsService";
import {
  // Construction phase icons
  FileText,
  Wrench,
  Building,
  // Specific construction icons
  Home,
  Droplets,
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
  const { addItem, isItemInCart, removeFromCart, addItemPiece, removeItemPiece, getItemCartQuantity, isItemFullyInCart, state: cartState, toggleCart } = useShoppingCart();
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');
  const [expandedSections, setExpandedSections] = useState({
    funded: false,
    partiallyFunded: true,
    unfunded: true
  });

  // Handle keyboard navigation (Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to go back to overview
      if (e.key === 'Escape' && viewMode === 'details') {
        setViewMode('overview');
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewMode]);

  // Helper function to navigate to details view
  const navigateToDetails = (phase: string) => {
    setViewMode('details');
    setSelectedPhase(phase);
  };

  // Helper function to navigate back to overview
  const navigateToOverview = () => {
    setViewMode('overview');
  };

  const categories = Array.from(new Set(projectCost.items.map(item => item.category)));
  const phases = Array.from(new Set(projectCost.items.map(item => item.phase)));
  
  const filteredItems = projectCost.items.filter(item => {
    const matchesPhase = selectedPhase === "all" || item.phase === selectedPhase;
    return matchesPhase;
  });

  const fundedItems = filteredItems.filter(item => item.purchased);
  const partiallyFundedItems = filteredItems.filter(item => !item.purchased && item.qtyFunded > 0);
  const unfundedItems = filteredItems.filter(item => !item.purchased && item.qtyFunded === 0);

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
    addItemPiece(item);
    // Force cart to open if it's not already open
    if (!cartState.isOpen) {
      toggleCart();
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
      return <Home className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('electricity') || phaseLower.includes('lighting')) {
      return <Zap className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('bathroom') || phaseLower.includes('sanitary')) {
      return <Droplets className="w-8 h-8 text-primary" />;
    }
    if (phaseLower.includes('painting') || phaseLower.includes('finishing') || phaseLower.includes('paint')) {
      return <Paintbrush className="w-8 h-8 text-primary" />;
    }
    
    return <Package className="w-8 h-8 text-primary" />;
  };

  const getProgressPercentage = (item: ProjectItem) => {
    if (item.qtyNeededTotal === 0) return 0;
    return Math.min((item.qtyFunded / item.qtyNeededTotal) * 100, 100);
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
    // Force cart to open if it's not already open
    if (!cartState.isOpen) {
      toggleCart();
    }
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

  const renderItemCard = (item: ProjectItem) => {
    const cartQuantity = getItemCartQuantity(item.itemId);
    const isFullyInCart = isItemFullyInCart(item);
    const remainingPieces = item.qtyNeededTotal - cartQuantity;
    
    return (
      <Card key={item.itemId} className={`p-2 transition-all hover:shadow-md ${isFullyInCart ? 'bg-green-50 border-green-200' : getStatusColor(item)}`}>
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0">
            {isFullyInCart ? <CheckCircle className="w-4 h-4 text-green-600" /> : getStatusIcon(item)}
          </div>

          {/* Item Name */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate text-sm">{item.displayName}</h4>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {cartQuantity > 0 && (
              <Badge variant="default" className="text-xs px-1 py-0 bg-blue-100 text-blue-700">
                {cartQuantity}
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-xs text-gray-600">
              {item.qtyFunded}/{item.qtyNeededTotal}
            </div>
            <div className="w-12">
              <Progress value={getProgressPercentage(item)} className="h-1" />
            </div>
            <div className="text-xs font-medium w-6 text-right">
              {getProgressPercentage(item).toFixed(0)}%
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(item.unitCostEUR)} / {item.unit}
            </div>
          </div>

          {/* Cart Controls */}
          <div className="flex items-center gap-1 flex-shrink-0 w-20 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => removeItemPiece(item.itemId)}
              disabled={cartQuantity === 0}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Minus className="w-3 h-3" />
            </Button>
            
            <span className="text-xs font-medium w-4 text-center">
              {cartQuantity}
            </span>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => addItemPieceWithCartOpen(item)}
              disabled={remainingPieces === 0}
              className="h-6 w-6 p-0 disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className={`fixed inset-0 z-[55] flex items-center transition-all duration-300 pointer-events-none ${
        cartState.isOpen ? 'justify-start' : 'justify-center'
      }`}>
        <div className={`transition-all duration-300 ${
          cartState.isOpen ? 'w-[calc(50vw-200px)] pl-8' : 'w-full'
        }`}>
          <DialogContent 
            className={`max-h-[90vh] overflow-hidden flex flex-col pr-0 transition-all duration-300 pointer-events-auto ${
              cartState.isOpen 
                ? 'max-w-4xl' // Verkleinert wenn Cart offen
                : 'max-w-7xl' // Normale Größe wenn Cart geschlossen
            }`}
            onPointerDownOutside={(e) => {
              // Prevent closing when clicking on cart
              if (cartState.isOpen) {
                e.preventDefault();
              }
            }}
          >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-6 h-6 text-primary" />
            {projectCost.projectName} - Projekt Details
          </DialogTitle>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          {viewMode === 'overview' ? (
            /* Phase Overview */
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {phaseGroups.map((phaseGroup) => (
                   <Card key={phaseGroup.phase} className="p-3 cursor-pointer transition-all hover:shadow-md">
                    <div className="flex items-center gap-3">
                      {/* Phase Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getPhaseIcon(phaseGroup.phase)}
                        </div>
                      </div>

                      {/* Phase Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{getPhaseName(phaseGroup.phase)}</h3>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {phaseGroup.items.length} Items
                          </Badge>
                        </div>
                        
                        {/* Progress Bar - nach links */}
                        <div className="flex items-center gap-2">
                          <div className="w-20">
                            <Progress value={phaseGroup.progress} className="h-2" />
                          </div>
                          <div className="text-xs font-medium">
                            {phaseGroup.progress.toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      {/* Budget Info & Action Button */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Offene Posten Info mit Shopping Cart */}
                        <div 
                          className="p-1.5 bg-orange-50 rounded border border-orange-200 text-center cursor-pointer hover:bg-orange-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const unfundedItems = phaseGroup.items.filter(item => !item.purchased && item.qtyFunded === 0);
                            unfundedItems.forEach(item => {
                              addItemPiece(item);
                            });
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3 text-orange-600" />
                            <div className="text-xs font-bold text-orange-600">
                              {phaseGroup.unfundedCount} offen
                            </div>
                          </div>
                          <div className="text-[10px] text-orange-700">
                            {formatCurrency(phaseGroup.budget - phaseGroup.spent)}
                          </div>
                        </div>

                        {/* Details Button */}
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToDetails(phaseGroup.phase);
                          }}
                          className="h-10 text-xs font-medium"
                        >
                          <ChevronRight className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                   </Card>
                 ))}
              </div>
            </div>
          ) : (
            /* Details View */
            <div className="space-y-3">
              {/* Phase Info mit Zurück-Link */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('overview')}
                  className="flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Zurück zur Übersicht
                </Button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getPhaseIcon(selectedPhase)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getPhaseName(selectedPhase)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {filteredItems.length} Items in dieser Phase
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Funded Items */}
              {fundedItems.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('funded')}
                    className="w-full text-left text-lg font-semibold text-green-600 mb-3 flex items-center justify-between hover:bg-green-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedSections.funded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      <CheckCircle className="w-5 h-5" />
                      Vollständig finanziert ({fundedItems.length})
                    </div>
                  </button>
                  {expandedSections.funded && (
                    <div className="space-y-2 ml-7">
                      {fundedItems.map(renderItemCard)}
                    </div>
                  )}
                </div>
              )}

              {/* Partially Funded Items */}
              {partiallyFundedItems.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('partiallyFunded')}
                    className="w-full text-left text-lg font-semibold text-orange-600 mb-3 flex items-center justify-between hover:bg-orange-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedSections.partiallyFunded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      <Circle className="w-5 h-5" />
                      Teilweise finanziert ({partiallyFundedItems.length})
                    </div>
                  </button>
                  {expandedSections.partiallyFunded && (
                    <div className="space-y-2 ml-7">
                      {partiallyFundedItems.map(renderItemCard)}
                    </div>
                  )}
                </div>
              )}

              {/* Unfunded Items */}
              {unfundedItems.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('unfunded')}
                    className="w-full text-left text-lg font-semibold text-gray-600 mb-3 flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedSections.unfunded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      <Target className="w-5 h-5" />
                      Ausstehend ({unfundedItems.length})
                    </div>
                  </button>
                  {expandedSections.unfunded && (
                    <div className="space-y-2 ml-7">
                      {unfundedItems.map(renderItemCard)}
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

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t px-4">
          <div className="text-sm text-muted-foreground">
            {viewMode === 'overview' ? `${projectCost.totalItems} Items insgesamt` : `${filteredItems.length} von ${projectCost.totalItems} Items angezeigt`}
          </div>
          
          {/* Budget Summary - mittig, in beiden Modi */}
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
          
          <Button 
            onClick={viewMode === 'overview' ? onClose : () => setViewMode('overview')} 
            size="sm"
            variant={viewMode === 'details' ? "outline" : "default"}
          >
            {viewMode === 'overview' ? 'Schließen' : 'Zurück'}
          </Button>
        </div>
      </DialogContent>
        </div>
      </div>
    </Dialog>
  );
};
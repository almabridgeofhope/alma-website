import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  Target,
} from "lucide-react";
import { ProjectItem, ProjectCost } from "@/services/clientGoogleSheetsService";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');
  const [expandedSections, setExpandedSections] = useState({
    funded: false, // Vollständig finanziert eingeklappt
    partiallyFunded: true,
    unfunded: true
  });

  const categories = Array.from(new Set(projectCost.items.map(item => item.category)));
  const phases = Array.from(new Set(projectCost.items.map(item => item.phase)));
  
  const filteredItems = projectCost.items.filter(item => {
    const matchesSearch = item.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.phase.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesPhase = selectedPhase === "all" || item.phase === selectedPhase;
    return matchesSearch && matchesCategory && matchesPhase;
  });

  const fundedItems = filteredItems.filter(item => item.purchased);
  const partiallyFundedItems = filteredItems.filter(item => !item.purchased && item.qtyFunded > 0);
  
  // Calculate filtered budget and progress
  const filteredTotalBudget = filteredItems.reduce((sum, item) => sum + (item.totalCostEUR || 0), 0);
  const filteredSpentAmount = filteredItems.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0);
  const filteredProgress = filteredTotalBudget > 0 ? (filteredSpentAmount / filteredTotalBudget) * 100 : 0;
  const unfundedItems = filteredItems.filter(item => !item.purchased && item.qtyFunded === 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
    // Map actual phase values from Excel to appropriate icons
    const phaseLower = phase.toLowerCase();
    
    // Use BrickWall for any wall/flooring related section
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
    
    // Fallback for unknown phases
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

  const getStatusText = (item: ProjectItem) => {
    if (item.purchased) return "Vollständig finanziert";
    if (item.qtyFunded > 0) return "Teilweise finanziert";
    return "Ausstehend";
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Group items by phase for overview
  const phaseGroups = phases.map(phase => {
    const phaseItems = filteredItems.filter(item => item.phase === phase);
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
    // Sort phases by typical order
    const phaseOrder = ['planning', 'implementation', 'impact'];
    return phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
  });

  const renderItemCard = (item: ProjectItem) => (
    <Card key={item.itemId} className={`p-2 transition-all hover:shadow-md ${getStatusColor(item)}`}>
      <div className="flex items-center gap-3">
        {/* Image/Placeholder */}
        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.displayName}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Package className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon(item)}
            <h4 className="font-medium text-gray-900 truncate text-sm">{item.displayName}</h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {getPhaseName(item.phase)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {item.category}
              </span>
            </div>
            
            {/* Progress Bar - same height as badges */}
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-600">
                {item.qtyFunded}/{item.qtyNeededTotal} {item.unit}
              </div>
              <div className="w-16">
                <Progress value={getProgressPercentage(item)} className="h-1" />
              </div>
              <div className="text-xs font-medium w-8 text-right">
                {getProgressPercentage(item).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Cost Info */}
        <div className="text-right space-y-1 flex-shrink-0">
          <div className="text-sm font-semibold text-gray-900">
            {formatCurrency(item.totalCostEUR || 0)}
          </div>
          <div className="text-xs text-gray-600">
            {formatCurrency(item.unitCostEUR)} / {item.unit}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col pr-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-6 h-6 text-primary" />
            {projectCost.projectName} - Projekt Details
          </DialogTitle>
        </DialogHeader>

        {/* Header with View Toggle */}
        <div className="mb-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg mr-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{filteredItems.length}</div>
                <div className="text-xs text-gray-600">Items</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{fundedItems.length}</div>
                <div className="text-xs text-gray-600">Finanziert</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{formatCurrency(filteredTotalBudget)}</div>
                <div className="text-xs text-gray-600">Budget</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary">
                  {filteredProgress.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Fortschritt</div>
              </div>
            </div>
            
            {/* Filters - only show in details mode */}
            {viewMode === 'details' && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-8 text-sm w-48"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue placeholder="Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue placeholder="Phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Phasen</SelectItem>
                    {phases.map(phase => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'overview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('overview')}
              >
                Übersicht
              </Button>
              <Button
                variant={viewMode === 'details' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('details')}
              >
                Details
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          {viewMode === 'overview' ? (
            /* Phase Overview */
            <div className="space-y-3">
              
              {/* 3-Column Grid for Phase Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {phaseGroups.map((phaseGroup) => (
                  <Card key={phaseGroup.phase} className="relative p-4 group hover:shadow-md transition-all cursor-pointer overflow-hidden min-h-[220px]" 
                        onClick={() => {
                          setViewMode('details');
                          setSelectedPhase(phaseGroup.phase);
                        }}>
                    {/* Default Content */}
                    <div className="group-hover:opacity-0 transition-opacity duration-200">
                      {/* Phase Name with Icon - Side by side */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getPhaseIcon(phaseGroup.phase)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {getPhaseName(phaseGroup.phase)}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center flex-1">
                          <p className="text-sm text-gray-600">
                            {phaseGroup.items.length} Items
                          </p>
                        </div>
                        <div className="text-center flex-1">
                          <div className="text-xl font-bold text-primary">
                            {phaseGroup.progress.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <Progress value={phaseGroup.progress} className="h-3" />
                      </div>
                    </div>
                    
                    {/* Hover Content - Overlays default content */}
                    <div className="absolute inset-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white flex flex-col">
                      {/* Phase Name with Icon - Side by side */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getPhaseIcon(phaseGroup.phase)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900">
                            {getPhaseName(phaseGroup.phase)}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center flex-1">
                          <p className="text-xs text-gray-600">
                            Budget: {formatCurrency(phaseGroup.budget)}
                          </p>
                        </div>
                        <div className="text-center flex-1">
                          <div className="text-lg font-bold text-primary">
                            {phaseGroup.progress.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Item Status Overview - replaces progress bar */}
                      <div className="grid grid-cols-3 gap-2 mb-2 flex-1">
                        <div className="text-center px-2 py-2 bg-green-50 rounded-lg">
                          <div className="font-bold text-green-600 text-sm">{phaseGroup.fundedCount}</div>
                          <div className="text-[10px] text-gray-600">Vollständig</div>
                        </div>
                        <div className="text-center px-2 py-2 bg-orange-50 rounded-lg">
                          <div className="font-bold text-orange-600 text-sm">{phaseGroup.partiallyFundedCount}</div>
                          <div className="text-[10px] text-gray-600">Teilweise</div>
                        </div>
                        <div className="text-center px-2 py-2 bg-gray-50 rounded-lg">
                          <div className="font-bold text-gray-600 text-sm">{phaseGroup.unfundedCount}</div>
                          <div className="text-[10px] text-gray-600">Ausstehend</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-center text-primary font-medium mt-auto">
                        Klicken für Details →
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* Details View */
            <div className="space-y-3">
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
            {filteredItems.length} von {projectCost.totalItems} Items angezeigt
          </div>
          <Button onClick={onClose} size="sm">
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
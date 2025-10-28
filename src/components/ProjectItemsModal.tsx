import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Euro, 
  CheckCircle, 
  Circle,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { ProjectItem, ProjectCost } from "@/services/clientGoogleSheetsService";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
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
          </div>
          
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs px-1 py-0">
                {item.category}
              </Badge>
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {item.phase}
              </Badge>
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-6 h-6 text-primary" />
            {projectCost.projectName} - Projekt Details
          </DialogTitle>
        </DialogHeader>

        {/* Summary and Filters */}
        <div className="mb-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between gap-6">
            {/* Gefilterte Items */}
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{filteredItems.length}</div>
              <div className="text-sm text-gray-600">Gefilterte Items</div>
            </div>
            
            {/* Vollständig finanziert */}
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{fundedItems.length}</div>
              <div className="text-sm text-gray-600">Vollständig finanziert</div>
            </div>
            
            {/* Gefiltertes Budget */}
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{formatCurrency(filteredTotalBudget)}</div>
              <div className="text-sm text-gray-600">Gefiltertes Budget</div>
            </div>
            
            {/* Suchfeld */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Items, Kategorien oder Phasen suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-sm w-64"
              />
            </div>
            
            {/* Kategorie Dropdown */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue placeholder="Alle Kategorien" />
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
            
            {/* Phase Dropdown */}
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue placeholder="Alle Phasen" />
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
            
            {/* Fortschritt */}
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {filteredProgress.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Fortschritt</div>
            </div>
          </div>
        </div>

        {/* Items List - Takes up 3/4 of screen */}
        <div className="flex-1 overflow-y-auto space-y-4">
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

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
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
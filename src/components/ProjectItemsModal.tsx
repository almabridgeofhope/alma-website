import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  Euro, 
  CheckCircle, 
  Circle,
  Search,
  Filter,
  Download,
  AlertCircle
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

  const categories = Array.from(new Set(projectCost.items.map(item => item.category)));
  
  const filteredItems = projectCost.items.filter(item => {
    const matchesSearch = item.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const purchasedItems = filteredItems.filter(item => item.purchased);
  const remainingItems = filteredItems.filter(item => !item.purchased);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Item ID', 'Project', 'Phase', 'Category', 'Display Name', 'Unit', 'Unit Cost EUR', 'Qty Needed', 'Qty Funded', 'Total Cost EUR', 'Funded Cost EUR', 'Status'],
      ...projectCost.items.map(item => [
        item.itemId,
        item.project,
        item.phase,
        item.category,
        item.displayName,
        item.unit,
        item.unitCostEUR || 0,
        item.qtyNeededTotal || 0,
        item.qtyFunded || 0,
        item.totalCostEUR || 0,
        item.fundedCostEUR || 0,
        item.purchased ? 'Funded' : 'Pending'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectCost.projectName}_items.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getProgressPercentage = (item: ProjectItem) => {
    if (item.qtyNeededTotal === 0) return 0;
    return Math.min((item.qtyFunded / item.qtyNeededTotal) * 100, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {projectCost.projectName} - Projekt Items
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{projectCost.totalItems}</div>
            <div className="text-sm text-muted-foreground">Gesamt Items</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{projectCost.purchasedItems}</div>
            <div className="text-sm text-muted-foreground">Vollständig finanziert</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{projectCost.totalItems - projectCost.purchasedItems}</div>
            <div className="text-sm text-muted-foreground">Teilweise/Ausstehend</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(projectCost.totalBudget)}</div>
            <div className="text-sm text-muted-foreground">Gesamtbudget</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Items suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Alle Kategorien</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            CSV Export
          </Button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* All Items (grouped by funding status) */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Alle Items ({filteredItems.length})
            </h3>
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <Card key={item.itemId} className={`p-4 ${item.purchased ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {item.purchased ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-orange-600" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{item.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.itemId} • {item.category} • {item.phase}
                          </div>
                          {item.blurb && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              {item.blurb}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Funding Progress */}
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {item.qtyFunded}/{item.qtyNeededTotal} {item.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getProgressPercentage(item).toFixed(0)}% finanziert
                        </div>
                      </div>
                      
                      {/* Costs */}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {formatCurrency(item.unitCostEUR)} / {item.unit}
                        </Badge>
                        <Badge variant={item.purchased ? "default" : "secondary"}>
                          {formatCurrency(item.totalCostEUR || 0)}
                        </Badge>
                        {item.fundedCostEUR && item.fundedCostEUR > 0 && (
                          <Badge variant="outline" className="text-green-600">
                            {formatCurrency(item.fundedCostEUR)} finanziert
                          </Badge>
                        )}
                      </div>
                      
                      {/* Priority */}
                      <Badge variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'default' : 'secondary'}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredItems.length} von {projectCost.totalItems} Items angezeigt
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Finanziert: {formatCurrency(projectCost.spentAmount)} von {formatCurrency(projectCost.totalBudget)}
            </div>
            <Button onClick={onClose}>Schließen</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
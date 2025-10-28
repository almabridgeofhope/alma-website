import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Euro, TrendingUp, Calendar, Package } from "lucide-react";
import { ProjectCost } from "@/services/clientGoogleSheetsService";
import { ProjectItemsModal } from "./ProjectItemsModal";
import { useShoppingCart } from "@/contexts/ShoppingCartContext";

interface ProjectCostCardProps {
  projectCost: ProjectCost;
  onRefresh?: () => void;
  loading?: boolean;
  onItemToggle?: (itemId: string, purchased: boolean) => void;
  onItemCostUpdate?: (itemId: string, cost: number) => void;
}

export const ProjectCostCard = ({ 
  projectCost, 
  onRefresh, 
  loading = false,
  onItemToggle,
  onItemCostUpdate 
}: ProjectCostCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { closeCart } = useShoppingCart();
  const spentPercentage = projectCost.totalBudget > 0 
    ? (projectCost.spentAmount / projectCost.totalBudget) * 100 
    : 0;

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-primary-light/10 to-primary-light/5 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Euro className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Projektkosten
          </h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Fortschritt</span>
            <Badge variant="secondary" className="text-xs">
              {spentPercentage.toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            value={spentPercentage} 
            className="h-2"
          />
        </div>

        {/* Footer with Date and Items Button */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(projectCost.lastUpdated)}</span>
          </div>
          <Button 
            onClick={() => {
              // Ensure any overlay cart is closed before opening the modal
              closeCart();
              setIsModalOpen(true);
            }}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Items anzeigen
          </Button>
        </div>
      </div>

      {/* Items Modal */}
      <ProjectItemsModal
        projectCost={projectCost}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onItemToggle={onItemToggle || (() => {})}
        onItemCostUpdate={onItemCostUpdate || (() => {})}
      />
    </Card>
  );
};

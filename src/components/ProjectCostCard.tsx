import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Euro, TrendingUp, Calendar, Package } from "lucide-react";
import { ProjectCost } from "@/services/clientGoogleSheetsService";
import { ProjectItemsModal } from "./ProjectItemsModal";

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
        {/* Budget Overview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Gesamtbudget</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(projectCost.totalBudget, projectCost.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Ausgegeben</p>
            <p className="text-lg font-bold text-orange-600">
              {formatCurrency(projectCost.spentAmount, projectCost.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Verbleibend</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(projectCost.remainingAmount, projectCost.currency)}
            </p>
          </div>
        </div>

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

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {spentPercentage < 50 ? 'In Planung' : 
               spentPercentage < 80 ? 'In Bearbeitung' : 
               spentPercentage < 100 ? 'Fast fertig' : 'Abgeschlossen'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(projectCost.lastUpdated)}</span>
          </div>
        </div>

        {/* Items Summary */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            {projectCost.purchasedItems} von {projectCost.totalItems} Items gekauft
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
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

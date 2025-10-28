import { useState, useEffect } from 'react';
import { clientGoogleSheetsService, ProjectCost } from '@/services/clientGoogleSheetsService';

export const useProjectCosts = () => {
  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectCosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const costs = await clientGoogleSheetsService.getProjectCosts();
        setProjectCosts(costs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch project costs');
        console.error('Error fetching project costs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectCosts();
  }, []);

  const getProjectCost = (projectName: string): ProjectCost | null => {
    return projectCosts.find(cost => 
      cost.projectName.toLowerCase() === projectName.toLowerCase()
    ) || null;
  };

  const refreshCosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const costs = await clientGoogleSheetsService.getProjectCosts();
      setProjectCosts(costs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh project costs');
    } finally {
      setLoading(false);
    }
  };

  return {
    projectCosts,
    loading,
    error,
    getProjectCost,
    refreshCosts,
  };
};

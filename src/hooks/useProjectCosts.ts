import { useState, useEffect } from 'react';
import { fetchProjectCosts, ProjectCost } from '@/services/projectCostsService';
import { findeProjektKosten } from '@/services/projektZuordnung';

export const useProjectCosts = () => {
  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjectCosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const costs = await fetchProjectCosts();
        setProjectCosts(costs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch project costs');
        console.error('Error fetching project costs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProjectCosts();
  }, []);

  const getProjectCost = (projectName: string): ProjectCost | null => {
    const projectCost = findeProjektKosten(projectCosts, projectName);

    if (projectCost) {
      console.log(`[useProjectCosts] Found project cost for "${projectName}":`, projectCost.projectName);
    } else {
      console.warn(`[useProjectCosts] No project cost found for "${projectName}". Available projects:`, 
        projectCosts.map(c => c.projectName));
    }
    
    return projectCost || null;
  };

  const refreshCosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const costs = await fetchProjectCosts();
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

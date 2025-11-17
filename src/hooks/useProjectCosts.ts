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
    // Normalize project name for comparison
    const normalizedProjectName = projectName.toLowerCase().trim();
    
    // Try exact match first
    let projectCost = projectCosts.find(cost => 
      cost.projectName.toLowerCase().trim() === normalizedProjectName
    );
    
    // If no exact match, try partial matches (either direction)
    if (!projectCost) {
      projectCost = projectCosts.find(cost => {
        const costNameLower = cost.projectName.toLowerCase().trim();
        return costNameLower.includes(normalizedProjectName) ||
               normalizedProjectName.includes(costNameLower);
      });
    }
    
    // If still no match, try common project name mappings
    if (!projectCost) {
      const nameMappings: { [key: string]: string[] } = {
        'community': ['community house', 'community', 'haus', 'house', 'building the community', 'bau des community'],
        'well': ['brunnen', 'well', 'wasser', 'water'],
        'livestock': ['vieh', 'livestock', 'ziegen', 'goats', 'agriculture'],
        'mobility': ['bus', 'mobility', 'transport', 'verkehr'],
        'sponsorship': ['sponsorship', 'patenschaft', 'education', 'bildung'],
        'financial': ['financial', 'finanz', 'money', 'geld']
      };
      
      for (const [key, variations] of Object.entries(nameMappings)) {
        // Check if the project name contains any variation
        if (variations.some(variation => normalizedProjectName.includes(variation))) {
          // Find a cost that matches any of the variations
          projectCost = projectCosts.find(cost => {
            const costNameLower = cost.projectName.toLowerCase().trim();
            // Check if the cost name contains any of the variations
            return variations.some(variation => 
              costNameLower.includes(variation) || variation.includes(costNameLower)
            );
          });
          if (projectCost) break;
        }
      }
    }
    
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

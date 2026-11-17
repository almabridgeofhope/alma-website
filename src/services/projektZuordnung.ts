// Zuordnung eines Projekttitels der Seite (z. B. „Building the Community House“) zu den
// Projektpositionen aus der RPC website_projektpositionen (Projektnamen wie „Community House“).
// Aus useProjectCosts gezogen, damit die Regel ohne React testbar ist (projektZuordnung.test.ts).

import type { ProjectCost } from "@/services/projectCostsService";

export const findeProjektKosten = (projectCosts: ProjectCost[], projectName: string): ProjectCost | null => {
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
      'orphanage': ['waisenhaus', 'orphanage'],
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

  return projectCost || null;
};

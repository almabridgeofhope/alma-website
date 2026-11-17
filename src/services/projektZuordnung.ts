// Zuordnung eines Projekttitels der Seite (z. B. „Building the Community House“) zu den
// Projektpositionen aus der RPC website_projektpositionen (Projektnamen wie „Community House“).
// Aus useProjectCosts gezogen, damit die Regel ohne React testbar ist (projektZuordnung.test.ts).

import type { ProjectCost } from "@/services/projectCostsService";

// Schlagwörter je Projekt, EN und DE. Die Reihenfolge der Gruppen entscheidet, wenn ein Titel
// Schlagwörter aus mehreren Gruppen enthält.
const SCHLAGWORT_GRUPPEN: string[][] = [
  ['community house', 'community', 'haus', 'house', 'building the community', 'bau des community'],
  ['brunnen', 'well', 'wasser', 'water'],
  ['waisenhaus', 'orphanage'],
  ['vieh', 'livestock', 'ziegen', 'goats', 'agriculture', 'landwirtschaft', 'farm'],
  ['bus', 'mobility', 'transport', 'verkehr'],
  ['sponsorship', 'patenschaft', 'education', 'bildung'],
  ['financial', 'finanz', 'money', 'geld'],
];

/**
 * Gruppen, deren Schlagwörter im Titel stehen. Ein Schlagwort, das nur als Teil eines längeren
 * gefundenen Schlagworts vorkommt, zählt nicht: in „waisenhaus“ greift „waisenhaus“, nicht „haus“.
 */
const passendeSchlagwortGruppen = (titel: string): string[][] => {
  const gefunden = SCHLAGWORT_GRUPPEN.flat().filter(wort => titel.includes(wort));
  const spezifisch = gefunden.filter(wort => !gefunden.some(laenger => laenger !== wort && laenger.includes(wort)));
  return SCHLAGWORT_GRUPPEN.filter(gruppe => gruppe.some(wort => spezifisch.includes(wort)));
};

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
    for (const variations of passendeSchlagwortGruppen(normalizedProjectName)) {
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

  return projectCost || null;
};

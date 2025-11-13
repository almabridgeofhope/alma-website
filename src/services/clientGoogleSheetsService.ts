// Client-side Google Sheets integration for GitHub Pages
// This approach uses the Google Sheets API directly from the browser

export interface ProjectItem {
  itemId: string;
  project: string;
  phase: string;
  category: string;
  displayName: string;
  unit: string;
  unitCostUGX: number;
  unitCostEUR: number;
  qtyNeededTotal: number;
  qtyFunded: number;
  priority: string;
  blurb: string;
  imageUrl: string;
  visibility: string;
  sortOrder: number;
  purchased?: boolean;
  totalCostEUR?: number;
  fundedCostEUR?: number;
  // German translations (optional)
  phaseDe?: string;
  displayNameDe?: string;
  categoryDe?: string;
  blurbDe?: string;
}

export interface ProjectCost {
  projectName: string;
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  currency: string;
  lastUpdated: string;
  items: ProjectItem[];
  totalItems: number;
  purchasedItems: number;
}

export class ClientGoogleSheetsService {
  private apiKey: string;
  private sheetId: string;
  private range: string;

  constructor() {
    // Environment variables from .env(.local)
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    this.sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID || '1qCbZyPujr6_iZVNWSnM5aqMOX0tzamDJO2vMOulV514';
    // e.g. "Tabelle1!A:S" or "Sheet1!A:S". Falls nicht gesetzt, alle Spalten bis S (inkl. deutsche Übersetzungen).
    // Spaltenreihenfolge: item_id, project, phase, phasede, category, categoryde, display_name, displaynamede, unit, unit_cost_UGX, unit_cost_EUR, qty_needed_total, qty_funded, priority, blurb, blurbde, image_url, visibility, sort_order
    this.range = import.meta.env.VITE_GOOGLE_SHEET_RANGE || 'A:S';
  }

  async getProjectCosts(): Promise<ProjectCost[]> {
    try {
      // Check if API key is configured
      if (!this.apiKey) {
        throw new Error('Google API Key not configured. Please set VITE_GOOGLE_API_KEY in your .env.local file');
      }

      console.log('Fetching project costs from Google Sheets...', {
        sheetId: this.sheetId,
        apiKeyConfigured: !!this.apiKey,
        range: this.range
      });

      const encodedRange = encodeURIComponent(this.range);
      // Add cache buster to always fetch fresh data
      const cacheBuster = Date.now();
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${encodedRange}?key=${this.apiKey}&_=${cacheBuster}`;
      const response = await fetch(url);

      if (!response.ok) {
        let errorBody: any = null;
        try { errorBody = await response.json(); } catch { errorBody = await response.text(); }
        console.error('Google Sheets API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorBody,
          url
        });
        // Provide clearer hint for 403s
        if (response.status === 403) {
          throw new Error('Google Sheets API error: 403 (Forbidden). Check: API key restrictions, Sheet sharing (Anyone with link can view), and that the Sheets API is enabled.');
        }
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Google Sheets API Response:', data);
      
      const rows = data.values;

      if (!rows || rows.length <= 1) {
        console.warn('No data found in Google Sheet or only header row');
        return [];
      }

      // Parse the detailed cost tracking data
      // Structure: [item_id, project, phase, phasede, category, categoryde, display_name, displaynamede, unit, unit_cost_UGX, unit_cost_EUR, qty_needed_total, qty_funded, priority, blurb, blurbde, image_url, visibility, sort_order]
      const allProjectItems: ProjectItem[] = rows.slice(1).map((row: any[]) => {
        const unitCostEUR = parseFloat(row[10]?.toString().replace(',', '.') || '0');
        const qtyNeededTotal = parseFloat(row[11]?.toString().replace(',', '.') || '0');
        const qtyFunded = parseFloat(row[12]?.toString().replace(',', '.') || '0');
        const visibility = row[17]?.toString().toLowerCase() || '';
        
        return {
          itemId: row[0] || '',
          project: row[1] || '',
          phase: row[2] || '',
          category: row[4] || '',
          displayName: row[6] || '',
          unit: row[8] || '',
          unitCostUGX: parseFloat(row[9]?.toString().replace(',', '.') || '0'),
          unitCostEUR: unitCostEUR,
          qtyNeededTotal: qtyNeededTotal,
          qtyFunded: qtyFunded,
          priority: row[13] || '',
          blurb: row[14] || '',
          imageUrl: row[16] || '',
          visibility: visibility,
          sortOrder: parseFloat(row[18]?.toString() || '0'),
          purchased: qtyFunded >= qtyNeededTotal, // Item is purchased if fully funded
          totalCostEUR: unitCostEUR * qtyNeededTotal,
          fundedCostEUR: unitCostEUR * qtyFunded,
          // German translations (optional - fallback to English if not provided)
          phaseDe: row[3]?.toString().trim() || undefined,
          displayNameDe: row[7]?.toString().trim() || undefined,
          categoryDe: row[5]?.toString().trim() || undefined,
          blurbDe: row[15]?.toString().trim() || undefined
        };
      });

      // Filter items based on visibility - only include items where visibility is TRUE or empty
      const projectItems = allProjectItems.filter(item => {
        const visibility = item.visibility.toLowerCase();
        return visibility === 'true' || visibility === '' || visibility === '1';
      });

      console.log(`Filtered items by visibility: ${projectItems.length} visible items out of ${allProjectItems.length} total items`);

      console.log('Parsed project items:', projectItems);

      // Group by project and create summary
      const projectGroups = projectItems.reduce((acc: { [key: string]: any[] }, item) => {
        if (!acc[item.project]) {
          acc[item.project] = [];
        }
        acc[item.project].push(item);
        return acc;
      }, {});

      console.log('Project groups:', projectGroups);

      // Create ProjectCost objects for each project
      const projectCosts: ProjectCost[] = Object.entries(projectGroups).map(([projectName, items]) => {
        const projectItems = items as ProjectItem[];
        const totalItems = projectItems.length;
        const purchasedItems = projectItems.filter(item => item.purchased).length;
        
        // Calculate real costs from Google Sheets data
        const totalBudget = projectItems.reduce((sum, item) => sum + (item.totalCostEUR || 0), 0);
        const spentAmount = projectItems.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0);
        const remainingAmount = totalBudget - spentAmount;

        const projectCost = {
          projectName: projectName.trim(),
          totalBudget: totalBudget,
          spentAmount: spentAmount,
          remainingAmount: remainingAmount,
          currency: 'EUR',
          lastUpdated: new Date().toISOString(),
          items: projectItems,
          totalItems: totalItems,
          purchasedItems: purchasedItems
        };

        console.log(`Created project cost for "${projectName}":`, projectCost);
        return projectCost;
      });

      console.log(`Successfully loaded ${projectCosts.length} project costs`);
      return projectCosts;
    } catch (error) {
      console.error('Error fetching project costs from Google Sheets:', error);
      throw new Error(`Failed to fetch project costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProjectCostByName(projectName: string): Promise<ProjectCost | null> {
    const allCosts = await this.getProjectCosts();
    
    // Try exact match first
    let projectCost = allCosts.find(cost => 
      cost.projectName.toLowerCase() === projectName.toLowerCase()
    );
    
    // If no exact match, try partial matches
    if (!projectCost) {
      projectCost = allCosts.find(cost => 
        cost.projectName.toLowerCase().includes(projectName.toLowerCase()) ||
        projectName.toLowerCase().includes(cost.projectName.toLowerCase())
      );
    }
    
    // If still no match, try common project name mappings
    if (!projectCost) {
      const nameMappings: { [key: string]: string[] } = {
        'community': ['community house', 'community', 'haus', 'house'],
        'well': ['brunnen', 'well', 'wasser', 'water'],
        'livestock': ['vieh', 'livestock', 'ziegen', 'goats', 'agriculture'],
        'mobility': ['bus', 'mobility', 'transport', 'verkehr'],
        'sponsorship': ['sponsorship', 'patenschaft', 'education', 'bildung'],
        'financial': ['financial', 'finanz', 'money', 'geld']
      };
      
      const normalizedProjectName = projectName.toLowerCase();
      for (const [key, variations] of Object.entries(nameMappings)) {
        if (variations.some(variation => normalizedProjectName.includes(variation))) {
          projectCost = allCosts.find(cost => 
            variations.some(variation => 
              cost.projectName.toLowerCase().includes(variation)
            )
          );
          if (projectCost) break;
        }
      }
    }
    
    console.log(`Looking for project "${projectName}", found:`, projectCost);
    return projectCost || null;
  }
}

// Singleton instance
export const clientGoogleSheetsService = new ClientGoogleSheetsService();

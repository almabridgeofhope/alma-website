// Google Apps Script Webhook for Processing Donations
// This script updates the qty_funded column in your Google Sheet based on incoming donations
// 
// SETUP INSTRUCTIONS:
// 1. Open your Google Sheet with project cost items
// 2. Go to Extensions > Apps Script
// 3. Paste this code
// 4. Update the CONFIG section below with your Sheet ID and Sheet Name
// 5. Deploy as a web app:
//    - Click Deploy > New deployment
//    - Select type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
//    - Click Deploy
//    - Copy the Web App URL and use it as VITE_DONATION_WEBHOOK_URL in your .env file

// ========== CONFIG ==========
// Update these values to match your Google Sheet
const SHEET_ID = '1qCbZyPujr6_iZVNWSnM5aqMOX0tzamDJO2vMOulV514'; // Your Google Sheet ID (same as VITE_GOOGLE_SHEET_ID)
const SHEET_NAME = 'community_house'; // Name of your sheet tab (e.g., "Sheet1", "Tabellenblatt1" - adjust if different)
// Column indices (0-based): item_id=0, project=1, phase=2, ..., qty_funded=12
const QTY_FUNDED_COLUMN = 12; // Column M (0-indexed = 12)
const ITEM_ID_COLUMN = 0; // Column A
const UNIT_COST_EUR_COLUMN = 10; // Column K
const QTY_NEEDED_TOTAL_COLUMN = 11; // Column L

// ========== MAIN WEBHOOK FUNCTION ==========
function doPost(e) {
  try {
    // Log incoming request for debugging
    console.log('=== Donation Webhook Called ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Has postData:', !!e.postData);
    console.log('Has parameters:', !!e.parameters);
    console.log('Request method:', e.parameter ? 'GET' : 'POST');
    
    // Parse incoming donation data
    // Support both JSON and form-encoded data
    let data = {};
    
    if (e.postData && e.postData.contents) {
      const contentType = e.postData.type || '';
      console.log('Content type:', contentType);
      
      if (contentType.includes('application/json')) {
        // JSON payload
        console.log('Parsing JSON payload...');
        data = JSON.parse(e.postData.contents);
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('form')) {
        // Form-encoded payload
        console.log('Parsing form-encoded payload...');
        const params = e.parameter || {};
        if (params.data) {
          data = JSON.parse(params.data);
        } else {
          // Fallback: try to parse as JSON from contents
          try {
            data = JSON.parse(e.postData.contents);
          } catch (err) {
            console.error('Failed to parse form data:', err);
            return jsonResponse({ ok: false, message: 'Failed to parse donation data' });
          }
        }
      } else {
        // Try to parse as JSON anyway
        try {
          data = JSON.parse(e.postData.contents);
        } catch (err) {
          console.error('Failed to parse payload:', err);
          return jsonResponse({ ok: false, message: 'Invalid payload format' });
        }
      }
      
      console.log('Received donation data:', {
        itemsCount: data.items?.length || 0,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        donationType: data.donationType
      });
    } else if (e.parameter && e.parameter.data) {
      // Form-encoded data in parameters
      console.log('Parsing form-encoded data from parameters...');
      data = JSON.parse(e.parameter.data);
    } else {
      console.error('No payload received in request');
      return jsonResponse({ ok: false, message: 'No payload received' });
    }

    // Validate required fields
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return jsonResponse({ ok: false, message: 'No donation items provided' });
    }

    if (!data.totalAmount || parseFloat(data.totalAmount) <= 0) {
      return jsonResponse({ ok: false, message: 'Invalid donation amount' });
    }

    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    
    // Get all data from the sheet
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return jsonResponse({ ok: false, message: 'Sheet is empty or has no data rows' });
    }

    // Read all rows (skip header row 1)
    const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const rows = dataRange.getValues();
    
    // Create a map of item_id to row index for quick lookup
    const itemMap = new Map();
    rows.forEach((row, index) => {
      const itemId = String(row[ITEM_ID_COLUMN] || '').trim();
      if (itemId) {
        itemMap.set(itemId, index + 2); // +2 because we skipped header and arrays are 0-indexed
      }
    });

    let totalUpdated = 0;
    let generalDonationAmount = parseFloat(data.totalAmount);
    const updates = [];

    // Process each donation item
    for (const donationItem of data.items) {
      if (donationItem.type === 'general-donation') {
        // General donations will be distributed later
        continue;
      }

      if (donationItem.type === 'item' && donationItem.itemId) {
        // Specific item donation
        const rowIndex = itemMap.get(donationItem.itemId);
        if (!rowIndex) {
          console.warn(`Item ID ${donationItem.itemId} not found in sheet`);
          continue;
        }

        const row = rows[rowIndex - 2]; // Convert back to array index
        const currentQtyFunded = parseFloat(row[QTY_FUNDED_COLUMN] || 0);
        const unitCostEUR = parseFloat(row[UNIT_COST_EUR_COLUMN] || 0);
        const qtyNeededTotal = parseFloat(row[QTY_NEEDED_TOTAL_COLUMN] || 0);

        if (unitCostEUR <= 0) {
          console.warn(`Item ${donationItem.itemId} has invalid unit cost`);
          continue;
        }

        // Calculate how many units this donation covers
        const donationAmount = parseFloat(donationItem.totalPrice || donationItem.unitPrice * donationItem.quantity);
        const unitsToAdd = donationAmount / unitCostEUR;
        const newQtyFunded = Math.min(currentQtyFunded + unitsToAdd, qtyNeededTotal);

        // Update the sheet
        sheet.getRange(rowIndex, QTY_FUNDED_COLUMN + 1).setValue(newQtyFunded);
        updates.push({
          itemId: donationItem.itemId,
          oldQty: currentQtyFunded,
          newQty: newQtyFunded,
          amount: donationAmount
        });
        totalUpdated++;
      } else if (donationItem.type === 'phase' && donationItem.projectName && donationItem.phase) {
        // Phase donation - distribute to items in that phase
        const phaseItems = rows
          .map((row, idx) => ({ row, idx: idx + 2 }))
          .filter(({ row }) => {
            const project = String(row[1] || '').trim();
            const phase = String(row[2] || '').trim();
            return project.toLowerCase() === donationItem.projectName.toLowerCase() &&
                   phase.toLowerCase() === donationItem.phase.toLowerCase();
          });

        if (phaseItems.length === 0) {
          console.warn(`No items found for phase ${donationItem.phase} in project ${donationItem.projectName}`);
          continue;
        }

        // Sort by priority (unfunded items first, then by priority)
        phaseItems.sort((a, b) => {
          const aFunded = parseFloat(a.row[QTY_FUNDED_COLUMN] || 0);
          const bFunded = parseFloat(b.row[QTY_FUNDED_COLUMN] || 0);
          const aNeeded = parseFloat(a.row[QTY_NEEDED_TOTAL_COLUMN] || 0);
          const bNeeded = parseFloat(b.row[QTY_NEEDED_TOTAL_COLUMN] || 0);
          const aRemaining = aNeeded - aFunded;
          const bRemaining = bNeeded - bFunded;
          
          if (aRemaining > 0 && bRemaining <= 0) return -1;
          if (aRemaining <= 0 && bRemaining > 0) return 1;
          return aRemaining - bRemaining; // Most needed first
        });

        // Distribute donation across phase items
        const phaseDonationAmount = parseFloat(donationItem.totalPrice || donationItem.unitPrice);
        let remainingDonation = phaseDonationAmount;

        for (const { row, idx } of phaseItems) {
          if (remainingDonation <= 0) break;

          const currentQtyFunded = parseFloat(row[QTY_FUNDED_COLUMN] || 0);
          const unitCostEUR = parseFloat(row[UNIT_COST_EUR_COLUMN] || 0);
          const qtyNeededTotal = parseFloat(row[QTY_NEEDED_TOTAL_COLUMN] || 0);
          const remainingNeeded = qtyNeededTotal - currentQtyFunded;

          if (remainingNeeded <= 0 || unitCostEUR <= 0) continue;

          const unitsAffordable = remainingDonation / unitCostEUR;
          const unitsToAdd = Math.min(unitsAffordable, remainingNeeded);
          const newQtyFunded = currentQtyFunded + unitsToAdd;
          const amountUsed = unitsToAdd * unitCostEUR;

          sheet.getRange(idx, QTY_FUNDED_COLUMN + 1).setValue(newQtyFunded);
          remainingDonation -= amountUsed;
          totalUpdated++;

          updates.push({
            itemId: String(row[ITEM_ID_COLUMN] || ''),
            oldQty: currentQtyFunded,
            newQty: newQtyFunded,
            amount: amountUsed
          });
        }
      }
    }

    // Handle general donations - DO NOT assign to items, just log them
    // General donations are unrestricted and should not be automatically assigned to specific items
    const generalDonationItems = data.items.filter(item => item.type === 'general-donation');
    if (generalDonationItems.length > 0) {
      const generalAmount = generalDonationItems.reduce((sum, item) => 
        sum + parseFloat(item.totalPrice || item.unitPrice || 0), 0
      );
      
      // Log general donation but do NOT assign it to any items
      // General donations remain unrestricted and can be allocated manually later
      console.log(`General donation received: €${generalAmount} - NOT assigned to any items`);
      
      // Add a log entry for the general donation (no item updates)
      // The donation will be logged in the donations log sheet but not assigned to items
    }

    // Log the donation (optional - you can create a separate donations log sheet)
    logDonation(data, updates);

    return jsonResponse({
      ok: true,
      message: `Successfully processed donation. Updated ${totalUpdated} items.`,
      updates: updates,
      totalUpdated: totalUpdated
    });

  } catch (err) {
    // Log detailed error information
    console.error('Error processing donation:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', JSON.stringify(err, null, 2));
    
    // Try to log to the sheet for debugging
    try {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let logSheet = ss.getSheetByName('Donations Log');
      if (logSheet) {
        logSheet.appendRow([
          new Date().toISOString(),
          'ERROR',
          'error',
          0,
          '',
          0,
          JSON.stringify({ error: err.toString(), stack: err.stack })
        ]);
      }
    } catch (logErr) {
      // Ignore logging errors
    }
    
    return jsonResponse({
      ok: false,
      message: `Error: ${String(err)}`,
      error: err.toString()
    });
  }
}

// ========== CORS SUPPORT ==========
function doOptions(e) {
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.TEXT);
  
  // Set CORS headers for preflight request
  try {
    output.setHeader('Access-Control-Allow-Origin', '*');
    output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    output.setHeader('Access-Control-Max-Age', '3600');
  } catch (e) {
    console.error('Error setting CORS headers:', e);
  }
  
  return output;
}

// Handle GET requests (for testing)
function doGet(e) {
  return jsonResponse({
    ok: true,
    message: 'Donation webhook is active',
    timestamp: new Date().toISOString()
  });
}

// ========== HELPER FUNCTIONS ==========
function jsonResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Set CORS headers - Google Apps Script web apps need these
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '3600'
  };
  
  // Set headers individually (Google Apps Script limitation)
  for (const [key, value] of Object.entries(headers)) {
    try {
      output.setHeader(key, value);
    } catch (e) {
      // Some headers might not be settable, ignore
    }
  }
  
  return output;
}

// Optional: Log donations to a separate sheet for tracking
function logDonation(donationData, updates) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let logSheet = ss.getSheetByName('Donations Log');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('Donations Log');
      logSheet.appendRow([
        'Timestamp',
        'Payment Method',
        'Donation Type',
        'Total Amount',
        'Donor Email',
        'Donor Name',
        'Wants Receipt',
        'Address Street',
        'Address Postal Code',
        'Address City',
        'Address Country',
        'Wants Newsletter',
        'Comment',
        'Items Updated',
        'Updates JSON'
      ]);
    }
    
    logSheet.appendRow([
      new Date().toISOString(),
      donationData.paymentMethod || 'unknown',
      donationData.donationType || 'one-time',
      donationData.totalAmount,
      donationData.donorEmail || '',
      donationData.donorName || '',
      donationData.wantsReceipt ? 'Yes' : 'No',
      donationData.address?.street || '',
      donationData.address?.postalCode || '',
      donationData.address?.city || '',
      donationData.address?.country || '',
      donationData.wantsNewsletter ? 'Yes' : 'No',
      donationData.comment || '',
      updates.length,
      JSON.stringify(updates)
    ]);
  } catch (err) {
    console.error('Error logging donation:', err);
    // Don't fail the whole request if logging fails
  }
}


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
// Two separate sheets: one for budget updates, one for donation logs

// Budget Sheet - for updating item quantities
const BUDGET_SHEET_ID = '1Sw62Dp2wVM9ivtidGiigibXB58ClNyvc3rCvw5EncvM'; // Budget sheet ID
const BUDGET_SHEET_NAME = 'Transactions'; // Budget sheet tab name
// Column indices (0-based) for the budget sheet structure:
// A=ID, B=Phase, C=Item, D=Details, E=Qty needed, F=Unit Cost (UGX), G=Total (UGX), H=Est. EUR, I=Qty paid, J=Status, K=Priority, ...
const ITEM_ID_COLUMN = 0; // Column A - ID
const QTY_FUNDED_COLUMN = 8; // Column I - Qty paid (0-indexed = 8)
const UNIT_COST_EUR_COLUMN = 7; // Column H - Est. EUR (0-indexed = 7)
const QTY_NEEDED_TOTAL_COLUMN = 4; // Column E - Qty needed (0-indexed = 4)

// Donations Log Sheet - for logging all donations
const DONATIONS_LOG_SHEET_ID = '1qCbZyPujr6_iZVNWSnM5aqMOX0tzamDJO2vMOulV514'; // Donations log sheet ID
const DONATIONS_LOG_SHEET_NAME = 'Donations Log'; // Donations log sheet tab name

// ========== MAIN WEBHOOK FUNCTION ==========
function doPost(e) {
  try {
    // Log incoming request for debugging
    // Use both Logger.log (for execution logs) and console.log (for some environments)
    Logger.log('=== Donation Webhook Called ===');
    Logger.log('Timestamp: ' + new Date().toISOString());
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
      
      // Comprehensive logging for all donation data (especially important for live payments)
      console.log('=== Received Donation Data ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Items Count:', data.items?.length || 0);
      console.log('Total Amount:', data.totalAmount, 'EUR');
      console.log('Payment Method:', data.paymentMethod || 'unknown');
      console.log('Donation Type:', data.donationType || 'one-time');
      console.log('Payment ID:', data.paymentId || 'N/A');
      console.log('Payment Status:', data.paymentStatus || 'paid');
      console.log('Donor Email:', data.donorEmail || 'N/A');
      console.log('Donor Name:', data.donorName || 'N/A');
      console.log('Wants Receipt:', data.wantsReceipt ? 'Yes' : 'No');
      console.log('Wants Newsletter:', data.wantsNewsletter ? 'Yes' : 'No');
      console.log('Address:', data.address ? JSON.stringify(data.address) : 'N/A');
      console.log('Comment:', data.comment || 'N/A');
      console.log('Full Data:', JSON.stringify(data, null, 2));
      console.log('============================');
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

    // Allow 0 amount only for no-payment (waivers), otherwise require > 0
    const isNoPayment = data.paymentMethod === 'no-payment';
    if (data.totalAmount === undefined || data.totalAmount === null) {
      return jsonResponse({ ok: false, message: 'Invalid donation amount' });
    }
    const parsedAmount = parseFloat(data.totalAmount);
    if (isNaN(parsedAmount)) {
      return jsonResponse({ ok: false, message: 'Invalid donation amount' });
    }
    if (!isNoPayment && parsedAmount <= 0) {
      return jsonResponse({ ok: false, message: 'Invalid donation amount' });
    }

    // Open the budget spreadsheet for item updates
    Logger.log('=== Opening Budget Sheet ===');
    Logger.log('Budget Sheet ID: ' + BUDGET_SHEET_ID);
    Logger.log('Budget Sheet Name: ' + BUDGET_SHEET_NAME);
    console.log('=== Opening Budget Sheet ===');
    console.log('Budget Sheet ID:', BUDGET_SHEET_ID);
    console.log('Budget Sheet Name:', BUDGET_SHEET_NAME);
    
    const budgetSS = SpreadsheetApp.openById(BUDGET_SHEET_ID);
    Logger.log('Budget spreadsheet opened successfully');
    console.log('Budget spreadsheet opened successfully');
    
    const sheet = budgetSS.getSheetByName(BUDGET_SHEET_NAME);
    if (!sheet) {
      const availableSheets = budgetSS.getSheets().map(s => s.getName());
      Logger.log('❌ Budget sheet not found! Available: ' + availableSheets.join(', '));
      console.error('❌ Budget sheet not found!');
      console.error('Available sheets:', availableSheets);
      return jsonResponse({ ok: false, message: `Budget sheet "${BUDGET_SHEET_NAME}" not found. Available: ${availableSheets.join(', ')}` });
    }
    Logger.log('Budget sheet found: ' + sheet.getName());
    console.log('Budget sheet found:', sheet.getName());
    
    // Get all data from the sheet
    const lastRow = sheet.getLastRow();
    console.log('Last row in budget sheet:', lastRow);
    if (lastRow < 2) {
      return jsonResponse({ ok: false, message: 'Sheet is empty or has no data rows' });
    }

    // Read all rows (skip header row 1)
    const numColumns = sheet.getLastColumn();
    console.log('Number of columns:', numColumns);
    const dataRange = sheet.getRange(2, 1, lastRow - 1, numColumns);
    const rows = dataRange.getValues();
    console.log('Read', rows.length, 'data rows from budget sheet');
    
    // Create a map of item_id to row index for quick lookup
    const itemMap = new Map();
    rows.forEach((row, index) => {
      const itemId = String(row[ITEM_ID_COLUMN] || '').trim();
      if (itemId) {
        itemMap.set(itemId, index + 2); // +2 because we skipped header and arrays are 0-indexed
      }
    });

    Logger.log('=== Sheet Item Map Debug ===');
    Logger.log('Total rows in sheet: ' + rows.length);
    Logger.log('Item map size: ' + itemMap.size);
    Logger.log('First 10 item IDs in sheet: ' + JSON.stringify(Array.from(itemMap.keys()).slice(0, 10)));
    console.log('=== Sheet Item Map Debug ===');
    console.log('Total rows in sheet:', rows.length);
    console.log('Item map size:', itemMap.size);
    console.log('First 10 item IDs in sheet:', Array.from(itemMap.keys()).slice(0, 10));
    
    // Also log some sample rows to see the structure
    if (rows.length > 0) {
      Logger.log('Sample row 0 column 0 (ID): ' + rows[0][ITEM_ID_COLUMN]);
      Logger.log('Sample row 0 column 7 (Est. EUR): ' + rows[0][UNIT_COST_EUR_COLUMN]);
      Logger.log('Sample row 0 column 8 (Qty paid): ' + rows[0][QTY_FUNDED_COLUMN]);
      console.log('Sample row 0 (first data row):', rows[0]);
      console.log('Sample row 0 column 0 (ID):', rows[0][ITEM_ID_COLUMN]);
      console.log('Sample row 0 column 7 (Est. EUR):', rows[0][UNIT_COST_EUR_COLUMN]);
      console.log('Sample row 0 column 8 (Qty paid):', rows[0][QTY_FUNDED_COLUMN]);
    }
    Logger.log('============================');
    console.log('============================');

    let totalUpdated = 0;
    let generalDonationAmount = parseFloat(data.totalAmount);
    const updates = [];

    // Process each donation item
    Logger.log('=== Processing Donation Items ===');
    Logger.log('Total items to process: ' + data.items.length);
    console.log('=== Processing Donation Items ===');
    console.log('Total items to process:', data.items.length);
    for (const donationItem of data.items) {
      Logger.log('Processing item: ' + JSON.stringify(donationItem));
      console.log('Processing item:', JSON.stringify(donationItem));
      if (donationItem.type === 'general-donation') {
        // General donations will be distributed later
        continue;
      }

      if (donationItem.type === 'item' && donationItem.itemId) {
        // Specific item donation
        Logger.log('Looking for item ID: "' + donationItem.itemId + '"');
        Logger.log('Item ID type: ' + typeof donationItem.itemId);
        Logger.log('Item ID trimmed: "' + String(donationItem.itemId).trim() + '"');
        console.log(`Looking for item ID: "${donationItem.itemId}"`);
        console.log(`Item ID type: ${typeof donationItem.itemId}`);
        console.log(`Item ID trimmed: "${String(donationItem.itemId).trim()}"`);
        
        const rowIndex = itemMap.get(donationItem.itemId);
        if (!rowIndex) {
          // Try with trimmed version
          const trimmedItemId = String(donationItem.itemId).trim();
          const rowIndexTrimmed = itemMap.get(trimmedItemId);
          
          if (!rowIndexTrimmed) {
            Logger.log('❌ Item ID "' + donationItem.itemId + '" not found in sheet');
            Logger.log('Available item IDs (first 20): ' + JSON.stringify(Array.from(itemMap.keys()).slice(0, 20)));
            Logger.log('Trying case-insensitive search...');
            console.warn(`❌ Item ID "${donationItem.itemId}" not found in sheet`);
            console.warn(`Available item IDs (first 20):`, Array.from(itemMap.keys()).slice(0, 20));
            console.warn(`Trying case-insensitive search...`);
            
            // Try case-insensitive search
            let foundItemId = null;
            for (const [sheetItemId, idx] of itemMap.entries()) {
              if (sheetItemId.toLowerCase() === String(donationItem.itemId).toLowerCase().trim()) {
                foundItemId = sheetItemId;
                Logger.log('✅ Found case-insensitive match: "' + sheetItemId + '"');
                console.log(`✅ Found case-insensitive match: "${sheetItemId}"`);
                break;
              }
            }
            
            if (!foundItemId) {
              console.warn(`❌ No match found even with case-insensitive search`);
              continue;
            } else {
              // Use the found item ID
              const finalRowIndex = itemMap.get(foundItemId);
              console.log(`✅ Using row index: ${finalRowIndex}`);
              
              const row = rows[finalRowIndex - 2];
              const currentQtyFunded = parseFloat(row[QTY_FUNDED_COLUMN] || 0);
              const unitCostEUR = parseFloat(row[UNIT_COST_EUR_COLUMN] || 0);
              const qtyNeededTotal = parseFloat(row[QTY_NEEDED_TOTAL_COLUMN] || 0);

              if (unitCostEUR <= 0) {
                console.warn(`Item ${foundItemId} has invalid unit cost`);
                continue;
              }

              const donationAmount = parseFloat(donationItem.totalPrice || donationItem.unitPrice * donationItem.quantity);
              const unitsToAdd = donationAmount / unitCostEUR;
              const newQtyFunded = Math.min(currentQtyFunded + unitsToAdd, qtyNeededTotal);

              console.log(`✅ Updating item ${foundItemId}: qty ${currentQtyFunded} → ${newQtyFunded}, amount: ${donationAmount}`);
              
              sheet.getRange(finalRowIndex, QTY_FUNDED_COLUMN + 1).setValue(newQtyFunded);
              updates.push({
                itemId: foundItemId,
                oldQty: currentQtyFunded,
                newQty: newQtyFunded,
                amount: donationAmount
              });
              totalUpdated++;
              continue;
            }
          } else {
            console.log(`✅ Found item with trimmed ID at row ${rowIndexTrimmed}`);
            const row = rows[rowIndexTrimmed - 2];
            const currentQtyFunded = parseFloat(row[QTY_FUNDED_COLUMN] || 0);
            const unitCostEUR = parseFloat(row[UNIT_COST_EUR_COLUMN] || 0);
            const qtyNeededTotal = parseFloat(row[QTY_NEEDED_TOTAL_COLUMN] || 0);

            if (unitCostEUR <= 0) {
              console.warn(`Item ${trimmedItemId} has invalid unit cost`);
              continue;
            }

            const donationAmount = parseFloat(donationItem.totalPrice || donationItem.unitPrice * donationItem.quantity);
            const unitsToAdd = donationAmount / unitCostEUR;
            const newQtyFunded = Math.min(currentQtyFunded + unitsToAdd, qtyNeededTotal);

            console.log(`✅ Updating item ${trimmedItemId}: qty ${currentQtyFunded} → ${newQtyFunded}, amount: ${donationAmount}`);
            
            sheet.getRange(rowIndexTrimmed, QTY_FUNDED_COLUMN + 1).setValue(newQtyFunded);
            updates.push({
              itemId: trimmedItemId,
              oldQty: currentQtyFunded,
              newQty: newQtyFunded,
              amount: donationAmount
            });
            totalUpdated++;
            continue;
          }
        }
        
        console.log(`✅ Found item ID "${donationItem.itemId}" at row ${rowIndex}`);

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
        console.log(`✅ Updating item ${donationItem.itemId}: qty ${currentQtyFunded} → ${newQtyFunded}, amount: ${donationAmount}`);
        sheet.getRange(rowIndex, QTY_FUNDED_COLUMN + 1).setValue(newQtyFunded);
        updates.push({
          itemId: donationItem.itemId,
          oldQty: currentQtyFunded,
          newQty: newQtyFunded,
          amount: donationAmount
        });
        totalUpdated++;
        console.log(`✅ Item updated successfully. Updates array now has ${updates.length} items.`);
      } else if (donationItem.type === 'phase' && donationItem.phase) {
        // Phase donation - distribute to items in that phase
        // Note: New sheet structure has Phase in column B (index 1), no separate Project column
        console.log(`Processing phase donation: phase="${donationItem.phase}"`);
        const phaseItems = rows
          .map((row, idx) => ({ row, idx: idx + 2 }))
          .filter(({ row }) => {
            const phase = String(row[1] || '').trim(); // Column B (index 1) = Phase
            return phase.toLowerCase() === donationItem.phase.toLowerCase();
          });
        
        console.log(`Found ${phaseItems.length} items in phase "${donationItem.phase}"`);

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

          const itemId = String(row[ITEM_ID_COLUMN] || '');
          console.log(`✅ Updating phase item ${itemId}: qty ${currentQtyFunded} → ${newQtyFunded}, amount used: ${amountUsed}`);
          updates.push({
            itemId: itemId,
            oldQty: currentQtyFunded,
            newQty: newQtyFunded,
            amount: amountUsed
          });
          console.log(`✅ Phase item updated. Updates array now has ${updates.length} items.`);
        }
      } else {
        console.warn(`⚠️ Unknown donation item type: ${donationItem.type}`);
        console.warn(`Item data:`, JSON.stringify(donationItem));
      }
    }
    
    console.log('=== Finished Processing Donation Items ===');
    console.log(`Total items updated: ${totalUpdated}`);
    console.log(`Updates array length: ${updates.length}`);
    console.log('==========================================');

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
    console.log('=== Logging Donation to Sheet ===');
    console.log('Payment Method:', data.paymentMethod);
    console.log('Amount:', data.totalAmount);
    console.log('Payment ID:', data.paymentId || 'N/A');
    console.log('Payment Status:', data.paymentStatus || 'paid');
    console.log('=== Updates Array Debug ===');
    console.log('Updates array length:', updates.length);
    console.log('Updates array content:', JSON.stringify(updates, null, 2));
    console.log('Total items updated:', totalUpdated);
    console.log('===========================');
    logDonation(data, updates);
    console.log('=== Donation Logged Successfully ===');

    return jsonResponse({
      ok: true,
      message: `Successfully processed donation. Updated ${totalUpdated} items.`,
      updates: updates,
      totalUpdated: totalUpdated
    });

  } catch (err) {
    // Log detailed error information
    Logger.log('❌ ERROR processing donation: ' + err.toString());
    Logger.log('Error stack: ' + (err.stack || 'No stack'));
    Logger.log('Error details: ' + JSON.stringify(err, null, 2));
    console.error('Error processing donation:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', JSON.stringify(err, null, 2));
    
    // Try to log to the donations log sheet for debugging
    try {
      const logSS = SpreadsheetApp.openById(DONATIONS_LOG_SHEET_ID);
      let logSheet = logSS.getSheetByName(DONATIONS_LOG_SHEET_NAME);
      if (logSheet) {
        logSheet.appendRow([
          new Date().toISOString(),
          'ERROR',
          'error',
          0,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          0,
          JSON.stringify({ error: err.toString(), stack: err.stack }),
          'failed'
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
    Logger.log('=== Starting Donation Log to Sheet ===');
    Logger.log('Donations Log Sheet ID: ' + DONATIONS_LOG_SHEET_ID);
    Logger.log('Donations Log Sheet Name: ' + DONATIONS_LOG_SHEET_NAME);
    Logger.log('Payment Method: ' + donationData.paymentMethod);
    Logger.log('Payment ID: ' + (donationData.paymentId || 'N/A'));
    Logger.log('Amount: ' + donationData.totalAmount);
    console.log('=== Starting Donation Log to Sheet ===');
    console.log('Donations Log Sheet ID:', DONATIONS_LOG_SHEET_ID);
    console.log('Donations Log Sheet Name:', DONATIONS_LOG_SHEET_NAME);
    console.log('Payment Method:', donationData.paymentMethod);
    console.log('Payment ID:', donationData.paymentId || 'N/A');
    console.log('Amount:', donationData.totalAmount);
    
    console.log('Opening donations log spreadsheet...');
    const logSS = SpreadsheetApp.openById(DONATIONS_LOG_SHEET_ID);
    console.log('Donations log spreadsheet opened successfully');
    console.log('Available sheets:', logSS.getSheets().map(s => s.getName()));
    
    let logSheet = logSS.getSheetByName(DONATIONS_LOG_SHEET_NAME);
    
    // Define the expected header columns to match the actual Google Sheet structure
    const expectedHeaders = [
      'Timestamp',
      'source',
      'type',
      'amount',
      'email',
      'name',
      'donation receipt',
      'street',
      'zip',
      'city',
      'country',
      'newsletter',
      'comment',
      'item updated',
      'updated json',
      'status'
    ];
    
    if (!logSheet) {
      console.error('❌ Donations Log sheet not found!');
      console.error('Sheet ID:', DONATIONS_LOG_SHEET_ID);
      console.error('Sheet Name:', DONATIONS_LOG_SHEET_NAME);
      console.error('Available sheets:', logSS.getSheets().map(s => s.getName()));
      throw new Error(`Donations Log sheet "${DONATIONS_LOG_SHEET_NAME}" not found in spreadsheet ${DONATIONS_LOG_SHEET_ID}`);
    } else {
      console.log('✅ Donations Log sheet found:', logSheet.getName());
      // Check if sheet has 'status' column, add it if missing
      const headerRow = logSheet.getRange(1, 1, 1, logSheet.getLastColumn()).getValues()[0];
      const hasStatusColumn = headerRow.some(header => 
        header && header.toString().toLowerCase().trim() === 'status'
      );
      
      // Verify column positions for "item updated" and "updated json"
      const itemUpdatedIndex = headerRow.findIndex(header => 
        header && header.toString().toLowerCase().trim() === 'item updated'
      );
      const updatedJsonIndex = headerRow.findIndex(header => 
        header && header.toString().toLowerCase().trim() === 'updated json'
      );
      
      console.log('=== Column Header Verification ===');
      console.log('"item updated" found at index:', itemUpdatedIndex, '(expected: 13)');
      console.log('"updated json" found at index:', updatedJsonIndex, '(expected: 14)');
      console.log('Current sheet headers:', headerRow);
      console.log('Expected headers:', expectedHeaders);
      console.log('==================================');
      
      if (itemUpdatedIndex === -1 || updatedJsonIndex === -1) {
        console.warn('⚠️ WARNING: Column headers "item updated" or "updated json" not found!');
        console.warn('This may cause data to be written to wrong columns.');
      }
      
      if (!hasStatusColumn) {
        console.log('Adding "status" column as the last column (column P)...');
        // Add status column as the very last column (after "updated json")
        const lastCol = logSheet.getLastColumn();
        // Insert a new column after the last column
        logSheet.insertColumnAfter(lastCol);
        logSheet.getRange(1, lastCol + 1).setValue('status');
        console.log('"status" column added at position', lastCol + 1, '(column P)');
      }
    }
    
    // Get current number of columns in the sheet
    const numColumns = logSheet.getLastColumn();
    console.log('Sheet has', numColumns, 'columns');
    
    // Debug: Log updates array before creating logRow
    console.log('=== Updates Array in logDonation ===');
    console.log('Updates array:', updates);
    console.log('Updates length:', updates.length);
    console.log('Updates JSON:', JSON.stringify(updates));
    console.log('===================================');
    
    // Build log row to match the actual sheet structure:
    // Timestamp, source, type, amount, email, name, donation receipt, street, zip, city, country, newsletter, comment, item updated, updated json, status (last column P)
    const itemUpdatedValue = updates.length;
    const updatedJsonValue = JSON.stringify(updates);
    
    console.log('=== LogRow Values ===');
    console.log('Item Updated (column 14, index 13):', itemUpdatedValue);
    console.log('Updated JSON (column 15, index 14):', updatedJsonValue);
    console.log('====================');
    
    const logRow = [
      new Date().toISOString(),                                    // Timestamp (column 1, index 0)
      donationData.paymentMethod || 'unknown',                    // source (payment method) (column 2, index 1)
      donationData.donationType || 'one-time',                    // type (column 3, index 2)
      donationData.totalAmount,                                    // amount (column 4, index 3)
      donationData.donorEmail || '',                              // email (column 5, index 4)
      donationData.donorName || '',                                // name (column 6, index 5)
      donationData.wantsReceipt ? 'Yes' : 'No',                   // donation receipt (column 7, index 6)
      donationData.address?.street || '',                          // street (column 8, index 7)
      donationData.address?.postalCode || '',                      // zip (column 9, index 8)
      donationData.address?.city || '',                            // city (column 10, index 9)
      donationData.address?.country || '',                         // country (column 11, index 10)
      donationData.wantsNewsletter ? 'Yes' : 'No',                // newsletter (column 12, index 11)
      donationData.comment || '',                                  // comment (column 13, index 12)
      itemUpdatedValue,                                           // item updated (column 14, index 13)
      updatedJsonValue,                                            // updated json (column 15, index 14)
      donationData.paymentStatus || 'paid'                        // status (column 16, index 15)
    ];
    
    // Ensure logRow matches the number of columns (pad with empty strings if needed)
    while (logRow.length < numColumns) {
      logRow.push('');
    }
    // Trim if too long (shouldn't happen, but safety check)
    if (logRow.length > numColumns) {
      logRow.splice(numColumns);
    }
    
    console.log('Appending row with', logRow.length, 'columns');
    console.log('Row data preview:', {
      timestamp: logRow[0],
      source: logRow[1],
      type: logRow[2],
      amount: logRow[3],
      email: logRow[4],
      name: logRow[5],
      itemUpdated: logRow[13],
      updatedJson: logRow[14],
      status: logRow[15] || 'paid'
    });
    
    logSheet.appendRow(logRow);
    
    const lastRow = logSheet.getLastRow();
    console.log('✅ Donation successfully logged to sheet at row', lastRow);
    console.log('=== Donation Log Complete ===');
    
    // Verify the data was written correctly
    const writtenRow = logSheet.getRange(lastRow, 1, 1, Math.min(logRow.length, numColumns)).getValues()[0];
    console.log('=== Verification of Written Data ===');
    console.log('Written source (payment method, column 2):', writtenRow[1]);
    console.log('Written amount (column 4):', writtenRow[3]);
    console.log('Written email (column 5):', writtenRow[4] || 'N/A');
    console.log('Written item updated (column 14, index 13):', writtenRow[13]);
    console.log('Written updated json (column 15, index 14):', writtenRow[14]);
    console.log('Written status (column 16, index 15):', writtenRow[15] || writtenRow[numColumns - 1] || 'N/A');
    console.log('====================================');
    
  } catch (err) {
    console.error('❌ Error logging donation to sheet:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', JSON.stringify(err, null, 2));
    console.error('Payment Method:', donationData.paymentMethod);
    console.error('Payment ID:', donationData.paymentId || 'N/A');
    console.error('Amount:', donationData.totalAmount);
    
    // Try to log error to a separate error log if possible
    try {
      const logSS = SpreadsheetApp.openById(DONATIONS_LOG_SHEET_ID);
      let errorSheet = logSS.getSheetByName('Donation Log Errors');
      if (!errorSheet) {
        errorSheet = logSS.insertSheet('Donation Log Errors');
        errorSheet.appendRow(['Timestamp', 'Error', 'Source (Payment Method)', 'Payment ID', 'Amount', 'Error Details']);
      }
      errorSheet.appendRow([
        new Date().toISOString(),
        err.toString(),
        donationData.paymentMethod || 'unknown',
        donationData.paymentId || 'N/A',
        donationData.totalAmount || 0,
        JSON.stringify({ message: err.message, stack: err.stack })
      ]);
      console.log('Error logged to "Donation Log Errors" sheet');
    } catch (logErr) {
      console.error('Failed to log error to sheet:', logErr);
    }
    
    // Don't fail the whole request if logging fails
  }
}


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
    console.log('=== Logging Donation to Sheet ===');
    console.log('Payment Method:', data.paymentMethod);
    console.log('Amount:', data.totalAmount);
    console.log('Payment ID:', data.paymentId || 'N/A');
    console.log('Payment Status:', data.paymentStatus || 'paid');
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
    console.log('=== Starting Donation Log to Sheet ===');
    console.log('Sheet ID:', SHEET_ID);
    console.log('Payment Method:', donationData.paymentMethod);
    console.log('Payment ID:', donationData.paymentId || 'N/A');
    console.log('Amount:', donationData.totalAmount);
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let logSheet = ss.getSheetByName('Donations Log');
    
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
      console.log('Creating new "Donations Log" sheet...');
      logSheet = ss.insertSheet('Donations Log');
      logSheet.appendRow(expectedHeaders);
      console.log('"Donations Log" sheet created successfully with', expectedHeaders.length, 'columns');
    } else {
      // Check if sheet has 'status' column, add it if missing
      const headerRow = logSheet.getRange(1, 1, 1, logSheet.getLastColumn()).getValues()[0];
      const hasStatusColumn = headerRow.some(header => 
        header && header.toString().toLowerCase().trim() === 'status'
      );
      
      if (!hasStatusColumn) {
        console.log('Adding "status" column as the last column (column P)...');
        // Add status column as the very last column (after "updated json")
        const lastCol = logSheet.getLastColumn();
        // Insert a new column after the last column
        logSheet.insertColumnAfter(lastCol);
        logSheet.getRange(1, lastCol + 1).setValue('status');
        console.log('"status" column added at position', lastCol + 1, '(column P)');
      }
      
      console.log('Current sheet headers:', headerRow);
      console.log('Expected headers:', expectedHeaders);
    }
    
    // Get current number of columns in the sheet
    const numColumns = logSheet.getLastColumn();
    console.log('Sheet has', numColumns, 'columns');
    
    // Build log row to match the actual sheet structure:
    // Timestamp, source, type, amount, email, name, donation receipt, street, zip, city, country, newsletter, comment, item updated, updated json, status (last column P)
    const logRow = [
      new Date().toISOString(),                                    // Timestamp
      donationData.paymentMethod || 'unknown',                    // source (payment method)
      donationData.donationType || 'one-time',                    // type
      donationData.totalAmount,                                    // amount
      donationData.donorEmail || '',                              // email
      donationData.donorName || '',                                // name
      donationData.wantsReceipt ? 'Yes' : 'No',                   // donation receipt
      donationData.address?.street || '',                          // street
      donationData.address?.postalCode || '',                      // zip
      donationData.address?.city || '',                            // city
      donationData.address?.country || '',                         // country
      donationData.wantsNewsletter ? 'Yes' : 'No',                // newsletter
      donationData.comment || '',                                  // comment
      updates.length,                                              // item updated
      JSON.stringify(updates),                                     // updated json
      donationData.paymentStatus || 'paid'                        // status (paid/unpaid/pending/failed)
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
      status: logRow[15] || 'paid'
    });
    
    logSheet.appendRow(logRow);
    
    const lastRow = logSheet.getLastRow();
    console.log('✅ Donation successfully logged to sheet at row', lastRow);
    console.log('=== Donation Log Complete ===');
    
    // Verify the data was written correctly
    const writtenRow = logSheet.getRange(lastRow, 1, 1, Math.min(logRow.length, numColumns)).getValues()[0];
    console.log('Verification - Written source (payment method):', writtenRow[1]);
    console.log('Verification - Written amount:', writtenRow[3]);
    console.log('Verification - Written email:', writtenRow[4] || 'N/A');
    console.log('Verification - Written status (column P):', writtenRow[15] || writtenRow[numColumns - 1] || 'N/A');
    
  } catch (err) {
    console.error('❌ Error logging donation to sheet:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', JSON.stringify(err, null, 2));
    console.error('Payment Method:', donationData.paymentMethod);
    console.error('Payment ID:', donationData.paymentId || 'N/A');
    console.error('Amount:', donationData.totalAmount);
    
    // Try to log error to a separate error log if possible
    try {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let errorSheet = ss.getSheetByName('Donation Log Errors');
      if (!errorSheet) {
        errorSheet = ss.insertSheet('Donation Log Errors');
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


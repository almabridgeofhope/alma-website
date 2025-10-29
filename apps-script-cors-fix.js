// Erweitertes Apps Script mit CORS-Support
// Kopiere das in dein Apps Script und speichere/deploye neu

// CONFIG
const SHEET_ID = '1jz99T0uzwOXXN7gyXN9HyTAQ_oK2P2D4zOAu8qkvw_I';
const SHEET_NAME = 'Tabellenblatt1';

function doPost(e) {
  try {
    let data = {};
    
    // Handle both JSON and FormData
    if (e.postData && e.postData.contents) {
      // JSON data
      data = JSON.parse(e.postData.contents);
    } else if (e.parameters) {
      // FormData parameters
      data = {
        email: e.parameters.email ? e.parameters.email[0] : '',
        source: e.parameters.source ? e.parameters.source[0] : 'website'
      };
    } else {
      return jsonResponse({ ok: false, message: 'No payload' });
    }

    const email = String(data.email || '').trim().toLowerCase();
    const source = String(data.source || 'website').trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonResponse({ ok: false, message: 'Invalid email' });
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

    // Header sicherstellen
    const firstRow = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
    if (!firstRow || firstRow[0] !== 'email') {
      sheet.getRange(1, 1, 1, 5).setValues([['email','timestamp','source','status','confirmed_at']]);
    }

    sheet.appendRow([email, new Date().toISOString(), source, 'pending', '']);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, message: String(err) });
  }
}

// WICHTIG: Diese Funktion für CORS hinzufügen
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600'
    });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

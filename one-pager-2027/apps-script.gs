/**
 * The Femmes 2027 - registration receiver.
 * Paste into Extensions > Apps Script on the Google Sheet, then
 * Deploy > New deployment > Web app > Execute as: Me / Who has access: Anyone.
 * Copy the /exec URL into script.js (ENDPOINT).
 *
 * After ANY change here: Deploy > Manage deployments > edit > New version.
 * The /exec URL only serves the version you deployed, not the code you saved.
 */

var SHEET_NAME = 'Registrations';
var NOTIFY_EMAIL = 'info@pedalandpause.com';   // set to '' to switch off email alerts

var COLUMNS = [
  'submitted_at', 'name', 'email', 'phone', 'country',
  'intent', 'room', 'level', 'friend', 'transfer', 'notes', 'consent', 'offer_state', 'camp', 'page'
];

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
      sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var row = COLUMNS.map(function (c) {
      if (c === 'submitted_at') return p[c] ? new Date(p[c]) : new Date();
      return p[c] || '';
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: 'The Femmes 2027 - new registration: ' + (p.name || 'unnamed'),
        body: COLUMNS.map(function (c) { return c + ': ' + (p[c] || ''); }).join('\n')
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Visiting the /exec URL in a browser should show this - a quick "is it alive" check.
function doGet() {
  return ContentService.createTextOutput('The Femmes 2027 registration endpoint is live.');
}

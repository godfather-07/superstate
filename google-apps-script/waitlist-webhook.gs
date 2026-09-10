/**
 * Superstate Waitlist -> Google Sheets webhook.
 *
 * Setup (one-time):
 * 1. Open the "Influencer Waitlist Responses" sheet.
 * 2. Extensions menu -> Apps Script.
 * 3. In Code.gs, select ALL existing text (Ctrl/Cmd+A) and delete it first,
 *    then paste this whole file in. (Google seeds new script files with a
 *    stub `function myFunction() {}` - leaving that in causes a syntax error.)
 * 4. Save, then Deploy -> New deployment -> type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the deployment's Web app URL and set it as VITE_WAITLIST_SHEET_URL
 *    (see .env.example) before building/deploying the site.
 */

const SHEET_NAME = 'Sheet1';
const HEADERS = ['Timestamp', 'Name', 'Email', 'Phone', 'Gender', 'Promo Code', 'Discount', 'Is Influencer'];

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

  const data = e.parameter;
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.phone || '',
    data.gender || '',
    data.promoCode || '',
    data.discount || '',
    data.isInfluencer || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Diagnostic only - run this manually (Run button, function dropdown set to
 * "checkBinding") to confirm this script is actually bound to the right
 * sheet. Open View -> Logs (or Executions) afterward to read the output.
 */
function checkBinding() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log('NOT BOUND: this script is not attached to any spreadsheet. ' +
      'It must be opened via Extensions > Apps Script from inside the sheet itself.');
    return;
  }
  Logger.log('Bound spreadsheet name: ' + ss.getName());
  Logger.log('Bound spreadsheet URL: ' + ss.getUrl());
  Logger.log('Sheet tabs found: ' + ss.getSheets().map(s => s.getName()).join(', '));
}

/**
 * Diagnostic only - run this manually to append a test row and confirm
 * writes actually reach the sheet. Check the Executions log for errors,
 * then check the sheet for a new row.
 */
function testAppend() {
  const result = doPost({
    parameter: {
      name: 'Test', email: 'test@example.com', phone: '1234567890',
      gender: 'male', promoCode: 'SUPERSTATE10', discount: '10', isInfluencer: 'false'
    }
  });
  Logger.log('doPost returned: ' + result.getContent());
}

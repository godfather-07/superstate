/**
 * Superstate Waitlist → Google Sheets webhook.
 *
 * Setup (one-time):
 * 1. Open the "Influencer Waitlist Responses" sheet.
 * 2. Extensions → Apps Script.
 * 3. Delete any starter code, paste this whole file in, and save.
 * 4. Deploy → New deployment → type "Web app".
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

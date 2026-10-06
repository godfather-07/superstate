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
 *
 * Updating an existing deployment (keeps the same URL):
 *   Deploy -> Manage deployments -> pencil icon -> Version: "New version" -> Deploy.
 */

const SHEET_NAME = 'Sheet1';
const HEADERS = ['Timestamp', 'Name', 'Email', 'Phone', 'Gender', 'Promo Code', 'Discount', 'Is Influencer'];

// Pre-bookings (no payment yet) go to their own tab.
const PREBOOK_SHEET_NAME = 'Prebooks';
const PREBOOK_HEADERS = ['Timestamp', 'Member No.', 'Name', 'Phone', 'Email', 'Pack', 'Qty', 'Full Price', 'Pre-book Price', 'Payment Status', 'Razorpay Order ID', 'Razorpay Payment ID'];
// Batch 01 customers already hold cards #1-#27, so pre-bookers start at #28.
const MEMBER_OFFSET = 27;

function doPost(e) {
  const data = e.parameter;
  if (data.type === 'prebook') return handlePrebook(data);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

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

  return json({ result: 'success' });
}

function handlePrebook(data) {
  // Lock so two people pre-booking at the same moment never get the same number.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(PREBOOK_SHEET_NAME) || ss.insertSheet(PREBOOK_SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(PREBOOK_HEADERS);

    const memberNumber = MEMBER_OFFSET + sheet.getLastRow(); // header row counts as 1 -> first pre-booker is #28
    sheet.appendRow([
      new Date(),
      memberNumber,
      data.name || '',
      data.phone || '',
      data.email || '',
      data.pack || '',
      data.qty || '',
      data.fullPrice || '',
      data.prebookPrice || '',
      data.paymentStatus || 'Awaiting payment link',
      data.orderId || '',
      data.paymentId || ''
    ]);
    return json({ result: 'success', memberNumber: memberNumber });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
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
      gender: 'male', promoCode: 'FIRSTNIGHT20', discount: '20', isInfluencer: 'false'
    }
  });
  Logger.log('doPost returned: ' + result.getContent());
}

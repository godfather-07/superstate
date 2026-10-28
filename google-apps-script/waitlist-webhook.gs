/**
 * Superstate -> Google Sheets webhook (orders + old waitlist).
 *
 * SCRIPT_VERSION below is shown when you open the web app URL in a browser.
 * If the browser shows an older version (or no version at all), the live
 * deployment is still running old code: do "Updating an existing deployment".
 *
 * Setup (one-time):
 * 1. Open the "Influencer Waitlist Responses" sheet.
 * 2. Extensions menu -> Apps Script.
 * 3. In Code.gs, select ALL existing text (Ctrl/Cmd+A) and delete it first,
 *    then paste this whole file in. Keep it to ONE file: if you have other
 *    .gs files (e.g. Untitled.gs) with their own doPost, delete them. (Google seeds new script files with a
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

const SCRIPT_VERSION = '2026-10-28 contact-form';

const SHEET_NAME = 'Sheet1';
const HEADERS = ['Timestamp', 'Name', 'Email', 'Phone', 'Gender', 'Promo Code', 'Discount', 'Is Influencer'];

// Paid orders go to their own tab (named "Prebooks" from the pre-book days;
// the website still sends type=prebook, so keep the name).
const PREBOOK_SHEET_NAME = 'Prebooks';
const PREBOOK_HEADERS = ['Timestamp', 'Order No.', 'Name', 'Phone', 'Email', 'Pack', 'Qty', 'Full Price', 'Paid (after discount)', 'Payment Status', 'Razorpay Order ID', 'Razorpay Payment ID', 'Address', 'Pincode', 'City', 'State', 'Referred By', 'Discount Code'];
// Contact-form messages from the website's Contact page.
const MESSAGES_SHEET_NAME = 'Messages';
const MESSAGES_HEADERS = ['Timestamp', 'Name', 'Email', 'Phone', 'Reason', 'Order ID', 'Message', 'Status'];

// Order numbers continue from batch 01 (#1-#27), so new orders start at #28.
const MEMBER_OFFSET = 27;

// Open the web app URL in a browser to check which code is live.
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return json({
    ok: true,
    version: SCRIPT_VERSION,
    sheet: ss ? ss.getName() : 'NOT BOUND',
    tabs: ss ? ss.getSheets().map(sh => sh.getName()) : []
  });
}

function doPost(e) {
  // doPost runs when the website sends data. Pressing "Run" in the editor
  // calls it with no request, so explain instead of crashing.
  if (!e || !e.parameter) {
    Logger.log('doPost only runs when the website sends data. To test, pick ' +
      '"testAppend" or "testPrebook" in the function dropdown and press Run.');
    return json({ result: 'error', message: 'no request data' });
  }
  const data = e.parameter;
  if (data.type === 'prebook') return handlePrebook(data);
  if (data.type === 'contact') return handleContact(data);

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
  // Lock so two people ordering at the same moment never get the same number.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(PREBOOK_SHEET_NAME) || ss.insertSheet(PREBOOK_SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(PREBOOK_HEADERS);
    // New columns are only ever added at the end, so refreshing the header
    // row labels them on an existing sheet without moving any data.
    else sheet.getRange(1, 1, 1, PREBOOK_HEADERS.length).setValues([PREBOOK_HEADERS]);

    // The same payment can arrive twice (browser confirmation + Razorpay
    // webhook). If this order is already logged, return its member number.
    if (data.orderId && sheet.getLastRow() > 1) {
      const orderIdCol = PREBOOK_HEADERS.indexOf('Razorpay Order ID') + 1;
      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, orderIdCol).getValues();
      for (const row of rows) {
        if (row[orderIdCol - 1] === data.orderId) {
          return json({ result: 'duplicate', memberNumber: row[1] });
        }
      }
    }

    const memberNumber = MEMBER_OFFSET + sheet.getLastRow(); // header row counts as 1 -> first order is #28
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
      data.paymentId || '',
      data.address || '',
      data.pincode || '',
      data.city || '',
      data.state || '',
      data.referredBy || '',
      data.discountCode || ''
    ]);
    return json({ result: 'success', memberNumber: memberNumber });
  } finally {
    lock.releaseLock();
  }
}

function handleContact(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MESSAGES_SHEET_NAME) || ss.insertSheet(MESSAGES_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(MESSAGES_HEADERS);
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.phone || '',
    data.reason || '',
    data.orderId || '',
    data.message || '',
    'New'
  ]);
  return json({ result: 'success' });
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

/**
 * Diagnostic only - run manually to add a test order row to the "Prebooks"
 * tab and confirm all 18 columns fill in. Delete the test row from the sheet afterwards.
 */
function testPrebook() {
  const result = doPost({
    parameter: {
      type: 'prebook', name: 'Test Prebook', phone: '9999999999', email: 'test@example.com',
      pack: 'Pack Of 30', qty: '1', fullPrice: '1500', prebookPrice: '1050',
      paymentStatus: 'TEST - delete me', orderId: 'order_TEST_' + Date.now(), paymentId: 'pay_TEST',
      address: '12 Test Street, Indiranagar', pincode: '560038', city: 'Bengaluru', state: 'Karnataka', referredBy: 'ABHIJITH30', discountCode: 'ABHIJITH30'
    }
  });
  Logger.log('doPost returned: ' + result.getContent());
}

/**
 * Diagnostic only - run manually to add a test row to the "Messages" tab.
 * Delete the test row afterwards.
 */
function testContact() {
  const result = doPost({
    parameter: {
      type: 'contact', name: 'Test Message', email: 'test@example.com', phone: '9999999999',
      reason: 'product', orderId: '', message: 'TEST - delete me'
    }
  });
  Logger.log('doPost returned: ' + result.getContent());
}

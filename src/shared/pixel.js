/**
 * Meta (Facebook / Instagram) Pixel.
 *
 * Pixel IDs are public (they're visible in every site's page source), so they
 * live here rather than in a secret. Every ID listed gets every event; leave
 * the list empty and the pixel stays off.
 *
 * Events sent:
 * - PageView          every page
 * - ViewContent       product page
 * - InitiateCheckout  checkout page opened / product page "Buy now" button
 * - AddPaymentInfo    "pay" pressed on the checkout page (Razorpay opens)
 * - Purchase          payment verified by our server (value in INR, coupon)
 * Creator codes ride along as `creator` so ads can be split by creator.
 *
 * Every event is ALSO pushed to Google Tag Manager's dataLayer (GTM-TGW85RP2)
 * as `ss_<Event>` (e.g. ss_Purchase) with the same values, so GA4,
 * Google Ads etc. can be set up in GTM without code changes.
 * Don't add the Meta pixel inside GTM too: that would double-count.
 *
 * Google Analytics 4 (G-5915THJCM5) is loaded by the Google tag in each
 * page's <head>. The same events go to GA4 under its ecommerce names
 * (view_item, begin_checkout, add_payment_info, purchase), so revenue and
 * coupon/creator reports work in GA4. Don't add a GA4 tag inside GTM too.
 */

export const META_PIXEL_IDS = ['1380597944288890', '2385448578867386'];

const GA4_EVENTS = {
  ViewContent: 'view_item',
  InitiateCheckout: 'begin_checkout',
  AddPaymentInfo: 'add_payment_info',
  Purchase: 'purchase'
};

function sendToGa4(event, params, options) {
  const name = GA4_EVENTS[event];
  if (!name || typeof window.gtag !== 'function') return;
  const item = { item_id: 'sleep-well', item_name: params.content_name || 'Sleep Well', quantity: params.num_items || 1 };
  if (params.coupon) item.coupon = params.coupon;
  const ga = { currency: params.currency || 'INR', items: [item] };
  if (params.value != null) ga.value = params.value;
  if (params.coupon) ga.coupon = params.coupon;
  if (params.creator) ga.creator = params.creator;
  if (name === 'purchase' && options && options.eventID) ga.transaction_id = options.eventID;
  window.gtag('event', name, ga);
}

function load() {
  if (window.fbq) return;
  /* Meta's standard base code */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
}

// Call once per page. Safe to call more than once.
export function initPixel() {
  if (!META_PIXEL_IDS.length || window.__ssPixelReady) return;
  window.__ssPixelReady = true;
  load();
  META_PIXEL_IDS.forEach(id => window.fbq('init', id));
  window.fbq('track', 'PageView');
}

// GA4 client id from the _ga cookie ("GA1.1.123.456" -> "123.456"), or ''.
// Sent with the order so the server-side purchase joins this visit.
export function gaClientId() {
  const m = document.cookie.match(/(?:^|;\s*)_ga=GA\d\.\d\.(\d+\.\d+)/);
  return m ? m[1] : '';
}

// track('Purchase', { value: 750, currency: 'INR' }, { eventID: 'pay_123' })
export function track(event, params = {}, options) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: `ss_${event}`, ...params, event_id: options && options.eventID });
  } catch (e) { /* ignore */ }
  try { sendToGa4(event, params, options); } catch (e) { /* ignore */ }
  if (!META_PIXEL_IDS.length || typeof window.fbq !== 'function') return;
  try {
    if (options) window.fbq('track', event, params, options);
    else window.fbq('track', event, params);
  } catch (e) { /* never let tracking break the page */ }
}

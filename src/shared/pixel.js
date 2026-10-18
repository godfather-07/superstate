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
 * - InitiateCheckout  pre-book page opened / product page "Pre-book" button
 * - AddPaymentInfo    "pay" pressed on the pre-book page (Razorpay opens)
 * - Purchase          payment verified by our server (value in INR)
 * - Lead              waitlist signup
 * Creator codes ride along as `creator` so ads can be split by creator.
 *
 * Every event is ALSO pushed to Google Tag Manager's dataLayer (GTM-TGW85RP2)
 * as `ss_<Event>` (e.g. ss_Purchase, ss_Lead) with the same values, so GA4,
 * Google Ads etc. can be set up in GTM without code changes.
 * Don't add the Meta pixel inside GTM too: that would double-count.
 */

export const META_PIXEL_IDS = ['1380597944288890', '2385448578867386'];

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

// track('Purchase', { value: 750, currency: 'INR' }, { eventID: 'pay_123' })
export function track(event, params = {}, options) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: `ss_${event}`, ...params, event_id: options && options.eventID });
  } catch (e) { /* ignore */ }
  if (!META_PIXEL_IDS.length || typeof window.fbq !== 'function') return;
  try {
    if (options) window.fbq('track', event, params, options);
    else window.fbq('track', event, params);
  } catch (e) { /* never let tracking break the page */ }
}

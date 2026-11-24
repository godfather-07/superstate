# SuperState Shopify theme

The superstate.in site ported to a Shopify Online Store 2.0 theme. It keeps the
same design, copy and URLs (`/products/sleep-well`, `/pages/our-story`, …), so
links, ads and SEO keep working once the domain points at Shopify.

## What's in it

| Page | Template | Notes |
| --- | --- | --- |
| Home | `index.json` | hero, "industry is broken", beliefs, close-the-gap, Sleep Well |
| Sleep Well | `product.json` | pack cards from Shopify variants, buy box, sheep game, what's inside, creator reels, ritual video, FAQ |
| Our Story | `page.our-story.json` | |
| FAQs | `page.faqs.json` | prices come from the product's variants |
| Contact | `page.contact.json` | Shopify contact form (emails go to the store's sender address) |
| Shipping / Refunds / Privacy / Terms | `page.policy.json` | built-in text; write your own in the page and it replaces it |
| Cart, collection, search, 404, blog, password | standard templates | styled to match |

Site-wide: header + mobile menu, footer, cart drawer, WhatsApp button,
launch-sale nudge card, GA4, GTM and Meta Pixel.

## Setup (once)

1. **Upload the theme**: zip the contents of this folder (`cd shopify-theme && zip -r ../superstate-theme.zip assets config layout locales sections snippets templates`),
   then Shopify admin → Online Store → Themes → Add theme → Upload zip.
   Or with Shopify CLI: `shopify theme push --unpublished --path shopify-theme`.
2. **Product**: one product, handle `sleep-well`, one option ("Pack") with
   variants named exactly `Pack Of 5`, `Pack Of 15`, `Pack Of 30` at full price
   (₹299 / ₹900 / ₹1,500). The number at the end of the name drives the
   "₹/serve" figure and the "best value" tag. Add product photos if you like:
   the first image replaces the built-in box photo.
3. **Pages**: create these pages (title + handle) and pick the template:

   | Title | Handle | Template |
   | --- | --- | --- |
   | Our Story | `our-story` | `page.our-story` |
   | FAQs | `faqs` | `page.faqs` |
   | Contact | `contact` | `page.contact` |
   | Shipping Policy | `shipping` | `page.policy` |
   | Returns & Refunds | `refunds` | `page.policy` |
   | Privacy Policy | `privacy` | `page.policy` |
   | Terms of Use | `terms` | `page.policy` |

   Leave the content empty to use the built-in text.
4. **Discount codes** (Discounts → Create → Amount off order, percentage):
   `FIRSTNIGHT20` = 20%, and every creator code = 30%
   (`ABHIJITH30`, `ABHIMANYU30`, `FAIHA30`, `KRISHNA30`, `SALIH30`, `SHAMNAS30`).
   Don't also add an automatic 20% discount: the theme already sends
   FIRSTNIGHT20 to checkout, and an automatic one would stack or clash with creator codes.
5. **Payments**: keep Razorpay as the payment provider in Settings → Payments.
6. **Shipping**: Settings → Shipping → free rate for India.
7. **Purchase tracking**: install Shopify's *Facebook & Instagram* and
   *Google & YouTube* apps so Purchase events fire from checkout. If those
   apps also send PageView, blank the matching IDs under Theme settings →
   Tracking so page views aren't counted twice.
8. **Domain**: once you're happy, connect www.superstate.in in Settings → Domains
   and retire the Vercel site.

## Day-to-day (Theme settings → Customize)

- **Launch offer & creator codes**: launch code and %, creator list
  (`CODE | Name | %`, one per line), gift pack name, nudge on/off.
  Setting the launch % to 0 ends the sale: prices show in full and the
  game, launch bar and "% off" badges disappear.
- **Add a creator**: add a line to the creator list *and* create the same
  code in Discounts. Their link is `https://www.superstate.in/?ref=CODE`
  (any page, remembered for 30 days, prices on the site switch to their %).
- **New creator reel**: product page → "Product: creator reels" → Add block.
  Upload the video in the block, or use a file in the theme's assets.
- **Contact & social, tracking IDs, logo**: in Theme settings.

## How checkout works

- **Buy now** replaces the cart with the chosen pack and goes straight to
  Shopify checkout with the code applied:
  `/cart/<variant>:<qty>?discount=CODE&attributes[Referred by]=CODE`.
- **Add to cart** opens the drawer; its checkout button goes to
  `/checkout?discount=CODE`.
- The code is: a code typed in the drawer → else a remembered creator link →
  else the launch code. Shopify validates and applies it; the prices on the
  site are a preview.
- "Referred by" and "Discount code" are saved on the order as cart attributes.

## Not carried over

- `api/` (Razorpay order creation, webhook, Shopify order sync, server-side GA4
  purchase): Shopify checkout now does this natively.
- `/pages/prebook`: replaced by Shopify checkout. Add a URL redirect
  (Online Store → Navigation → URL redirects) from `/pages/prebook` to
  `/products/sleep-well`.
- Contact form → Google Sheet: the form now emails you through Shopify.
  The Apps Script sheet can stay for anything else that uses it.

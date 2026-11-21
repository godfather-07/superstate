# Golden Ratio — thegoldnratio.com

Single-page portfolio site for Golden Ratio, a brand strategy, creative direction and marketing studio in Bengaluru. Built from the *Golden Ratio — Website PRD*.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 + CSS custom properties · GSAP ScrollTrigger (scroll-driven motion) · Framer Motion (reveals, route transitions) · React Hook Form + Zod · Resend · Vercel Analytics + GA4 + Clarity.

## Run it

```bash
cd golden-ratio
npm install
cp .env.example .env.local   # fill in what you have; everything is optional locally
npm run dev                  # http://localhost:3000
```

`npm run build && npm start` for a production build. `npm run typecheck` checks types.

## Deploy (Vercel)

1. Import the repository in Vercel and set **Root Directory** to `golden-ratio`.
2. Add the environment variables from `.env.example` (Production + Preview).
3. Point `thegoldnratio.com` and `www.thegoldnratio.com` at the project. The apex redirects to `www` (see `next.config.ts`).
4. In Resend, verify the `thegoldnratio.com` domain so `RESEND_FROM` can send.

Until `RESEND_API_KEY` is set, the brief form returns *“The form is not configured yet”* in production (it never silently drops a brief). In development it logs the brief to the terminal instead.

## Where things live

| What | Where |
|---|---|
| Design tokens (colours, Fibonacci spacing, type scale) | `src/styles/globals.css` |
| Site config: email, phone, WhatsApp, Calendly, address, socials | `src/lib/site.ts` |
| Section copy (hero, services, studio, process) | `src/lib/copy.ts` |
| Projects, testimonials, client logos (until Sanity is connected) | `src/lib/content.ts` |
| Sanity client with local fallback, ISR 60s | `src/lib/sanity.ts`, schemas in `sanity/schemas` |
| Golden spiral geometry (logo, intro, icons, favicons, OG image) | `src/lib/spiral.ts` |
| Contact API (validation, honeypot, rate limit, emails) | `src/app/api/contact/route.ts` |
| Structured data (Organization, LocalBusiness, Service, BreadcrumbList) | `src/lib/structured-data.ts` |

## Before launch

Search the codebase for `[` — every placeholder is in **[BRACKETS]**: client names, case-study copy and metrics, testimonial quotes, George's bio, the street address and PIN code, legal dates and the grievance officer. Also:

- **Images:** add `src` to any `ImageAsset` in `content.ts` (or upload in Sanity). Until then each image is a labelled dark placeholder, as the PRD asks. The Studio portrait is in `src/components/sections/Studio.tsx`.
- **Client logos:** monochrome white SVGs in `public/images/clients/`, then set `logo: '/images/clients/name.svg'`.
- **Socials:** fill the URLs in `site.ts`; icons without a URL show as “coming soon” and are left out of structured data.
- **Legal:** `src/app/privacy` and `src/app/terms` are templates written for India's DPDP Act. Have counsel review them.

## Behaviour notes

- **Intro** plays once per browser session on the home page (3s spiral draw + counter, click or any key to skip). It is decided before first paint, so return visits never flash the loader. Reduced-motion users skip it.
- **Reduced motion** is respected everywhere: Framer Motion via `MotionConfig`, GSAP parallax and pinning are disabled or scrubbed without easing, CSS animations collapse.
- **Custom cursor** only on fine pointers that can hover. Add `data-cursor="Label"` to any element to show a label in the ring.
- **Analytics events:** `page_view`, `scroll_depth` (25/50/75/90/100), `cta_click` (any element with `data-track`), `generate_lead` (brief sent), `book_call` (Calendly booking), `sound_toggle`.
- **Ambient sound** is synthesised with the Web Audio API — no audio file to load. Off by default.
- **Three.js** (optional in the PRD) is not used: the spiral is SVG, which keeps the intro light on every device.

import type { Client, Project, Testimonial } from './types';

/**
 * Local content. This is what the site renders until Sanity is connected
 * (see src/lib/sanity.ts). Every value in [BRACKETS] is a placeholder —
 * search the codebase for "[" before launch.
 */

const challenge = (n: string) => [
  `[DESCRIPTION — ${n}] What the client came to us with: the market they were entering, what was not working, and what was at stake.`,
  '[DESCRIPTION] The constraint that made the problem interesting. Two or three sentences, no more.',
];

const approach = (n: string) => [
  `[DESCRIPTION — ${n}] The strategic insight the work was built on, in one plain sentence.`,
  '[DESCRIPTION] How that idea became a visual and verbal system: identity, packaging, campaign, rollout.',
];

const gallery = (n: string) => [
  { alt: `${n} — identity system overview`, placeholder: 'Identity system overview — logo, colour and type on dark' },
  { alt: `${n} — packaging, front of pack`, placeholder: 'Packaging, front of pack — studio lit, moody' },
  { alt: `${n} — campaign key visual`, placeholder: 'Campaign key visual' },
  { alt: `${n} — detail shot`, placeholder: 'Detail — texture, foil, type close-up' },
  { alt: `${n} — brand in the world`, placeholder: 'Brand in the world — retail shelf or out-of-home' },
  { alt: `${n} — social content grid`, placeholder: 'Social content — 3×3 grid' },
];

export const projects: Project[] = [
  {
    slug: 'client-one',
    name: '[CLIENT NAME 01]',
    category: 'Brand Identity',
    summary: '[DESCRIPTION] A wellness brand that needed to look as considered as its formulation.',
    services: ['Brand Strategy', 'Visual Identity', 'Packaging'],
    year: '[YEAR]',
    orientation: 'portrait',
    hero: { alt: '[CLIENT NAME 01] brand identity', placeholder: 'Hero — packaging on black, single key light' },
    challenge: challenge('01'),
    approach: approach('01'),
    gallery: gallery('[CLIENT NAME 01]'),
    results: [
      { value: '[X]%', label: '[KPI] increase in repeat purchase' },
      { value: '[X]×', label: '[KPI] growth in organic reach' },
      { value: '[X]', label: '[KPI] retail doors in six months' },
    ],
  },
  {
    slug: 'client-two',
    name: '[CLIENT NAME 02]',
    category: 'Campaign',
    summary: '[DESCRIPTION] A launch campaign for a category nobody had explained well.',
    services: ['Creative Direction', 'Launch Campaigns', 'Content Strategy'],
    year: '[YEAR]',
    orientation: 'landscape',
    hero: { alt: '[CLIENT NAME 02] campaign', placeholder: 'Hero — campaign film still, wide' },
    challenge: challenge('02'),
    approach: approach('02'),
    gallery: gallery('[CLIENT NAME 02]'),
    results: [
      { value: '[X]M', label: '[KPI] campaign impressions' },
      { value: '[X]%', label: '[KPI] lower cost per acquisition' },
      { value: '[X]%', label: '[KPI] lift in brand search' },
    ],
  },
  {
    slug: 'client-three',
    name: '[CLIENT NAME 03]',
    category: 'Packaging',
    summary: '[DESCRIPTION] A food brand moving from farmers’ markets to modern retail.',
    services: ['Packaging Design', 'Art Direction', 'Brand Architecture'],
    year: '[YEAR]',
    orientation: 'landscape',
    hero: { alt: '[CLIENT NAME 03] packaging range', placeholder: 'Hero — full packaging range, overhead' },
    challenge: challenge('03'),
    approach: approach('03'),
    gallery: gallery('[CLIENT NAME 03]'),
    results: [
      { value: '[X]%', label: '[KPI] sell-through in launch quarter' },
      { value: '[X]', label: '[KPI] SKUs in one system' },
      { value: '[X]%', label: '[KPI] increase in average order value' },
    ],
  },
  {
    slug: 'client-four',
    name: '[CLIENT NAME 04]',
    category: 'Brand Strategy',
    summary: '[DESCRIPTION] A beauty founder who had outgrown the brand she started with.',
    services: ['Brand Positioning', 'Naming & Verbal Identity', 'Visual Identity'],
    year: '[YEAR]',
    orientation: 'portrait',
    hero: { alt: '[CLIENT NAME 04] rebrand', placeholder: 'Hero — product portrait, warm shadow' },
    challenge: challenge('04'),
    approach: approach('04'),
    gallery: gallery('[CLIENT NAME 04]'),
    results: [
      { value: '[X]%', label: '[KPI] increase in conversion rate' },
      { value: '[X]×', label: '[KPI] growth in D2C revenue' },
      { value: '[X]', label: '[KPI] press features at relaunch' },
    ],
  },
  {
    slug: 'client-five',
    name: '[CLIENT NAME 05]',
    category: 'Digital & UI/UX',
    summary: '[DESCRIPTION] A store that had to sell a premium product without a salesperson.',
    services: ['UI/UX Design', 'Content Strategy', 'Performance Marketing'],
    year: '[YEAR]',
    orientation: 'portrait',
    hero: { alt: '[CLIENT NAME 05] website', placeholder: 'Hero — website on device, dark room' },
    challenge: challenge('05'),
    approach: approach('05'),
    gallery: gallery('[CLIENT NAME 05]'),
    results: [
      { value: '[X]%', label: '[KPI] increase in add-to-cart' },
      { value: '[X]s', label: '[KPI] faster time to first purchase' },
      { value: '[X]%', label: '[KPI] lift in email capture' },
    ],
  },
  {
    slug: 'client-six',
    name: '[CLIENT NAME 06]',
    category: 'Social & Content',
    summary: '[DESCRIPTION] A brand with a loyal community and no visual voice.',
    services: ['Social Media', 'Art Direction', 'Email & CRM'],
    year: '[YEAR]',
    orientation: 'landscape',
    hero: { alt: '[CLIENT NAME 06] social content', placeholder: 'Hero — content shoot behind the scenes' },
    challenge: challenge('06'),
    approach: approach('06'),
    gallery: gallery('[CLIENT NAME 06]'),
    results: [
      { value: '[X]K', label: '[KPI] new followers in 90 days' },
      { value: '[X]%', label: '[KPI] engagement rate' },
      { value: '[X]%', label: '[KPI] revenue from email' },
    ],
  },
];

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    quote: '[CLIENT QUOTE] They found the one idea our brand was missing, and then held every decision to it.',
    name: '[CLIENT NAME]',
    title: 'Founder',
    company: '[COMPANY]',
  },
  {
    id: 't2',
    quote: '[CLIENT QUOTE] The work looks expensive. The thinking behind it is what actually moved the numbers.',
    name: '[CLIENT NAME]',
    title: 'Head of Marketing',
    company: '[COMPANY]',
  },
  {
    id: 't3',
    quote: '[CLIENT QUOTE] Calm, exacting, and honest about what would not work. Rare in an agency.',
    name: '[CLIENT NAME]',
    title: 'Co-founder & CEO',
    company: '[COMPANY]',
  },
  {
    id: 't4',
    quote: '[CLIENT QUOTE] Our packaging finally says what the product does before anyone reads a word.',
    name: '[CLIENT NAME]',
    title: 'Brand Manager',
    company: '[COMPANY]',
  },
  {
    id: 't5',
    quote: '[CLIENT QUOTE] Strategy we could use on Monday, and a brand we are proud to put our name to.',
    name: '[CLIENT NAME]',
    title: 'Founder',
    company: '[COMPANY]',
  },
];

export const clients: Client[] = Array.from({ length: 10 }, (_, i) => ({
  id: `c${i + 1}`,
  name: `[CLIENT ${String(i + 1).padStart(2, '0')}]`,
}));

/** Shown under the logo marquee: "+ [X] more brands". */
export const moreBrandsCount = '[X]';

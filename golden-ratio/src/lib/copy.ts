/** Fixed section copy (PRD §5 and §9). Sparse, declarative, no exclamation marks. */

export const hero = {
  headline: 'Where Strategy Meets Artistry.',
  subline: ['Brand Strategy', 'Creative Direction', 'Marketing'],
  cta: 'See the Work',
};

export const services = [
  {
    id: 'strategy',
    name: 'Brand Strategy',
    icon: 'compass' as const,
    description:
      'We find the balance point where your brand’s truth meets market opportunity. Positioning, naming, architecture, and go-to-market strategy.',
    items: ['Brand Positioning', 'Brand Architecture', 'Naming & Verbal Identity', 'Go-to-Market Strategy', 'Competitor Analysis'],
  },
  {
    id: 'creative',
    name: 'Creative Direction',
    icon: 'spiral' as const,
    description:
      'Every visual decision traced back to a single idea. Identity systems, packaging, digital, and environments.',
    items: ['Visual Identity', 'Packaging Design', 'Art Direction', 'UI/UX Design', 'Environmental Design'],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: 'quill' as const,
    description:
      'Craft without distribution is decoration. We build the systems that put your brand in motion.',
    items: ['Content Strategy', 'Social Media', 'Performance Marketing', 'Email & CRM', 'Launch Campaigns'],
  },
];

export const studio = {
  label: 'The Studio',
  headline: 'We Don’t Make Ads.',
  body: [
    'We make brands that people choose twice. Art over advertising. Craft over templates.',
    'Every engagement starts with the truth of the business, not the trend of the quarter. We find the proportion that is yours, then hold every decision to it.',
    'A small studio by design. You work with the people doing the work.',
  ],
  bio:
    'George Alias founded Golden Ratio in Bengaluru to work where strategy and craft meet. [BIO — background, years in brand and marketing, notable work.] He believes the best brands are built on proportion: knowing what to say, and what to leave out.',
  quote: 'Every brand has its golden ratio.',
};

export const process = [
  {
    id: 'discovery',
    name: 'Discovery',
    line: 'We listen before we create.',
    icon: 'ear' as const,
    description: 'Brand audit, market research and stakeholder interviews. We learn the business before we touch the brand.',
  },
  {
    id: 'strategy',
    name: 'Strategy',
    line: 'Finding your golden ratio.',
    icon: 'compass' as const,
    description: 'Positioning, messaging framework and the creative brief. One idea the whole brand can be measured against.',
  },
  {
    id: 'creation',
    name: 'Creation',
    line: 'Where the work takes shape.',
    icon: 'quill' as const,
    description: 'Visual identity, content and campaigns, all traced back to strategy. Nothing decorative survives review.',
  },
  {
    id: 'launch',
    name: 'Launch',
    line: 'Craft meets the world.',
    icon: 'spiral-out' as const,
    description: 'Go-to-market execution, channel rollout and performance optimisation. The brand leaves the studio ready.',
  },
  {
    id: 'growth',
    name: 'Growth',
    line: 'Iteration is the art.',
    icon: 'spiral-loop' as const,
    description: 'Performance analysis, optimisation and brand evolution. We stay close and keep refining the proportion.',
  },
];

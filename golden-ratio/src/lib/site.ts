/**
 * Site-wide configuration. Everything the studio may need to change without
 * touching components lives here. Values in [BRACKETS] are placeholders to
 * find-and-replace before launch.
 */
export const site = {
  name: 'Golden Ratio',
  legalName: 'Golden Ratio Marketing & Creativity',
  tagline: 'Every Brand Has Its Golden Ratio.',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thegoldnratio.com').replace(/\/$/, ''),
  title: 'Golden Ratio — Brand Strategy, Creative Direction & Marketing | Bangalore',
  description:
    'Golden Ratio is a premium brand strategy and creative agency in Bangalore. We build brands at the intersection of strategy and artistry.',
  email: 'george@thegoldnratio.com',
  phone: '+91 85901 93504',
  whatsapp: 'https://wa.me/918590193504',
  calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/goldnratio/discovery',
  founder: { name: 'George Alias', title: 'Founder & CEO' },
  address: {
    streetAddress: '[STREET ADDRESS]',
    addressLocality: 'Bengaluru',
    addressRegion: 'Karnataka',
    postalCode: '[PIN CODE]',
    addressCountry: 'IN',
  },
  areaServed: ['Bengaluru', 'India', 'Worldwide'],
  /**
   * Social profiles. Leave a URL empty until the profile exists — the footer
   * still shows the icon (marked "coming soon") and structured data skips it.
   */
  socials: [
    { name: 'Instagram', url: '' },
    { name: 'LinkedIn', url: '' },
    { name: 'X', url: '' },
    { name: 'Behance', url: '' },
  ] as { name: 'Instagram' | 'LinkedIn' | 'X' | 'Behance'; url: string }[],
} as const;

export const navLinks = [
  { label: 'Work', href: '/#work' },
  { label: 'Services', href: '/#services' },
  { label: 'About', href: '/#studio' },
  { label: 'Contact', href: '/#contact' },
] as const;

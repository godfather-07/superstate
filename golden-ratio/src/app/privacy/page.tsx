import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Golden Ratio collects, uses and protects personal data.',
  alternates: { canonical: '/privacy' },
};

// [LEGAL REVIEW] Template text. Have it reviewed by counsel before launch.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="[DATE]">
      <p>
        This policy explains how {site.legalName} (“Golden Ratio”, “we”) handles personal data collected through {site.url.replace('https://', '')}.
        It is written to meet India’s Digital Personal Data Protection Act, 2023.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Details you send through the brief form: your name, email, brand or company, the services you need, your budget range and your project notes.</li>
        <li>Details you give Calendly when you book a call. Calendly processes these under its own privacy policy.</li>
        <li>Messages you send us on WhatsApp or by email.</li>
        <li>Usage data from Google Analytics, Vercel Analytics and Microsoft Clarity: pages visited, scroll depth, approximate location, device and browser. Clarity may record anonymised session replays.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To reply to your enquiry and, if we work together, to deliver the engagement.</li>
        <li>To understand how the site is used and improve it.</li>
        <li>To meet legal and accounting obligations.</li>
      </ul>
      <p>We do not sell personal data, and we do not use your brief for anything other than responding to it.</p>

      <h2>Who we share it with</h2>
      <p>
        Only the service providers that run this site and our communication: Vercel (hosting), Resend (email delivery), Calendly (scheduling), Google
        (analytics), Microsoft (Clarity) and Meta (WhatsApp). Each processes data under its own terms. Some of these providers store data outside India.
      </p>

      <h2>How long we keep it</h2>
      <p>Enquiries are kept for up to [24] months unless we go on to work together, in which case they form part of the client record.</p>

      <h2>Your rights</h2>
      <p>
        You can ask to access, correct or erase your personal data, or withdraw consent, by writing to <a href={`mailto:${site.email}`}>{site.email}</a>. We
        respond within 30 days. You may also raise a grievance with the Data Protection Board of India.
      </p>

      <h2>Cookies</h2>
      <p>
        Analytics tools set cookies to distinguish visits. You can block them in your browser settings; the site will still work. The ambient sound
        preference is not stored.
      </p>

      <h2>Contact</h2>
      <p>
        Grievance officer: [NAME], {site.legalName}, {site.address.addressLocality}, {site.address.addressRegion}. Email:{' '}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}

import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms for using the Golden Ratio website.',
  alternates: { canonical: '/terms' },
};

// [LEGAL REVIEW] Template text. Have it reviewed by counsel before launch.
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="[DATE]">
      <p>
        These terms govern your use of {site.url.replace('https://', '')}, operated by {site.legalName}. By using the site you accept them. Client
        engagements are governed by a separate written agreement.
      </p>

      <h2>The work shown here</h2>
      <p>
        All work, text, design and imagery on this site belong to Golden Ratio or to the clients who commissioned it, and are shown with permission.
        You may not copy, reproduce or reuse them without written consent.
      </p>

      <h2>Enquiries and briefs</h2>
      <p>
        Sending a brief or booking a call does not create a contract or oblige either side to work together. Anything you share is treated as
        confidential and used only to respond to you.
      </p>

      <h2>Use of the site</h2>
      <ul>
        <li>Do not attempt to disrupt the site, probe it for vulnerabilities or submit automated requests.</li>
        <li>Do not use the contact form to send unsolicited marketing.</li>
      </ul>

      <h2>No warranty</h2>
      <p>
        The site is provided as is. Case-study results describe past engagements and are not a promise of future outcomes. To the extent the law
        allows, we are not liable for losses arising from use of the site.
      </p>

      <h2>Third-party services</h2>
      <p>Calendly, WhatsApp and the social platforms we link to have their own terms, which apply when you use them.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India. Courts in Bengaluru, Karnataka have exclusive jurisdiction.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}

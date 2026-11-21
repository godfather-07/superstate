import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Analytics } from '@/components/layout/Analytics';
import { ScrollProgress, WhatsAppButton } from '@/components/layout/Chrome';
import { CustomCursor } from '@/components/layout/CustomCursor';
import { Footer } from '@/components/layout/Footer';
import { INTRO_STORAGE_KEY } from '@/lib/intro';
import { Navbar } from '@/components/layout/Navbar';
import { TransitionContent } from '@/components/layout/PageTransition';
import { Providers } from '@/components/layout/Providers';
import { site } from '@/lib/site';
import '@/styles/globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.founder.name }],
  creator: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

// Decides before first paint whether the intro plays: only on the home page,
// once per session, never for reduced-motion users.
const introScript = `(function(){var d=document.documentElement;try{var seen=sessionStorage.getItem('${INTRO_STORAGE_KEY}');var rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;d.dataset.intro=(seen||rm||location.pathname!=='/')?'seen':'pending';}catch(e){d.dataset.intro='seen';}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <noscript>
          <style>{`#intro-loader{display:none!important}`}</style>
        </noscript>
        <link rel="preconnect" href="https://assets.calendly.com" />
      </head>
      <body>
        <Providers>
          <a
            href="#main"
            className="type-label fixed left-phi-2 top-phi-2 z-[200] -translate-y-[200%] bg-gold px-phi-3 py-phi-2 text-ink focus:translate-y-0"
          >
            Skip to content
          </a>
          <Navbar />
          <TransitionContent>
            <main id="main">{children}</main>
            <Footer />
          </TransitionContent>
          <ScrollProgress />
          <WhatsAppButton />
          <CustomCursor />
        </Providers>
        <Analytics />
        <VercelAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

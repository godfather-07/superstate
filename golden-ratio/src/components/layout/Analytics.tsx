'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { track } from '@/lib/utils';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const gaEnabled = Boolean(GA_ID && GA_ID !== 'G-XXXXXXXXXX');

/**
 * GA4 + Microsoft Clarity (PRD §12), loaded after the page is interactive.
 * Tracks: page views (including client-side route changes), scroll depth at
 * 25/50/75/90/100%, clicks on anything marked data-track="…", and form
 * submissions (sent from the contact form itself).
 */
export function Analytics() {
  const pathname = usePathname();
  const firstView = useRef(true);

  // The first page view is sent by the GA snippet itself; this covers client-side navigations.
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    if (!gaEnabled) return;
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.('event', 'page_view', { page_path: pathname, page_location: window.location.href, page_title: document.title });
  }, [pathname]);

  useEffect(() => {
    const marks = [25, 50, 75, 90, 100];
    const seen = new Set<number>();
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = (window.scrollY / max) * 100;
      marks.forEach((m) => {
        if (pct >= m - 0.5 && !seen.has(m)) {
          seen.add(m);
          track('scroll_depth', { percent: m, page_path: pathname });
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest('[data-track]');
      if (el) track('cta_click', { cta: el.getAttribute('data-track'), page_path: window.location.pathname });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <>
      {gaEnabled && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});gtag('event','page_view',{page_path:location.pathname,page_location:location.href,page_title:document.title});`}
          </Script>
        </>
      )}
      {CLARITY_ID && (
        <Script id="clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}
    </>
  );
}

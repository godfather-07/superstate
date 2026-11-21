/** Join class names, dropping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/** Zero-padded index, e.g. 1 → "01". */
export function pad(n: number, size = 2) {
  return String(n).padStart(size, '0');
}

export const PHI = (1 + Math.sqrt(5)) / 2;

/** Send an event to GA4 (no-op when GA is not configured or blocked). */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', event, params);
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

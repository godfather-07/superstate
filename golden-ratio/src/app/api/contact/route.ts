import { NextResponse } from 'next/server';
import { briefSchema, type BriefInput } from '@/lib/contact-schema';
import { site } from '@/lib/site';
import { escapeHtml } from '@/lib/utils';

/**
 * POST /api/contact (PRD §12). Validates the brief with the same Zod schema
 * as the form, silently drops honeypot submissions, applies a light per-IP
 * rate limit, then sends two emails through Resend: the brief to the studio
 * (reply-to the sender) and a confirmation to the sender.
 */

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // best-effort memory bound per instance
  return recent.length > MAX_PER_WINDOW;
}

async function sendEmail(payload: Record<string, unknown>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function studioEmail(b: BriefInput) {
  const rows: [string, string][] = [
    ['Name', b.name],
    ['Email', b.email],
    ['Brand / Company', b.company],
    ['Needs', b.need],
    ['Budget', b.budget],
  ];
  const html = `
  <div style="background:#0a0a0a;padding:34px;font-family:Inter,Arial,sans-serif;color:#fafafa">
    <p style="color:#c8a95e;letter-spacing:.28em;font-size:11px;text-transform:uppercase;margin:0 0 21px">New brief — thegoldnratio.com</p>
    <table style="border-collapse:collapse;width:100%;max-width:560px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 13px 8px 0;color:#888;font-size:13px;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:8px 0;font-size:15px;border-bottom:1px solid rgba(200,169,94,.3)">${escapeHtml(v)}</td></tr>`,
        )
        .join('')}
    </table>
    <p style="color:#888;font-size:13px;margin:21px 0 8px">Project</p>
    <p style="font-size:15px;line-height:1.7;white-space:pre-wrap;margin:0;max-width:560px">${b.message ? escapeHtml(b.message) : '<em style="color:#888">Not provided</em>'}</p>
  </div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nProject:\n${b.message || 'Not provided'}`;
  return { html, text };
}

function confirmationEmail(b: BriefInput) {
  const first = escapeHtml(b.name.split(' ')[0]);
  const html = `
  <div style="background:#0a0a0a;padding:55px 34px;font-family:Georgia,'Times New Roman',serif;color:#fafafa;text-align:center">
    <p style="font-family:Inter,Arial,sans-serif;color:#c8a95e;letter-spacing:.3em;font-size:11px;text-transform:uppercase;margin:0 0 34px">Golden Ratio</p>
    <p style="font-size:34px;color:#c8a95e;margin:0 0 21px">We’ll be in touch.</p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.7;color:#e0e0e0;max-width:440px;margin:0 auto">
      Thank you, ${first}. Your brief for ${escapeHtml(b.company)} has reached the studio. George will reply within two working days.
    </p>
    <p style="font-style:italic;color:#888;font-size:16px;margin:34px 0 0">${escapeHtml(site.tagline)}</p>
  </div>`;
  const text = `Thank you, ${b.name.split(' ')[0]}. Your brief for ${b.company} has reached the studio. George will reply within two working days.\n\n${site.tagline}\nGolden Ratio — ${site.url}`;
  return { html, text };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: pretend success so bots learn nothing.
  if (body && typeof body === 'object' && 'website' in body && (body as { website?: string }).website) {
    return NextResponse.json({ ok: true });
  }

  const parsed = briefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the form and try again.', issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many submissions. Please try again in a few minutes.' }, { status: 429 });
  }

  const brief = parsed.data;
  const to = process.env.CONTACT_EMAIL || site.email;
  const from = process.env.RESEND_FROM || 'Golden Ratio <studio@thegoldnratio.com>';

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_key') {
    if (process.env.NODE_ENV === 'production') {
      console.error('[contact] RESEND_API_KEY is not set — brief not delivered:', { company: brief.company, need: brief.need });
      return NextResponse.json({ error: 'The form is not configured yet.' }, { status: 503 });
    }
    console.info('[contact] (dev, no RESEND_API_KEY) brief received:', brief);
    return NextResponse.json({ ok: true, delivered: false });
  }

  try {
    const studio = studioEmail(brief);
    await sendEmail({
      from,
      to: [to],
      reply_to: brief.email,
      subject: `New brief — ${brief.company} (${brief.need}, ${brief.budget})`,
      ...studio,
    });
    // The confirmation is a courtesy; its failure shouldn't fail the request.
    const confirm = confirmationEmail(brief);
    await sendEmail({ from, to: [brief.email], subject: 'We’ll be in touch — Golden Ratio', ...confirm }).catch((err) =>
      console.error('[contact] confirmation email failed:', err),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] send failed:', err);
    return NextResponse.json({ error: 'We could not send your brief just now.' }, { status: 502 });
  }
}

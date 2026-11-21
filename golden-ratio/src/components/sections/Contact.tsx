'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Chevron } from '@/components/ui/Icons';
import { RevealWords, Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GoldenSpiral } from '@/components/ui/GoldenSpiral';
import { EASE_EXPO } from '@/lib/animations';
import { BUDGETS, NEEDS, briefSchema, type BriefInput } from '@/lib/contact-schema';
import { site } from '@/lib/site';
import { cn, track } from '@/lib/utils';

/** Contact (PRD §5.8): Calendly on the left, the brief form on the right. */
export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative bg-ink-2 section-pad">
      <div className="container-site">
        <SectionHeading index="07" label="Contact" title="Begin with a conversation." id="contact-title" className="mb-phi-6" />

        <div className="grid gap-phi-6 lg:grid-cols-2 lg:gap-phi-5">
          <div className="flex flex-col gap-phi-3">
            <RevealWords text="Book a Call" as="h3" className="type-h3 text-gold" />
            <p className="text-paper-2">Thirty minutes. Bring the brief, or just the problem.</p>
            <CalendlyEmbed />
          </div>

          <div className="flex flex-col gap-phi-3">
            <RevealWords text="Send a Brief" as="h3" className="type-h3 text-gold" />
            <p className="text-paper-2">Tell us where the brand is, and where it needs to be. We reply within two working days.</p>
            <BriefForm />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Calendly                                                           */
/* ------------------------------------------------------------------ */

const CALENDLY_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';

function calendlyUrl() {
  const url = new URL(site.calendlyUrl);
  url.searchParams.set('hide_gdpr_banner', '1');
  url.searchParams.set('hide_landing_page_details', '1');
  url.searchParams.set('background_color', '111111');
  url.searchParams.set('text_color', 'fafafa');
  url.searchParams.set('primary_color', 'c8a95e');
  return url.toString();
}

/**
 * Inline Calendly embed in the site's colours. The widget script is only
 * fetched when the section comes near the viewport, keeping it off the
 * initial page weight.
 */
function CalendlyEmbed() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: '800px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const w = window as unknown as { Calendly?: { initInlineWidget: (o: { url: string; parentElement: HTMLElement }) => void } };
    const init = () => {
      if (!ref.current || !w.Calendly) return;
      ref.current.innerHTML = '';
      w.Calendly.initInlineWidget({ url: calendlyUrl(), parentElement: ref.current });
      setLoaded(true);
    };
    if (w.Calendly) return init();
    let script = document.querySelector<HTMLScriptElement>(`script[src="${CALENDLY_SCRIPT}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = CALENDLY_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', init);
    script.addEventListener('error', () => setFailed(true));
    return () => script?.removeEventListener('load', init);
  }, [near]);

  // Calendly posts booking events to the parent window.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://calendly.com' || typeof e.data?.event !== 'string') return;
      if (e.data.event === 'calendly.event_scheduled') track('book_call', { method: 'calendly' });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="relative min-h-[700px] overflow-hidden border border-line/60 bg-ink-2" data-cursor="hide">
      <div ref={ref} className="calendly-inline-widget h-[700px] w-full" />
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-phi-4 p-phi-4 text-center">
          <motion.div
            className="w-[120px] text-gold/60"
            animate={failed ? undefined : { rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          >
            <GoldenSpiral strokeWidth={1} />
          </motion.div>
          <p className="type-label text-muted">{failed ? 'The calendar could not load' : 'Loading calendar'}</p>
          <a href={site.calendlyUrl} target="_blank" rel="noopener noreferrer" className="link-draw text-[14px]" data-track="calendly_fallback">
            Open the booking page →
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Brief form                                                         */
/* ------------------------------------------------------------------ */

type Status = 'idle' | 'sending' | 'sent' | 'error';

function BriefForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BriefInput>({
    resolver: zodResolver(briefSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', company: '', message: '', website: '' },
  });

  const onSubmit = async (data: BriefInput) => {
    setStatus('sending');
    setServerError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Something went wrong.');
      track('generate_lead', { form: 'brief', need: data.need, budget: data.budget });
      setStatus('sent');
      reset();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {status === 'sent' ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 21 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE_EXPO }}
            className="flex min-h-[520px] flex-col items-start justify-center gap-phi-3 border border-line/60 p-phi-5"
            role="status"
          >
            <div className="w-[89px] text-gold">
              <GoldenSpiral />
            </div>
            <p className="type-h2 text-gold">We’ll be in touch.</p>
            <p className="max-w-[40ch] text-paper-2">Your brief is with George. Expect a reply within two working days.</p>
            <button type="button" className="link-draw mt-phi-2 text-[14px]" onClick={() => setStatus('idle')}>
              Send another brief
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={false}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-phi-4"
            aria-describedby={serverError ? 'form-error' : undefined}
          >
            <Reveal className="grid gap-phi-4 sm:grid-cols-2">
              <Field label="Your Name" error={errors.name?.message} registration={register('name')} autoComplete="name" required />
              <Field label="Email" type="email" error={errors.email?.message} registration={register('email')} autoComplete="email" required />
            </Reveal>
            <Reveal delay={0.05}>
              <Field label="Brand / Company" error={errors.company?.message} registration={register('company')} autoComplete="organization" required />
            </Reveal>
            <Reveal delay={0.1} className="grid gap-phi-4 sm:grid-cols-2">
              <SelectField label="What do you need?" options={NEEDS} error={errors.need?.message} registration={register('need')} required />
              <SelectField label="Budget Range" options={BUDGETS} error={errors.budget?.message} registration={register('budget')} required />
            </Reveal>
            <Reveal delay={0.15}>
              <Field label="Tell us about your project" multiline error={errors.message?.message} registration={register('message')} />
            </Reveal>

            {/* Honeypot — hidden from people and screen readers; bots fill it. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Website
                <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
              </label>
            </div>

            {status === 'error' && (
              <p id="form-error" role="alert" className="border-l-2 border-gold pl-phi-2 text-[14px] text-paper-2">
                {serverError} You can also write to{' '}
                <a className="text-gold underline" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
                .
              </p>
            )}

            <Reveal delay={0.2} className="flex flex-col gap-phi-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" variant="solid" disabled={status === 'sending'} data-cursor="Send">
                {status === 'sending' ? 'Sending…' : 'Send Brief'}
              </Button>
              <p className="text-[12px] text-muted">
                Fields marked <span className="text-gold">*</span> are required.
              </p>
            </Reveal>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Floating-label inputs: gold bottom border on focus, label floats up (PRD §7.5) */

const inputBase =
  'peer block w-full appearance-none rounded-none border-0 border-b border-paper/25 bg-transparent px-0 pb-[10px] pt-[26px] text-[16px] text-paper outline-none transition-colors duration-300 focus:border-gold';

const labelBase =
  'pointer-events-none absolute left-0 top-[26px] origin-left text-[15px] text-muted transition-all duration-300 ease-expo ' +
  'peer-focus:top-0 peer-focus:text-[11px] peer-focus:tracking-[0.2em] peer-focus:uppercase peer-focus:text-gold ' +
  'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:tracking-[0.2em] peer-[:not(:placeholder-shown)]:uppercase';

function Field({
  label,
  registration,
  error,
  type = 'text',
  multiline = false,
  required = false,
  autoComplete,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: string;
  multiline?: boolean;
  required?: boolean;
  autoComplete?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const shared = {
    id,
    placeholder: ' ',
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': error ? errorId : undefined,
    'aria-required': required || undefined,
    className: cn(inputBase, multiline && 'min-h-[144px] resize-y', error && 'border-gold-dark'),
    ...registration,
  };
  return (
    <div className="relative">
      {multiline ? <textarea rows={5} {...shared} /> : <input type={type} autoComplete={autoComplete} {...shared} />}
      <label htmlFor={id} className={labelBase}>
        {label}
        {required && <span className="ml-1 text-gold">*</span>}
      </label>
      {error && (
        <p id={errorId} className="mt-phi-1 text-[12px] text-gold-light">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  options,
  registration,
  error,
  required = false,
}: {
  label: string;
  options: readonly string[];
  registration: UseFormRegisterReturn;
  error?: string;
  required?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <div className="relative">
        <select
          id={id}
          defaultValue=""
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          aria-required={required || undefined}
          className={cn(inputBase, 'pr-phi-4 invalid:text-muted [&>option]:bg-ink-2 [&>option]:text-paper', error && 'border-gold-dark')}
          required={required}
          {...registration}
        >
          <option value="" disabled>
            Select
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <label htmlFor={id} className="pointer-events-none absolute left-0 top-0 text-[11px] uppercase tracking-[0.2em] text-muted peer-focus:text-gold">
          {label}
          {required && <span className="ml-1 text-gold">*</span>}
        </label>
        <Chevron className="pointer-events-none absolute bottom-[14px] right-0 h-4 w-4 text-gold" />
      </div>
      {error && (
        <p id={errorId} className="mt-phi-1 text-[12px] text-gold-light">
          {error}
        </p>
      )}
    </div>
  );
}

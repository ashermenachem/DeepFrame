'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Ban,
  GitBranch,
  LockKeyhole,
  RotateCcw,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { LegalTerms } from '@/components/legal-terms';
import {
  prohibitedUses,
  termsEffectiveDate,
  termsVersion,
} from '@/lib/legal';

type TermsGateProps = {
  declined: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onReview: () => void;
};

export function TermsGate({
  declined,
  onAccept,
  onDecline,
  onReview,
}: TermsGateProps) {
  const reduceMotion = useReducedMotion();
  const primaryActionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() =>
      primaryActionRef.current?.focus({ preventScroll: true }),
    );

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [declined]);

  if (declined) {
    return (
      <main className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-[#03040a] px-5 py-10">
        <div className="hero-grid absolute inset-0 scale-125 opacity-30" />
        <div className="absolute left-1/2 top-1/2 size-[min(90vw,46rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400/[0.07] blur-[110px]" />
        <motion.section
          aria-labelledby="access-disabled-title"
          className="glass-panel relative z-10 w-full max-w-xl rounded-[2rem] p-7 text-center sm:p-10"
          initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-red-200/15 bg-red-300/[0.07]">
            <Ban className="size-6 text-red-100/75" strokeWidth={1.5} />
          </div>
          <p className="mt-6 font-mono text-[8px] uppercase tracking-[0.22em] text-red-100/45">
            Terms declined
          </p>
          <h1
            id="access-disabled-title"
            className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl"
          >
            The inspector is locked.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/44">
            DeepFrame will not open or analyze a photo unless you accept the
            responsible-use terms. Nothing has been uploaded or inspected.
          </p>
          <Button
            ref={primaryActionRef}
            onClick={onReview}
            className="mt-7 h-11 rounded-full bg-white px-5 text-[12px] font-semibold text-[#070810] hover:bg-cyan-50"
          >
            <RotateCcw className="size-4" /> Review terms
          </Button>
          <div className="mt-7 flex flex-wrap justify-center gap-4 text-[10px] text-white/28">
            <Link className="transition hover:text-white/65" href="/terms">
              Read full terms
            </Link>
            <a
              className="transition hover:text-white/65"
              href="https://github.com/ashermenachem/DeepFrame"
              target="_blank"
              rel="noreferrer"
            >
              GitHub repository
            </a>
          </div>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-[#03040a] px-3 py-3 sm:px-6 sm:py-6">
      <div className="hero-grid absolute inset-0 scale-125 opacity-35" />
      <motion.div
        aria-hidden="true"
        className="absolute left-[18%] top-[12%] size-[min(60vw,34rem)] rounded-full bg-cyan-300/[0.08] blur-[100px]"
        animate={reduceMotion ? undefined : { scale: [0.9, 1.08, 0.9] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-[8%] right-[12%] size-[min(55vw,32rem)] rounded-full bg-violet-400/[0.09] blur-[100px]"
        animate={reduceMotion ? undefined : { scale: [1.05, 0.88, 1.05] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.dialog
        open
        aria-modal="true"
        aria-labelledby="terms-title"
        aria-describedby="terms-summary"
        className="glass-panel relative z-10 m-0 grid max-h-[calc(100svh-1.5rem)] w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[1.75rem] border-0 bg-[#080a12]/95 text-left text-white shadow-[0_36px_140px_rgba(0,0,0,.64)] sm:max-h-[calc(100svh-3rem)] sm:rounded-[2.25rem]"
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.975 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="border-b border-white/[0.075] px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/12 bg-cyan-100/[0.045] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-100/65">
                <ShieldAlert className="size-3" /> Responsible use checkpoint
              </div>
              <h1
                id="terms-title"
                className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl"
              >
                Look deeper. Act responsibly.
              </h1>
              <p
                id="terms-summary"
                className="mt-3 max-w-2xl text-xs leading-6 text-white/43 sm:text-sm"
              >
                Photo metadata can expose someone’s exact location, device, and
                identity. DeepFrame is for lawful, ethical inspection—not
                stalking, harassment, doxxing, or covert surveillance.
              </p>
            </div>
            <div className="hidden size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] sm:grid">
              <Scale className="size-5 text-violet-100/70" strokeWidth={1.5} />
            </div>
          </div>
        </header>

        <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-7">
          <section aria-labelledby="never-use-title">
            <h2
              id="never-use-title"
              className="font-mono text-[8px] uppercase tracking-[0.2em] text-red-100/55"
            >
              Never use DeepFrame to
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {prohibitedUses.map((rule) => (
                <div
                  key={rule}
                  className="flex gap-3 rounded-2xl border border-red-100/[0.09] bg-red-200/[0.035] px-4 py-3 text-[11px] leading-5 text-white/52"
                >
                  <Ban className="mt-0.5 size-3.5 shrink-0 text-red-200/58" />
                  {rule}
                </div>
              ))}
            </div>
          </section>

          <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section aria-labelledby="full-terms-title">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="full-terms-title"
                  className="text-base font-semibold tracking-[-0.025em] text-white/90"
                >
                  DeepFrame Terms of Service
                </h2>
                <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.15em] text-white/25">
                  Version {termsVersion} · Effective {termsEffectiveDate}
                </p>
              </div>
              <Link
                href="/terms"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-[10px] text-cyan-100/55 transition hover:text-cyan-50"
              >
                Open full page <ArrowRight className="size-3" />
              </Link>
            </div>
            <LegalTerms compact />
          </section>

          <div className="mt-7 rounded-2xl border border-emerald-100/10 bg-emerald-200/[0.04] p-4">
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-emerald-200/70" />
              <p className="text-[11px] leading-5 text-white/48">
                By choosing <strong className="font-semibold text-white/82">Accept & continue</strong>,
                you confirm that you are authorized to inspect your files and
                agree not to use DeepFrame or its results to harm, track, expose,
                or invade the privacy of another person.
              </p>
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/[0.075] bg-black/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onDecline}
              className="text-[11px] text-white/35 transition hover:text-white/75"
            >
              Decline
            </button>
            <a
              href="https://github.com/ashermenachem/DeepFrame"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-white/28 transition hover:text-white/65"
            >
              <GitBranch className="size-3.5" /> View source
            </a>
          </div>
          <Button
            ref={primaryActionRef}
            onClick={onAccept}
            className="h-11 rounded-full bg-white px-5 text-[12px] font-semibold text-[#070810] hover:bg-cyan-50"
          >
            Accept & continue <ArrowRight className="size-4" />
          </Button>
        </footer>
      </motion.dialog>
    </main>
  );
}

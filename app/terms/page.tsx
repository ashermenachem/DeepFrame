import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, GitBranch, Scale, ShieldCheck } from 'lucide-react';
import { LegalTerms } from '@/components/legal-terms';
import { DeepFrameLogo } from '@/components/deepframe-logo';
import { termsEffectiveDate, termsVersion } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Service · DeepFrame',
  description:
    'Responsible-use terms for the DeepFrame photo metadata inspector.',
};

export default function TermsPage() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden px-4 py-6 sm:px-6 sm:py-12">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[min(90vw,58rem)] -translate-x-1/2 rounded-full bg-cyan-300/[0.08] blur-[100px]" />
      <article className="glass-panel relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]">
        <header className="border-b border-white/[0.075] px-6 py-7 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[11px] text-white/40 transition hover:text-white"
            >
              <ArrowLeft className="size-3.5" /> Back to DeepFrame
            </Link>
            <a
              href="https://github.com/ashermenachem/DeepFrame"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[11px] text-white/40 transition hover:text-white"
            >
              <GitBranch className="size-3.5" /> GitHub
            </a>
          </div>
          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-violet-100/12 bg-violet-100/[0.045] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-violet-100/65">
            <Scale className="size-3" /> Terms of Service
          </div>
          <div className="mt-8">
            <DeepFrameLogo
              markClassName="size-11"
              wordmarkClassName="text-xl sm:text-2xl"
            />
          </div>
          <h1 className="gradient-text mt-5 text-4xl font-semibold tracking-[-0.06em] sm:text-7xl">
            Use insight responsibly.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45">
            DeepFrame can reveal sensitive details hidden in a photo. These
            terms protect the people behind that data and define the line
            between legitimate inspection and harmful surveillance.
          </p>
          <div className="mt-6 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.15em] text-white/25">
            <ShieldCheck className="size-3.5 text-emerald-200/65" /> Version{' '}
            {termsVersion} · Effective {termsEffectiveDate}
          </div>
        </header>

        <div className="px-6 py-8 sm:px-10 sm:py-12">
          <section className="mb-10 rounded-2xl border border-red-100/10 bg-red-200/[0.035] p-5">
            <h2 className="text-sm font-semibold text-white/88">
              Stalking, doxxing, covert tracking, harassment, and unauthorized
              surveillance are prohibited.
            </h2>
            <p className="mt-2 text-xs leading-6 text-white/44">
              If metadata could affect another person’s safety or privacy, do
              not save, share, publish, or act on it without appropriate consent
              and lawful authority.
            </p>
          </section>
          <LegalTerms />

          <section className="mt-10 border-t border-white/[0.075] pt-8">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
              Questions, permissions, or concerns
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/52">
              Contact Asher Menachem through the public methods on the GitHub
              profile. If someone is in immediate danger, contact the
              appropriate local emergency service; DeepFrame is not an
              emergency-reporting system.
            </p>
            <a
              href="https://github.com/ashermenachem"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[11px] text-white/60 transition hover:border-cyan-100/20 hover:bg-cyan-100/[0.06] hover:text-white"
            >
              <GitBranch className="size-4" /> Contact on GitHub
            </a>
          </section>
        </div>
      </article>
    </main>
  );
}

import Link from 'next/link';
import { ArrowLeft, Database, ShieldCheck } from 'lucide-react';
import { DeepFrameLogo } from '@/components/deepframe-logo';
import { PrivacyPolicy } from '@/components/privacy-policy';
import { privacyEffectiveDate, privacyVersion } from '@/lib/legal';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#03040a] px-4 py-10 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <DeepFrameLogo />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="size-4" /> Back to DeepFrame
          </Link>
        </div>
        <header className="mt-16 border-b border-white/[0.08] pb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100/12 bg-emerald-100/[0.045] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-emerald-100/65">
            <ShieldCheck className="size-3" /> Clear data practices
          </div>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">
            Privacy, explained.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/45">
            What DeepFrame saves, why it is needed, how long it stays, who can
            access it, and what controls you have.
          </p>
          <p className="mt-5 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.16em] text-white/25">
            <Database className="size-3" /> Version {privacyVersion} · Effective{' '}
            {privacyEffectiveDate}
          </p>
        </header>
        <article className="glass-panel my-10 rounded-[2rem] p-6 sm:p-10">
          <PrivacyPolicy />
        </article>
      </div>
    </main>
  );
}

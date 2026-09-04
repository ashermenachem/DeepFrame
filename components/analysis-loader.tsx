'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Binary,
  Fingerprint,
  Layers3,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { DeepFrameMark } from '@/components/deepframe-logo';

type AnalysisLoaderProps = {
  fileName?: string;
};

type AnalysisPass = {
  label: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
};

const analysisPasses: AnalysisPass[] = [
  {
    label: 'Reading bytes',
    detail: 'File signatures and embedded blocks',
    icon: Binary,
    accent: 'from-cyan-300 to-sky-500',
  },
  {
    label: 'Decoding metadata',
    detail: 'EXIF, IPTC, XMP, and maker notes',
    icon: ScanLine,
    accent: 'from-sky-300 to-indigo-500',
  },
  {
    label: 'Mapping structure',
    detail: 'Containers, segments, and image streams',
    icon: Layers3,
    accent: 'from-indigo-300 to-violet-500',
  },
  {
    label: 'Generating fingerprint',
    detail: 'Local integrity and identity signals',
    icon: Fingerprint,
    accent: 'from-violet-300 to-fuchsia-500',
  },
];

export function AnalysisLoader({ fileName }: AnalysisLoaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const displayName = fileName?.trim() || 'Selected image';

  return (
    <section
      aria-label={`Analyzing ${displayName} locally`}
      className="relative isolate w-full overflow-hidden rounded-[2rem] border border-white/[0.1] bg-[#070910]/95 px-5 py-7 text-left shadow-[0_32px_100px_-42px_rgba(65,120,255,0.75)] sm:px-8 sm:py-9"
    >
      <output className="sr-only" aria-live="polite">
        Analyzing {displayName} locally. Reading bytes, decoding metadata,
        mapping image structure, and generating a fingerprint.
      </output>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(64,214,255,0.17),transparent_30%),radial-gradient(circle_at_82%_78%,rgba(137,92,246,0.18),transparent_34%)]"
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-1/3 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl"
        animate={
          shouldReduceMotion ? undefined : { x: [0, 48, 0], y: [0, -18, 0] }
        }
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-3 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl"
        animate={
          shouldReduceMotion ? undefined : { x: [0, -34, 0], y: [0, 26, 0] }
        }
        transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative z-10"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/[0.06] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
              <span className="relative flex h-1.5 w-1.5">
                {!shouldReduceMotion && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-cyan-300"
                    animate={{ opacity: [0.7, 0], scale: [1, 2.4] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                  />
                )}
                <span className="relative h-1.5 w-1.5 rounded-full bg-cyan-200" />
              </span>
              Local analysis active
            </div>
            <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
              Reading your photo.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
              DeepFrame is finding and organizing every detail for you.
            </p>
          </div>

          <div
            className="max-w-full truncate rounded-full border border-white/[0.09] bg-white/[0.045] px-3.5 py-2 font-mono text-[11px] text-white/55 sm:max-w-[15rem]"
            title={displayName}
          >
            {displayName}
          </div>
        </div>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(14rem,0.78fr)_minmax(17rem,1.22fr)] lg:gap-12">
          <div className="relative mx-auto aspect-square w-full max-w-[17rem] sm:max-w-[19rem]">
            <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(70,180,255,0.16),rgba(75,75,180,0.05)_50%,transparent_72%)] blur-xl" />

            <motion.div
              aria-hidden="true"
              className="absolute inset-[2%] rounded-full border border-dashed border-cyan-200/15"
              animate={shouldReduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute inset-[12%] rounded-full border border-indigo-200/15"
              animate={shouldReduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-indigo-200 shadow-[0_0_18px_rgba(165,180,252,0.95)]" />
            </motion.div>
            <motion.div
              aria-hidden="true"
              className="absolute inset-[21%] rounded-full border border-cyan-100/20"
              animate={
                shouldReduceMotion
                  ? undefined
                  : { scale: [1, 1.035, 1], opacity: [0.55, 1, 0.55] }
              }
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.div
              className="absolute inset-[27%] overflow-hidden rounded-[1.55rem] border border-white/15 bg-gradient-to-br from-white/[0.13] to-white/[0.035] p-4 shadow-[0_24px_60px_-24px_rgba(63,167,255,0.9)] backdrop-blur-xl"
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      rotateX: [0, 3, 0, -2, 0],
                      rotateY: [0, -4, 0, 4, 0],
                      y: [0, -3, 0],
                    }
              }
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformPerspective: 700 }}
            >
              <div className="flex h-full flex-col justify-between">
                <DeepFrameMark className="h-8 w-8" />
                <div className="space-y-2">
                  <div className="h-px w-full bg-white/20" />
                  <div className="h-px w-4/5 bg-white/15" />
                  <div className="h-px w-3/5 bg-white/10" />
                </div>
              </div>

              <motion.div
                aria-hidden="true"
                className="absolute inset-x-2 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent shadow-[0_0_14px_rgba(103,232,249,0.9)]"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : { y: [-46, 46, -46], opacity: [0, 1, 0] }
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            <div className="absolute left-[3%] top-[48%] rounded-full border border-white/10 bg-[#0d111b]/85 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-100/65 shadow-lg backdrop-blur-md">
              EXIF
            </div>
            <div className="absolute right-[1%] top-[24%] rounded-full border border-white/10 bg-[#0d111b]/85 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-indigo-100/65 shadow-lg backdrop-blur-md">
              XMP
            </div>
            <div className="absolute bottom-[7%] right-[15%] rounded-full border border-white/10 bg-[#0d111b]/85 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-violet-100/65 shadow-lg backdrop-blur-md">
              HASH
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            {analysisPasses.map((pass, index) => {
              const Icon = pass.icon;

              return (
                <motion.div
                  key={pass.label}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.035] p-3.5"
                  initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: shouldReduceMotion ? 0 : index * 0.06,
                  }}
                >
                  <motion.div
                    aria-hidden="true"
                    className={`absolute inset-y-0 left-0 w-px bg-gradient-to-b ${pass.accent}`}
                    animate={
                      shouldReduceMotion
                        ? { opacity: 0.5 }
                        : { opacity: [0.2, 0.95, 0.2] }
                    }
                    transition={{
                      duration: 2.4,
                      delay: index * 0.55,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-white/75">
                      <Icon className="h-4 w-4" strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium tracking-[-0.015em] text-white/85">
                        {pass.label}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-white/35">
                        {pass.detail}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/[0.07] pt-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck
              className="h-4 w-4 text-emerald-300/80"
              strokeWidth={1.7}
            />
            Analyzed locally, then saved to your private vault.
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
            Private by design
          </span>
        </div>
      </motion.div>
    </section>
  );
}

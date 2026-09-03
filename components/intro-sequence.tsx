'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Aperture, ShieldCheck, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  stagger,
  useReducedMotion,
} from 'motion/react';

const introKey = 'deepframe-intro-seen-v2';

export const socials = [
  {
    label: 'Instagram',
    short: 'IG',
    handle: '@ashermenachem',
    href: 'https://www.instagram.com/ashermenachem',
  },
  {
    label: 'TikTok',
    short: 'TT',
    handle: '@ashermenachem',
    href: 'https://www.tiktok.com/@ashermenachem',
  },
  {
    label: 'GitHub',
    short: 'GH',
    handle: 'DeepFrame source',
    href: 'https://github.com/ashermenachem/DeepFrame',
  },
  {
    label: 'X',
    short: 'X',
    handle: '@ashermenachem',
    href: 'https://x.com/ashermenachem',
  },
  {
    label: 'Snapchat',
    short: 'SC',
    handle: '@asher.menachem',
    href: 'https://www.snapchat.com/@asher.menachem',
  },
];

export function SocialLinks({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {socials.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${social.label}: ${social.handle}`}
          className="group/social inline-flex items-center gap-2 rounded-full border border-white/[0.075] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[8px] text-white/38 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-100/20 hover:bg-cyan-100/[0.055] hover:text-white/75"
        >
          <span className="text-cyan-100/62 transition-colors group-hover/social:text-cyan-100">
            {social.short}
          </span>
          <span>{detailed ? social.handle : social.label}</span>
        </a>
      ))}
    </div>
  );
}

export function IntroSequence({ onComplete }: { onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const completedRef = useRef(false);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  const close = useCallback(() => {
    setVisible(false);
    window.sessionStorage.setItem(introKey, 'true');
    complete();
  }, [complete]);

  useEffect(() => {
    if (window.sessionStorage.getItem(introKey)) {
      complete();
      return;
    }

    const frame = window.requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(close, reduceMotion ? 1200 : 5000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [close, complete, reduceMotion]);

  useEffect(() => {
    if (!visible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() =>
      skipRef.current?.focus({ preventScroll: true }),
    );
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
    };
  }, [close, visible]);

  const reveal = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.dialog
          open
          aria-modal="true"
          aria-label="DeepFrame introduction"
          className="fixed inset-0 z-[100] m-0 grid h-[100svh] w-screen max-w-none place-items-center overflow-hidden border-0 bg-[#03040a] px-5 py-0"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.025 }}
          transition={{
            duration: reduceMotion ? 0.12 : 0.65,
            ease: [0.76, 0, 0.24, 1],
          }}
        >
          <div
            aria-hidden="true"
            className="hero-grid absolute inset-0 scale-125 opacity-35"
          />
          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 size-[min(90vw,56rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_90deg,rgba(94,234,223,.16),rgba(87,117,255,.1),rgba(170,108,255,.15),rgba(94,234,223,.16))] blur-[100px]"
            animate={
              reduceMotion
                ? undefined
                : { rotate: [0, 22, -8, 0], scale: [0.88, 1.04, 0.94, 0.88] }
            }
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />

          <button
            ref={skipRef}
            type="button"
            onClick={close}
            className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-mono text-[7px] uppercase tracking-[0.16em] text-white/35 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white/72 sm:right-7 sm:top-7"
          >
            Skip
            <X className="size-3" />
          </button>

          <motion.div
            className="relative z-10 flex w-full max-w-6xl flex-col items-center text-center"
            initial="hidden"
            animate="show"
            variants={{
              show: {
                transition: {
                  delayChildren: stagger(reduceMotion ? 0 : 0.12, {
                    startDelay: 0.12,
                  }),
                },
              },
            }}
          >
            <motion.div
              variants={reveal}
              className="perspective-stage relative mb-8 grid size-24 place-items-center sm:mb-10 sm:size-28"
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border border-dashed border-cyan-100/22"
                initial={
                  reduceMotion
                    ? false
                    : { scale: 0.55, opacity: 0, rotate: -30 }
                }
                animate={{
                  scale: 1,
                  opacity: 1,
                  rotate: reduceMotion ? 0 : 330,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 2.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute inset-3 rounded-full border border-violet-100/20"
                initial={
                  reduceMotion ? false : { scale: 0.7, opacity: 0, rotate: 30 }
                }
                animate={{
                  scale: 1,
                  opacity: 1,
                  rotate: reduceMotion ? 0 : -250,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 2.6,
                  delay: 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
              <motion.div
                className="grid size-14 place-items-center rounded-[1.15rem] border border-white/15 bg-gradient-to-br from-cyan-200/16 via-white/[0.055] to-violet-300/14 shadow-[0_20px_70px_rgba(66,214,222,.2),inset_0_1px_0_rgba(255,255,255,.13)] backdrop-blur-xl sm:size-16"
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, scale: 0.72, rotateX: 35 }
                }
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{
                  duration: 0.7,
                  delay: reduceMotion ? 0 : 0.14,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Aperture
                  className="size-6 text-cyan-50 sm:size-7"
                  strokeWidth={1.25}
                />
              </motion.div>
            </motion.div>

            <motion.p
              variants={reveal}
              className="font-mono text-[8px] uppercase tracking-[0.28em] text-cyan-100/46"
            >
              Local image intelligence
            </motion.p>
            <motion.h1
              variants={reveal}
              className="gradient-text mt-5 text-[clamp(4rem,13vw,10.5rem)] font-semibold leading-[0.78] tracking-[-0.085em]"
            >
              DeepFrame
            </motion.h1>
            <motion.p
              variants={reveal}
              className="mt-7 text-base font-medium tracking-[-0.025em] text-white/72 sm:text-xl"
            >
              by Asher Menachem
            </motion.p>
            <motion.div
              variants={reveal}
              className="mt-5 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-white/26"
            >
              <ShieldCheck className="size-3.5 text-emerald-200/65" />
              Every field · Zero uploads
            </motion.div>
            <motion.div variants={reveal} className="mt-9 flex justify-center">
              <SocialLinks />
            </motion.div>
          </motion.div>

          <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.04]">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reduceMotion ? 1 : 4.7, ease: 'linear' }}
            />
          </div>
          <p className="absolute bottom-5 font-mono text-[7px] uppercase tracking-[0.22em] text-white/18 sm:bottom-7">
            Initializing private workspace
          </p>
        </motion.dialog>
      )}
    </AnimatePresence>
  );
}

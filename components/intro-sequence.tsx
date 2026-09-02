'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, stagger, useReducedMotion } from 'motion/react';

export const socials = [
  { label: 'Instagram', short: 'IG', handle: '@ashermenachem', href: 'https://www.instagram.com/ashermenachem' },
  { label: 'TikTok', short: 'TT', handle: '@ashermenachem', href: 'https://www.tiktok.com/@ashermenachem' },
  { label: 'GitHub', short: 'GH', handle: '@ashermenachem', href: 'https://github.com/ashermenachem' },
  { label: 'X', short: 'X', handle: '@ashermenachem', href: 'https://x.com/ashermenachem' },
  { label: 'Snapchat', short: 'SC', handle: '@asher.menachem', href: 'https://www.snapchat.com/@asher.menachem' },
];

export function SocialLinks({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {socials.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          className="group/social inline-flex items-center gap-2 border border-emerald-400/15 bg-emerald-400/[0.035] px-2.5 py-1.5 font-mono text-[9px] text-emerald-100/55 transition hover:-translate-y-0.5 hover:border-emerald-300/45 hover:bg-emerald-400/[0.08] hover:text-emerald-200"
        >
          <span className="text-emerald-400">{social.short}</span>
          <span>{detailed ? social.handle : social.label}</span>
        </a>
      ))}
    </div>
  );
}

export function IntroSequence() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem('deepframe-intro-seen')) {
      return;
    }
    const frame = window.requestAnimationFrame(() => setVisible(true));
    const close = () => {
      setVisible(false);
      window.sessionStorage.setItem('deepframe-intro-seen', 'true');
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    const timer = window.setTimeout(close, reduceMotion ? 500 : 3800);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [reduceMotion]);

  const close = () => {
    setVisible(false);
    window.sessionStorage.setItem('deepframe-intro-seen', 'true');
  };

  const line = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="matrix-noise fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#020503] px-4"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.5, ease: 'easeInOut' }}
        >
          <div className="scan-grid absolute inset-0 opacity-80" />
          <motion.div
            className="relative w-full max-w-3xl border border-emerald-400/20 bg-black/85 shadow-[0_0_140px_rgba(34,197,94,.12)]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.975, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex h-9 items-center gap-2 border-b border-emerald-400/15 bg-[#0b120d] px-3">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-mono text-[9px] text-emerald-200/40">deepframe — secure session</span>
            </div>
            <div className="px-6 py-10 sm:px-12 sm:py-14">
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { delayChildren: stagger(reduceMotion ? 0 : 0.13, { startDelay: 0.12 }) } } }}
              >
                <motion.p variants={line} className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-400/65">
                  $ initializing local forensic workspace_
                </motion.p>
                <motion.h1 variants={line} className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-white sm:text-6xl">
                  DeepFrame
                </motion.h1>
                <motion.p variants={line} className="mt-3 font-mono text-sm text-emerald-300">
                  by Asher Menachem<span className="ml-1 animate-pulse">▌</span>
                </motion.p>
                <motion.div variants={line} className="mt-8">
                  <SocialLinks detailed />
                </motion.div>
                <motion.div variants={line} className="mt-8 flex items-center gap-3 font-mono text-[9px] text-emerald-200/35">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                  EXIF · IPTC · XMP · ICC · MAKER NOTES · FILE SIGNATURES
                </motion.div>
              </motion.div>
            </div>
            <button onClick={close} className="absolute right-3 top-11 px-2 py-1 font-mono text-[9px] text-emerald-100/30 transition hover:text-emerald-200">
              SKIP [ESC]
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

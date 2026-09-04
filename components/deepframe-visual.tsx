'use client';

import { useId, type PointerEvent as ReactPointerEvent } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  Aperture,
  Fingerprint,
  LocateFixed,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { DeepFrameMark } from '@/components/deepframe-logo';

const spring = { stiffness: 120, damping: 22, mass: 0.7 };

const metadata = [
  { label: 'Aperture', value: 'ƒ/1.78' },
  { label: 'Sensor', value: '48 MP' },
  { label: 'Exposure', value: '1/120 s' },
];

function Corner({ className }: { className: string }) {
  return <span className={`absolute size-5 border-white/55 ${className}`} />;
}

/**
 * Decorative, pointer-reactive hero artwork for DeepFrame's landing page.
 * The complete visual is excluded from the accessibility tree because its
 * metadata values are illustrative rather than application content.
 */
export function DeepFrameVisual({ className = '' }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const rawId = useId().replace(/:/g, '');
  const skyId = `${rawId}-sky`;
  const hazeId = `${rawId}-haze`;
  const waterId = `${rawId}-water`;

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, spring);
  const smoothY = useSpring(pointerY, spring);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-9, 9]);
  const lightX = useTransform(smoothX, [-0.5, 0.5], [-42, 42]);
  const lightY = useTransform(smoothY, [-0.5, 0.5], [-28, 28]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      aria-hidden="true"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className={`relative isolate mx-auto aspect-[.92/1] w-full max-w-[760px] select-none sm:aspect-[1.12/1] ${className}`}
      style={{ perspective: '1400px', perspectiveOrigin: '50% 46%' }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[4rem]">
        <motion.div
          className="absolute left-[12%] top-[12%] size-[54%] rounded-full bg-cyan-400/[0.13] blur-[72px]"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, 24, -8, 0],
                  y: [0, -12, 14, 0],
                  scale: [1, 1.09, 0.96, 1],
                }
          }
          transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[8%] right-[3%] size-[48%] rounded-full bg-violet-500/[0.15] blur-[82px]"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, -22, 10, 0],
                  y: [0, 10, -18, 0],
                  scale: [1, 0.94, 1.08, 1],
                }
          }
          transition={{ duration: 14, ease: 'easeInOut', repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[14%] left-[26%] h-[35%] w-[50%] rounded-full bg-emerald-300/[0.11] blur-[76px]"
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.42, 0.8, 0.42], scale: [0.9, 1.08, 0.9] }
          }
          transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
        />
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-[46%] h-[43%] w-[93%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-cyan-100/[0.09]"
        style={{
          transform: 'translate(-50%, -50%) rotateX(69deg) rotateZ(-7deg)',
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[46%] h-[58%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-violet-200/[0.07]"
        style={{
          transform: 'translate(-50%, -50%) rotateX(69deg) rotateZ(12deg)',
        }}
      />

      <motion.div
        className="absolute inset-[7%_9%_8%] sm:inset-[7%_14%_8%]"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        animate={reduceMotion ? undefined : { y: [0, -9, 0] }}
        transition={{ duration: 6.5, ease: 'easeInOut', repeat: Infinity }}
      >
        <div
          className="absolute inset-[8%_-4%_-4%_10%] rounded-[2.4rem] border border-violet-200/[0.08] bg-violet-300/[0.025] backdrop-blur-sm"
          style={{ transform: 'translateZ(-78px) rotateZ(5deg)' }}
        />
        <div
          className="absolute inset-[4%_8%_3%_-7%] rounded-[2.4rem] border border-cyan-100/[0.08] bg-cyan-200/[0.025] backdrop-blur-sm"
          style={{ transform: 'translateZ(-42px) rotateZ(-4deg)' }}
        />

        <div
          className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/[0.14] bg-[#070a12]/85 p-2 shadow-[0_42px_100px_-30px_rgba(0,0,0,.9),0_0_0_1px_rgba(255,255,255,.025),0_0_90px_-35px_rgba(103,232,249,.35)] backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-2.5"
          style={{ transform: 'translateZ(0)' }}
        >
          <div className="relative flex h-full flex-col overflow-hidden rounded-[1.55rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.015] sm:rounded-[2rem]">
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.07] px-4 sm:h-13 sm:px-5">
              <div className="flex items-center gap-2">
                <DeepFrameMark className="size-3.5" />
                <span className="font-mono text-[7px] font-medium uppercase tracking-[0.2em] text-white/55 sm:text-[8px]">
                  DeepFrame / Live analysis
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-white/35" />
                <span className="size-1 rounded-full bg-white/20" />
                <span className="size-1 rounded-full bg-white/10" />
              </div>
            </div>

            <div className="relative mx-2 mt-2 min-h-0 flex-1 overflow-hidden rounded-[1.1rem] border border-white/[0.08] bg-[#0a1119] sm:mx-3 sm:mt-3 sm:rounded-[1.5rem]">
              <svg
                className="absolute inset-0 size-full"
                viewBox="0 0 720 430"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <linearGradient id={skyId} x1="0" y1="0" x2="0.85" y2="1">
                    <stop offset="0" stopColor="#17243d" />
                    <stop offset="0.48" stopColor="#1d3d51" />
                    <stop offset="1" stopColor="#8cb2b4" />
                  </linearGradient>
                  <radialGradient
                    id={hazeId}
                    cx="0"
                    cy="0"
                    r="1"
                    gradientTransform="translate(522 93) rotate(137) scale(240 170)"
                  >
                    <stop stopColor="#f4e7ca" stopOpacity=".86" />
                    <stop offset=".38" stopColor="#9de8df" stopOpacity=".23" />
                    <stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id={waterId} x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#2d5864" />
                    <stop offset="1" stopColor="#07131e" />
                  </linearGradient>
                </defs>
                <rect width="720" height="430" fill={`url(#${skyId})`} />
                <rect width="720" height="430" fill={`url(#${hazeId})`} />
                <circle
                  cx="554"
                  cy="78"
                  r="31"
                  fill="#fff5dc"
                  fillOpacity=".82"
                />
                <path
                  d="M0 258L92 169l55 34 73-94 74 101 55-48 55 64 68-101 86 102 52-41 110 90v154H0Z"
                  fill="#0a1c28"
                />
                <path
                  d="m92 169 30 18 25 16 73-94 31 95 43 6 55-48 22 73 33-9 68-101 38 94 48 8 52-41 45 80H0Z"
                  fill="#24404b"
                  fillOpacity=".86"
                />
                <path
                  d="m193 143 27-34 14 44 17 51-31-30-23 11-50 18Z"
                  fill="#d9edec"
                  fillOpacity=".72"
                />
                <path
                  d="m454 152 18-27 20 50 18 44-34-31-23 11-49 27Z"
                  fill="#e4f2ef"
                  fillOpacity=".65"
                />
                <path
                  d="M0 281c105-24 172 11 262-5 105-19 173-2 246 5 86 8 134-12 212-20v169H0Z"
                  fill={`url(#${waterId})`}
                />
                <path
                  d="M0 305c139-15 217 18 356 0 132-17 233 21 364-3"
                  fill="none"
                  stroke="#a7f3e8"
                  strokeOpacity=".14"
                  strokeWidth="2"
                />
                <path
                  d="M0 338c156-8 245 15 383 2 126-13 222 14 337-4"
                  fill="none"
                  stroke="#c4b5fd"
                  strokeOpacity=".09"
                  strokeWidth="2"
                />
              </svg>

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,.08),transparent_55%,rgba(2,6,23,.52))]" />
              <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:25%_25%]" />

              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.15em] text-white/65 backdrop-blur-md sm:left-4 sm:top-4 sm:text-[8px]">
                <ScanLine className="size-2.5 text-cyan-300" />
                frame 0024 / heic
              </div>

              <div className="absolute left-[38%] top-[28%] h-[34%] w-[29%]">
                <Corner className="left-0 top-0 border-l border-t" />
                <Corner className="right-0 top-0 border-r border-t" />
                <Corner className="bottom-0 left-0 border-b border-l" />
                <Corner className="bottom-0 right-0 border-b border-r" />
                <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80">
                  <span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
                </span>
              </div>

              <motion.div
                className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-cyan-300/[0.06] to-transparent"
                initial={reduceMotion ? false : { y: '-110%' }}
                animate={
                  reduceMotion ? { y: '240%' } : { y: ['-110%', '620%'] }
                }
                transition={{
                  duration: 4.2,
                  ease: 'linear',
                  repeat: reduceMotion ? 0 : Infinity,
                  repeatDelay: 0.7,
                }}
              >
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-100/90 to-transparent shadow-[0_0_18px_rgba(103,232,249,.85)]" />
              </motion.div>

              <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 sm:inset-x-4 sm:bottom-4">
                <div>
                  <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/45 sm:text-[8px]">
                    Visual signature
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium tracking-[-0.02em] text-white/90 sm:text-xs">
                    5712 × 4284 · Display P3
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-emerald-100 sm:text-[8px]">
                  126 fields
                </span>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-3 divide-x divide-white/[0.07] px-2 py-3 sm:px-3 sm:py-4">
              {metadata.map(({ label, value }) => (
                <div key={label} className="px-2 sm:px-3">
                  <p className="font-mono text-[6px] uppercase tracking-[0.16em] text-white/30 sm:text-[7px]">
                    {label}
                  </p>
                  <p className="mt-1 text-[9px] font-medium tracking-[-0.015em] text-white/85 sm:text-[11px]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <motion.div
              className="pointer-events-none absolute -left-1/4 -top-1/4 size-[54%] rounded-full bg-white/[0.10] blur-[58px]"
              style={{ x: lightX, y: lightY }}
            />
          </div>
        </div>

        <div
          className="absolute -left-[8%] top-[24%]"
          style={{ transform: 'translateZ(86px)' }}
        >
          <motion.div
            className="flex items-center gap-2 rounded-full border border-cyan-100/[0.16] bg-[#0a1119]/75 px-3 py-2 shadow-[0_16px_40px_rgba(0,0,0,.38),0_0_28px_rgba(103,232,249,.08)] backdrop-blur-xl"
            animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={{
              duration: 4.4,
              delay: 0.25,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          >
            <LocateFixed className="size-3 text-cyan-300" />
            <div>
              <p className="font-mono text-[6px] uppercase tracking-[0.16em] text-white/35">
                GPS located
              </p>
              <p className="mt-0.5 font-mono text-[8px] text-white/80">
                34.0522° N
              </p>
            </div>
          </motion.div>
        </div>

        <div
          className="absolute -right-[9%] top-[13%]"
          style={{ transform: 'translateZ(110px)' }}
        >
          <motion.div
            className="flex items-center gap-2 rounded-full border border-violet-100/[0.16] bg-[#0a0c16]/75 px-3 py-2 shadow-[0_16px_40px_rgba(0,0,0,.38),0_0_30px_rgba(167,139,250,.09)] backdrop-blur-xl"
            animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 5.2, ease: 'easeInOut', repeat: Infinity }}
          >
            <Aperture className="size-3 text-violet-300" />
            <div>
              <p className="font-mono text-[6px] uppercase tracking-[0.16em] text-white/35">
                Lens profile
              </p>
              <p className="mt-0.5 font-mono text-[8px] text-white/80">
                24 mm · ƒ/1.78
              </p>
            </div>
          </motion.div>
        </div>

        <div
          className="absolute -bottom-[2%] right-[3%]"
          style={{ transform: 'translateZ(74px)' }}
        >
          <motion.div
            className="flex items-center gap-2 rounded-full border border-emerald-100/[0.15] bg-[#08120f]/80 px-3 py-2 shadow-[0_16px_40px_rgba(0,0,0,.38),0_0_30px_rgba(110,231,183,.08)] backdrop-blur-xl"
            animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
            transition={{
              duration: 4.8,
              delay: 0.6,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          >
            <Fingerprint className="size-3 text-emerald-300" />
            <div>
              <p className="font-mono text-[6px] uppercase tracking-[0.16em] text-white/35">
                File integrity
              </p>
              <p className="mt-0.5 flex items-center gap-1 font-mono text-[8px] text-white/80">
                SHA-256 verified{' '}
                <ShieldCheck className="size-2.5 text-emerald-300" />
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute bottom-[3%] left-1/2 h-8 w-[55%] -translate-x-1/2 rounded-full bg-black/70 blur-xl" />
    </div>
  );
}

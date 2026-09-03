'use client';

import {
  ChangeEvent,
  DragEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import {
  AnimatePresence,
  motion,
  stagger,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react';
import {
  Aperture,
  ArrowDown,
  ArrowUpRight,
  Binary,
  CalendarClock,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  CloudOff,
  Clipboard,
  Code2,
  Cpu,
  Database,
  Download,
  Eye,
  FileImage,
  Fingerprint,
  FolderSearch2,
  Gauge,
  ImageIcon,
  Info,
  Layers3,
  LockKeyhole,
  MapPin,
  Maximize2,
  Radio,
  ScanSearch,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TerminalSquare,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { IntroSequence, SocialLinks } from '@/components/intro-sequence';
import { AnalysisLoader } from '@/components/analysis-loader';
import { DeepFrameVisual } from '@/components/deepframe-visual';
import {
  findField,
  formatBytes,
  inspectPhoto,
  type MetadataField,
  type PhotoReport,
} from '@/lib/photo-inspector';
import { buildShareText } from '@/lib/share-report';

type View = 'overview' | 'metadata' | 'structure' | 'share' | 'raw';

type WebMcpDocument = Document & {
  modelContext?: {
    registerTool: (
      tool: {
        name: string;
        title: string;
        description: string;
        inputSchema: Record<string, unknown>;
        annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
        execute: () => unknown;
      },
      options: { signal: AbortSignal },
    ) => void | Promise<void>;
  };
};

const navItems = [
  { id: 'overview', label: 'Summary', icon: Eye },
  { id: 'metadata', label: 'All details', icon: Layers3 },
  { id: 'structure', label: 'File internals', icon: Binary },
  { id: 'share', label: 'Share', icon: Share2 },
  { id: 'raw', label: 'Raw data', icon: Code2 },
] as const;

const emptySignals = [
  {
    icon: MapPin,
    label: 'GPS coordinates',
    detail: 'Latitude, longitude, altitude and direction',
  },
  {
    icon: Smartphone,
    label: 'Camera & device',
    detail: 'Make, model, serial and software',
  },
  {
    icon: Aperture,
    label: 'Capture settings',
    detail: 'Lens, ISO, exposure, focus and flash',
  },
  {
    icon: Fingerprint,
    label: 'File integrity',
    detail: 'Four hashes, format and binary structure',
  },
];

const intelligenceLayers = [
  {
    icon: Camera,
    eyebrow: 'Camera and lens',
    title: 'See exactly how the photo was taken.',
    detail:
      'Get the phone or camera, lens, exposure, ISO, aperture, and capture time in plain language.',
    accent: 'from-cyan-300/25 via-sky-400/10 to-transparent',
  },
  {
    icon: MapPin,
    eyebrow: 'Location',
    title: 'Know whether the photo includes a location.',
    detail:
      'See exact coordinates when they exist. DeepFrame hides them by default when you share.',
    accent: 'from-violet-300/25 via-indigo-400/10 to-transparent',
  },
  {
    icon: Binary,
    eyebrow: 'Every remaining detail',
    title: 'Nothing readable gets left behind.',
    detail:
      'DeepFrame keeps advanced tags, color profiles, file structure, and fingerprints available without making the summary hard to read.',
    accent: 'from-emerald-300/20 via-cyan-400/10 to-transparent',
  },
];

const groupDescriptions: Record<string, string> = {
  'File properties':
    'File-system facts, signatures, dimensions and integrity hashes',
  File: 'Core image container properties',
  EXIF: 'Camera, capture and exposure information',
  Location: 'Precise geographic coordinates recorded by the device',
  'Maker notes': 'Manufacturer-specific camera and lens details',
  XMP: 'Extensible editing, workflow and rights metadata',
  IPTC: 'Editorial, caption, rights and publishing information',
  'Color profile': 'ICC color-management data',
  'Embedded thumbnail': 'Preview image stored inside the file',
  Computed: 'Values calculated from related embedded tags',
};

function pick(report: PhotoReport, matchers: RegExp[]) {
  return findField(report.fields, matchers);
}

function quickFacts(report: PhotoReport) {
  const make = pick(report, [/exif\.Make$/i]);
  const model = pick(report, [/exif\.Model$/i]);
  const width =
    report.image?.width ??
    pick(report, [/Image Width$/i, /PixelXDimension$/i, /ImageWidth$/i]);
  const height =
    report.image?.height ??
    pick(report, [/Image Height$/i, /PixelYDimension$/i, /ImageHeight$/i]);
  return [
    {
      icon: Camera,
      label: 'Device',
      value: [make, model].filter(Boolean).join(' ') || 'Not embedded',
    },
    {
      icon: Aperture,
      label: 'Lens',
      value:
        pick(report, [/LensModel$/i, /LensID$/i, /LensType$/i]) ??
        'Not embedded',
    },
    {
      icon: Maximize2,
      label: 'Dimensions',
      value: width && height ? `${width} × ${height}` : 'Not embedded',
    },
    {
      icon: CalendarClock,
      label: 'Captured',
      value:
        pick(report, [/DateTimeOriginal$/i, /CreateDate$/i, /DateCreated$/i]) ??
        'Not embedded',
    },
    {
      icon: Gauge,
      label: 'Exposure',
      value:
        pick(report, [/ExposureTime$/i, /ShutterSpeedValue$/i]) ??
        'Not embedded',
    },
    {
      icon: Sparkles,
      label: 'Aperture / ISO',
      value:
        [
          pick(report, [/FNumber$/i, /ApertureValue$/i]),
          pick(report, [/ISOSpeedRatings$/i, /PhotographicSensitivity$/i]),
        ]
          .filter(Boolean)
          .join(' · ') || 'Not embedded',
    },
  ];
}

function plainSummary(report: PhotoReport) {
  const make = pick(report, [/exif\.Make$/i]);
  const model = pick(report, [/exif\.Model$/i]);
  const device = [make, model].filter(Boolean).join(' ');
  const lens = pick(report, [/LensModel$/i, /LensID$/i, /LensType$/i]);
  const captured = pick(report, [
    /DateTimeOriginal$/i,
    /CreateDate$/i,
    /DateCreated$/i,
  ]);
  const editor = pick(report, [
    /CreatorTool$/i,
    /HistorySoftwareAgent$/i,
    /Software$/i,
  ]);

  return [
    {
      icon: Camera,
      label: 'Camera',
      text: device
        ? `The file says this was captured with ${device}${lens ? ` using ${lens}` : ''}.`
        : 'The file does not reveal which camera or phone took it.',
    },
    {
      icon: CalendarClock,
      label: 'Time',
      text: captured
        ? `The recorded capture time is ${captured}.`
        : 'No original capture time is included in the file.',
    },
    {
      icon: MapPin,
      label: 'Location',
      text: report.gps
        ? `This photo contains an exact location: ${report.gps.latitude.toFixed(6)}, ${report.gps.longitude.toFixed(6)}.`
        : 'This photo does not contain readable GPS coordinates.',
    },
    {
      icon: Sparkles,
      label: 'Editing',
      text: editor
        ? `The metadata names ${editor} as the software used on this file.`
        : 'No editing app is named in the readable metadata.',
    },
  ];
}

function download(name: string, contents: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.62, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AppHeader({
  onNew,
  busy = false,
}: {
  onNew?: (file: File) => void;
  busy?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="glass-nav mx-auto flex h-14 max-w-[1480px] items-center justify-between rounded-2xl px-3 sm:px-4">
        <a href="#top" className="group flex min-w-0 items-center gap-2.5">
          <div className="relative grid size-8 place-items-center overflow-hidden rounded-[10px] border border-cyan-200/20 bg-gradient-to-br from-cyan-200/15 to-violet-300/10 shadow-[0_8px_26px_rgba(73,205,219,.12)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <ScanSearch className="relative size-4 text-cyan-100" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold tracking-[-0.025em] text-white/95">
              DeepFrame
            </p>
            <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/32">
              by Asher Menachem
            </p>
          </div>
        </a>
        {!onNew && (
          <nav
            aria-label="Landing page"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
          >
            <a
              href="#inspect"
              className="rounded-full px-3 py-2 text-[11px] text-white/48 transition hover:bg-white/[0.05] hover:text-white"
            >
              Inspect
            </a>
            <a
              href="#inside"
              className="rounded-full px-3 py-2 text-[11px] text-white/48 transition hover:bg-white/[0.05] hover:text-white"
            >
              Capabilities
            </a>
            <a
              href="#privacy"
              className="rounded-full px-3 py-2 text-[11px] text-white/48 transition hover:bg-white/[0.05] hover:text-white"
            >
              Privacy
            </a>
          </nav>
        )}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200/10 bg-emerald-200/[0.045] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-emerald-100/55 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.9)]" />
            On-device
          </div>
          {onNew && !busy && <UploadButton onFile={onNew} />}
        </div>
      </div>
    </header>
  );
}

function UploadButton({
  onFile,
  label = 'New photo',
}: {
  onFile: (file: File) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*,.heic,.heif,.avif,.tif,.tiff"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = '';
        }}
      />
      <Button
        variant="outline"
        className="h-8 rounded-full border-white/10 bg-white/[0.045] px-3 font-mono text-[9px] text-white/65 shadow-none hover:border-cyan-200/25 hover:bg-cyan-200/[0.08] hover:text-cyan-50"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5 text-cyan-200" /> {label}
      </Button>
    </>
  );
}

function UploadSurface({
  onFile,
  loading,
  fileName,
}: {
  onFile: (file: File) => void;
  loading: boolean;
  fileName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const reduceMotion = useReducedMotion();
  const receive = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };
  const drop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    receive(event.dataTransfer.files);
  };

  return (
    <>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*,.heic,.heif,.avif,.tif,.tiff"
        onChange={(event) => {
          receive(event.target.files);
          event.currentTarget.value = '';
        }}
      />
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="analysis-loader"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 1.01 }}
          >
            <AnalysisLoader fileName={fileName} />
          </motion.div>
        ) : (
          <motion.button
            key="upload-surface"
            type="button"
            aria-label="Choose a photo to inspect"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
            whileHover={reduceMotion ? undefined : { y: -4, scale: 1.003 }}
            whileTap={reduceMotion ? undefined : { scale: 0.995 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className={`upload-panel glass-panel group relative min-h-[430px] w-full cursor-pointer overflow-hidden rounded-[2rem] text-center transition-colors sm:min-h-[500px] sm:rounded-[2.5rem] ${dragging ? 'border-cyan-200/55 bg-cyan-200/[0.07]' : 'hover:border-cyan-100/25'}`}
          >
            <div className="hero-grid absolute inset-0 opacity-70" />
            <div className="absolute inset-x-[16%] top-0 h-40 rounded-full bg-cyan-300/[0.08] blur-[70px] transition-opacity duration-500 group-hover:opacity-100" />
            <div className="scanner-line absolute inset-x-[8%] top-16 h-px bg-gradient-to-r from-transparent via-cyan-100/75 to-transparent shadow-[0_0_24px_rgba(103,232,249,.8)]" />

            <div className="relative flex min-h-[430px] flex-col items-center justify-center px-6 py-12 sm:min-h-[500px]">
              <div className="perspective-stage relative grid size-28 place-items-center sm:size-32">
                <motion.span
                  className="absolute inset-0 rounded-full border border-dashed border-cyan-100/20"
                  animate={reduceMotion ? undefined : { rotate: 360 }}
                  transition={{
                    duration: 18,
                    ease: 'linear',
                    repeat: Infinity,
                  }}
                />
                <motion.span
                  className="absolute inset-3 rounded-full border border-violet-200/15"
                  animate={reduceMotion ? undefined : { rotate: -360 }}
                  transition={{
                    duration: 13,
                    ease: 'linear',
                    repeat: Infinity,
                  }}
                />
                <div className="grid size-17 place-items-center rounded-[1.35rem] border border-white/15 bg-gradient-to-br from-white/12 to-white/[0.035] shadow-[0_20px_55px_rgba(52,183,206,.18)] backdrop-blur-xl transition-transform duration-300 group-hover:scale-105 sm:size-20">
                  <FileImage
                    className="size-7 text-cyan-100 sm:size-8"
                    strokeWidth={1.35}
                  />
                </div>
              </div>
              <span className="mt-8 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-white/45">
                Stays on this device
              </span>
              <p className="mt-5 text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl">
                {dragging
                  ? 'Release to reveal everything'
                  : "Drop a photo. We'll explain it."}
              </p>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/45 sm:text-[15px]">
                DeepFrame finds the details, explains them, and keeps the full
                technical record ready when you need it.
              </p>
              <span className="premium-button mt-7 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[12px] font-semibold tracking-[-0.01em]">
                <Upload className="size-4" />
                Choose a photo
              </span>
              <div className="mt-7 flex flex-wrap justify-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-white/25">
                {['JPEG', 'PNG', 'HEIC', 'WEBP', 'TIFF', 'AVIF'].map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-white/[0.07] px-2.5 py-1"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

function Landing({
  onFile,
  loading,
  error,
  fileName,
}: {
  onFile: (file: File) => void;
  loading: boolean;
  error: string | null;
  fileName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <div id="top" className="relative overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[60] h-px origin-left bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300"
        style={{ scaleX: progress }}
      />
      <div
        aria-hidden="true"
        className="aurora-orb -left-[18rem] top-[15rem]"
      />
      <div
        aria-hidden="true"
        className="aurora-orb -right-[22rem] top-[68rem] [animation-delay:-7s]"
      />

      <main>
        <section className="relative mx-auto grid min-h-[calc(100svh-68px)] max-w-[1480px] items-center gap-4 px-5 pb-16 pt-10 lg:grid-cols-[0.86fr_1.14fr] lg:px-8 lg:pb-20 lg:pt-4">
          <div
            aria-hidden="true"
            className="hero-grid pointer-events-none absolute inset-0 opacity-35"
          />
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 py-8 lg:py-16"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/[0.055] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-100/65">
              <Radio className="size-3 text-cyan-200" />
              Your photo, explained
            </div>
            <h1 className="max-w-[760px] text-[clamp(3.45rem,7vw,7.3rem)] font-semibold leading-[0.88] tracking-[-0.078em] text-white">
              See what your
              <span className="accent-text block pb-2">photo remembers.</span>
            </h1>
            <p className="mt-7 max-w-xl text-[15px] leading-7 text-white/47 sm:text-[17px] sm:leading-8">
              Drop in a photo. DeepFrame tells you which camera took it, where
              it was taken, how it was edited, and every other detail the file
              still contains.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#inspect"
                className="premium-button inline-flex h-12 items-center gap-2 rounded-full px-6 text-[13px] font-semibold"
              >
                Inspect a photo
                <ArrowDown className="size-4" />
              </a>
              <a
                href="#inside"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-5 text-[12px] font-medium text-white/65 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                See how it works
                <ArrowUpRight className="size-4" />
              </a>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 border-t border-white/[0.08] pt-5">
              {[
                ['100%', 'on-device'],
                ['4×', 'file fingerprints'],
                ['0', 'cloud uploads'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="border-l border-white/[0.07] px-4 first:border-0 first:pl-0"
                >
                  <p className="text-xl font-semibold tracking-[-0.04em] text-white/90">
                    {value}
                  </p>
                  <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.15em] text-white/28">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.85,
              delay: 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative z-0 -mx-4 lg:mx-0"
          >
            <DeepFrameVisual />
          </motion.div>

          {!reduceMotion && (
            <motion.a
              href="#inspect"
              aria-label="Scroll to photo inspector"
              className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[7px] uppercase tracking-[0.22em] text-white/25 xl:flex"
              animate={{ y: [0, 5, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              Explore
              <ArrowDown className="size-3" />
            </motion.a>
          )}
        </section>

        <section
          id="inspect"
          className="relative scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32"
        >
          <Reveal className="mx-auto mb-11 max-w-3xl text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-cyan-200/58">
              Ready when you are
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl">
              One drop. The full story.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/42 sm:text-base">
              Pick the original photo. DeepFrame reads it on your device and
              gives you a clear answer—no account or upload needed.
            </p>
          </Reveal>
          <Reveal className="mx-auto max-w-[1040px]" delay={0.08}>
            <UploadSurface
              onFile={onFile}
              loading={loading}
              fileName={fileName}
            />
            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-3 rounded-2xl border border-red-300/15 bg-red-300/[0.055] px-4 py-3 text-sm text-red-100/75"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-300" />
                <span>{error}</span>
              </div>
            )}
          </Reveal>
          <Reveal
            className="mx-auto mt-4 grid max-w-[1040px] grid-cols-2 gap-2 sm:grid-cols-4"
            delay={0.12}
          >
            {emptySignals.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="soft-panel rounded-2xl p-4 sm:p-5">
                <Icon className="size-4 text-cyan-200/75" strokeWidth={1.5} />
                <p className="mt-4 text-[11px] font-semibold text-white/78">
                  {label}
                </p>
                <p className="mt-1.5 text-[9px] leading-4 text-white/30">
                  {detail}
                </p>
              </div>
            ))}
          </Reveal>
        </section>

        <section
          id="inside"
          className="relative scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32"
        >
          <div className="mx-auto max-w-[1280px]">
            <Reveal className="mb-14 max-w-4xl sm:mb-20">
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-violet-200/55">
                Clear answers first
              </p>
              <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.058em] text-white sm:text-6xl lg:text-7xl">
                Every layer.
                <br />
                <span className="text-white/33">Beautifully organized.</span>
              </h2>
            </Reveal>

            <div className="grid gap-4 lg:grid-cols-12">
              {intelligenceLayers.map(
                ({ icon: Icon, eyebrow, title, detail, accent }, index) => (
                  <Reveal
                    key={title}
                    delay={index * 0.05}
                    className={
                      index === 0
                        ? 'lg:col-span-7'
                        : index === 1
                          ? 'lg:col-span-5'
                          : 'lg:col-span-5'
                    }
                  >
                    <motion.article
                      whileHover={reduceMotion ? undefined : { y: -5 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 25,
                      }}
                      className="glass-panel group relative min-h-[350px] overflow-hidden rounded-[2rem] p-6 sm:p-8"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-45 transition-opacity duration-500 group-hover:opacity-75`}
                      />
                      <div className="hero-grid absolute inset-0 opacity-20" />
                      <div className="relative flex h-full min-h-[292px] flex-col">
                        <div className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
                          <Icon
                            className="size-5 text-white/75"
                            strokeWidth={1.45}
                          />
                        </div>
                        <div className="mt-auto pt-20">
                          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">
                            {eyebrow}
                          </p>
                          <h3 className="mt-3 max-w-xl text-2xl font-semibold leading-tight tracking-[-0.04em] text-white/92 sm:text-3xl">
                            {title}
                          </h3>
                          <p className="mt-3 max-w-xl text-sm leading-6 text-white/38">
                            {detail}
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  </Reveal>
                ),
              )}

              <Reveal className="lg:col-span-7" delay={0.12}>
                <motion.article
                  whileHover={reduceMotion ? undefined : { y: -5 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                  className="glass-panel relative min-h-[350px] overflow-hidden rounded-[2rem] p-6 sm:p-8"
                >
                  <div className="absolute -right-20 -top-24 size-72 rounded-full bg-gradient-to-br from-sky-300/20 to-violet-400/10 blur-3xl" />
                  <div className="relative grid h-full min-h-[292px] gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
                    <div>
                      <div className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.055]">
                        <Share2
                          className="size-5 text-cyan-100/80"
                          strokeWidth={1.45}
                        />
                      </div>
                      <p className="mt-10 font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">
                        Human-readable output
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white/92 sm:text-3xl">
                        From raw data to a report anyone can read.
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-white/38">
                        Copy one field, a complete section, clean text, or the
                        lossless JSON report.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 font-mono text-[9px] leading-6 text-white/40 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
                      <p className="text-cyan-200/75">DEEPFRAME PHOTO REPORT</p>
                      <p className="mt-3">
                        <span className="text-white/22">Device</span>
                        <span className="float-right text-white/65">
                          Apple iPhone
                        </span>
                      </p>
                      <p>
                        <span className="text-white/22">Lens</span>
                        <span className="float-right text-white/65">
                          24 mm ƒ/1.78
                        </span>
                      </p>
                      <p>
                        <span className="text-white/22">Captured</span>
                        <span className="float-right text-white/65">
                          Original timestamp
                        </span>
                      </p>
                      <div className="mt-4 h-px bg-gradient-to-r from-cyan-300/40 to-transparent" />
                      <p className="mt-3 text-emerald-200/60">
                        ✓ LOCATION HIDDEN BY DEFAULT
                      </p>
                    </div>
                  </div>
                </motion.article>
              </Reveal>
            </div>
          </div>
        </section>

        <section
          id="privacy"
          className="relative scroll-mt-20 px-4 py-24 sm:px-6 sm:py-36"
        >
          <div className="spotlight glass-panel mx-auto grid max-w-[1280px] overflow-hidden rounded-[2.5rem] px-6 py-14 sm:px-12 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-16">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/12 bg-emerald-200/[0.05] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-emerald-100/65">
                <LockKeyhole className="size-3" /> Private by architecture
              </div>
              <h2 className="mt-6 text-4xl font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl">
                Your photo never leaves your device.
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-white/42 sm:text-base">
                Every byte is read by your browser. There is no image server, no
                account history, and no cloud copy waiting somewhere else.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  [CloudOff, 'No cloud transfer'],
                  [Cpu, 'On-device decoding'],
                  [Database, 'No stored library'],
                  [ShieldCheck, 'Privacy-first sharing'],
                ].map(([ItemIcon, label]) => {
                  const Icon = ItemIcon as typeof CloudOff;
                  return (
                    <div
                      key={String(label)}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[11px] text-white/58"
                    >
                      <Icon
                        className="size-4 text-emerald-200/75"
                        strokeWidth={1.5}
                      />
                      {String(label)}
                    </div>
                  );
                })}
              </div>
            </Reveal>

            <Reveal
              className="perspective-stage relative mt-14 grid min-h-[360px] place-items-center lg:mt-0"
              delay={0.08}
            >
              <motion.div
                animate={reduceMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
                className="absolute size-72 rounded-full border border-dashed border-cyan-100/12 sm:size-80"
              />
              <motion.div
                animate={reduceMotion ? undefined : { rotate: -360 }}
                transition={{ duration: 19, ease: 'linear', repeat: Infinity }}
                className="absolute size-56 rounded-full border border-violet-100/14 sm:size-64"
              >
                <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-200 shadow-[0_0_20px_rgba(196,181,253,.85)]" />
              </motion.div>
              <div className="relative grid size-40 place-items-center rounded-[2.5rem] border border-white/12 bg-gradient-to-br from-cyan-200/12 via-white/[0.045] to-violet-300/10 shadow-[0_30px_90px_rgba(62,190,209,.17)] backdrop-blur-2xl sm:size-48">
                <ShieldCheck
                  className="size-16 text-cyan-100/80"
                  strokeWidth={1}
                />
                <span className="absolute -bottom-12 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.2em] text-white/28">
                  Browser → insight
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-4 pb-24 pt-12 text-center sm:px-6 sm:pb-32 sm:pt-20">
          <Reveal className="mx-auto max-w-4xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-cyan-200/55">
              There is more in the frame
            </p>
            <h2 className="gradient-text mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.065em] sm:text-7xl lg:text-8xl">
              Look deeper.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/40">
              Choose an original image and let DeepFrame reveal everything it
              still carries.
            </p>
            <div className="mt-8 flex justify-center">
              <UploadButton
                label="Choose a photo"
                onFile={(file) => {
                  onFile(file);
                  window.requestAnimationFrame(() =>
                    document
                      .getElementById('inspect')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
                  );
                }}
              />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] px-5 py-7">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[-0.02em] text-white/65">
              DeepFrame{' '}
              <span className="font-normal text-white/25">
                by Asher Menachem
              </span>
            </p>
            <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.16em] text-white/22">
              Every field · Zero uploads
            </p>
          </div>
          <SocialLinks />
        </div>
      </footer>
    </div>
  );
}

function CopyButton({
  onClick,
  done,
  label = 'Copy',
}: {
  onClick: () => void;
  done: boolean;
  label?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 rounded-full px-3 font-mono text-[8px] text-white/35 hover:bg-cyan-200/[0.07] hover:text-cyan-100"
    >
      {done ? (
        <Check className="size-3 text-emerald-300" />
      ) : (
        <Clipboard className="size-3" />
      )}
      {done ? 'Copied' : label}
    </Button>
  );
}

function MetadataSection({
  name,
  fields,
  copiedId,
  onCopy,
}: {
  name: string;
  fields: MetadataField[];
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const sectionText = fields
    .map((item) => `${item.name}: ${item.display}`)
    .join('\n');
  return (
    <section className="content-auto glass-panel overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.025] px-4 py-4 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg border border-cyan-200/10 bg-cyan-200/[0.05]">
              <FolderSearch2 className="size-3.5 text-cyan-100/75" />
            </div>
            <h3 className="text-[13px] font-semibold tracking-[-0.02em] text-white/88">
              {name}
            </h3>
            <span className="rounded-full bg-white/[0.045] px-2 py-0.5 font-mono text-[7px] text-white/30">
              {fields.length}
            </span>
          </div>
          <p className="ml-9 mt-1 hidden text-[9px] text-white/30 sm:block">
            {groupDescriptions[name] ??
              'Decoded metadata values from this file'}
          </p>
        </div>
        <CopyButton
          done={copiedId === `group:${name}`}
          label="Copy section"
          onClick={() => onCopy(sectionText, `group:${name}`)}
        />
      </div>
      <div className="divide-y divide-white/[0.055]">
        {fields.map((item, index) => {
          const id = `${item.path}:${index}`;
          return (
            <div
              key={id}
              className="group/field grid gap-2 px-4 py-4 transition-colors hover:bg-cyan-100/[0.025] sm:grid-cols-[minmax(180px,.72fr)_minmax(0,1.3fr)_64px] sm:items-center sm:gap-5 sm:px-5"
            >
              <div className="min-w-0">
                <p className="break-words text-[11px] font-medium text-white/74">
                  {item.name}
                </p>
                <p
                  className="mt-1 truncate font-mono text-[7px] text-white/18"
                  title={item.path}
                >
                  {item.path}
                </p>
              </div>
              <p className="break-words font-mono text-[10px] leading-5 text-cyan-50/66 sm:text-right">
                {item.display}
              </p>
              <button
                aria-label={`Copy ${item.name}`}
                title={`Copy ${item.name}`}
                onClick={() => onCopy(`${item.name}: ${item.display}`, id)}
                className="justify-self-start rounded-full px-2 py-1 font-mono text-[7px] text-white/25 transition hover:bg-cyan-200/[0.07] hover:text-cyan-100 sm:justify-self-end sm:opacity-0 sm:group-hover/field:opacity-100"
              >
                {copiedId === id ? 'COPIED' : 'COPY'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmptySearch() {
  return (
    <div className="soft-panel grid min-h-60 place-items-center rounded-2xl border-dashed text-center">
      <div>
        <CircleAlert className="mx-auto size-6 text-cyan-100/30" />
        <p className="mt-3 text-sm font-medium text-white/72">
          No matching fields
        </p>
        <p className="mt-1 text-[10px] text-white/30">
          Try another search or category.
        </p>
      </div>
    </div>
  );
}

function Overview({
  report,
  copiedId,
  onCopy,
}: {
  report: PhotoReport;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const facts = quickFacts(report);
  const summary = plainSummary(report);
  const summaryText = summary
    .map((item) => `${item.label}: ${item.text}`)
    .join('\n');
  const groupCounts = Array.from(
    new Set(report.fields.map((item) => item.group)),
  ).map((name) => ({
    name,
    count: report.fields.filter((item) => item.group === name).length,
  }));
  return (
    <motion.div
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      variants={{ show: { transition: { delayChildren: stagger(0.045) } } }}
      className="space-y-4"
    >
      <motion.section
        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
        className="glass-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8"
      >
        <div className="hero-grid absolute inset-0 opacity-35" />
        <div className="absolute -right-12 -top-20 size-64 rounded-full bg-cyan-300/[0.08] blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-100/55">
              analysis complete
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              {report.fields.length} details found
            </h2>
            <p className="mt-3 max-w-2xl text-xs leading-5 text-white/34">
              We organized everything into {groupCounts.length} clear groups.
              Every value below is shown exactly as it appears in the file.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200/10 bg-emerald-200/[0.045] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-emerald-100/65">
            <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />
            DONE PRIVATELY
          </div>
        </div>
      </motion.section>
      <motion.section
        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
        className="glass-panel overflow-hidden rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-cyan-100/45">
              Plain-English summary
            </p>
            <h3 className="mt-1 text-base font-semibold tracking-[-0.025em] text-white/84">
              Here&apos;s what this photo says.
            </h3>
          </div>
          <CopyButton
            done={copiedId === 'plain-summary'}
            label="Copy summary"
            onClick={() => onCopy(summaryText, 'plain-summary')}
          />
        </div>
        <div className="grid sm:grid-cols-2">
          {summary.map(({ icon: Icon, label, text }) => (
            <div
              key={label}
              className="flex gap-3 border-b border-white/[0.055] p-5 sm:border-r sm:p-6"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035]">
                <Icon className="size-4 text-cyan-100/62" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/68">
                  {label}
                </p>
                <p className="mt-1.5 text-[11px] leading-5 text-white/38">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {facts.map(({ icon: Icon, label, value }) => (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
            key={label}
            whileHover={reduceMotion ? undefined : { y: -3 }}
            className="soft-panel min-w-0 rounded-2xl p-4 transition-colors hover:border-cyan-100/16 hover:bg-cyan-100/[0.035] sm:p-5"
          >
            <Icon className="size-4 text-cyan-100/72" strokeWidth={1.45} />
            <p className="mt-5 font-mono text-[7px] uppercase tracking-[0.16em] text-white/27">
              {label}
            </p>
            <p
              className="mt-1.5 truncate text-xs font-medium text-white/76"
              title={String(value)}
            >
              {value}
            </p>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {report.gps ? (
          <a
            href={`https://www.openstreetmap.org/?mlat=${report.gps.latitude}&mlon=${report.gps.longitude}#map=16/${report.gps.latitude}/${report.gps.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="group block rounded-2xl border border-amber-200/13 bg-gradient-to-br from-amber-200/[0.06] to-orange-300/[0.025] p-5 transition hover:border-amber-200/28 sm:p-6"
          >
            <div className="flex items-start justify-between">
              <MapPin className="size-4 text-amber-300" />
              <ChevronRight className="size-4 text-amber-300/45 transition group-hover:translate-x-1" />
            </div>
            <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.14em] text-amber-200/55">
              precise location embedded
            </p>
            <p className="mt-2 font-mono text-sm text-amber-100">
              {report.gps.latitude.toFixed(7)},{' '}
              {report.gps.longitude.toFixed(7)}
            </p>
            <p className="mt-2 text-[9px] text-amber-100/40">
              Open in OpenStreetMap
            </p>
          </a>
        ) : (
          <div className="soft-panel rounded-2xl p-5 sm:p-6">
            <MapPin className="size-4 text-cyan-100/30" />
            <p className="mt-5 text-xs font-medium text-white/72">
              No GPS coordinates embedded
            </p>
            <p className="mt-1 text-[10px] text-white/30">
              The source file does not expose a location.
            </p>
          </div>
        )}
        <div className="soft-panel rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <Fingerprint className="size-4 text-violet-200/72" />
            <CopyButton
              done={copiedId === 'sha256'}
              onClick={() => onCopy(report.file.sha256, 'sha256')}
            />
          </div>
          <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.16em] text-white/28">
            SHA-256 fingerprint
          </p>
          <p className="mt-2 break-all font-mono text-[9px] leading-4 text-violet-50/52">
            {report.file.sha256}
          </p>
        </div>
      </div>
      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="border-b border-white/[0.07] px-5 py-4">
          <h3 className="text-xs font-semibold text-white/80">
            Metadata coverage
          </h3>
          <p className="mt-1 text-[9px] text-white/29">
            Every decoded family, with its exact field count
          </p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3">
          {groupCounts.map(({ name, count }) => (
            <div
              key={name}
              className="flex items-center justify-between border-b border-r border-white/[0.055] px-4 py-3.5 transition-colors hover:bg-white/[0.025]"
            >
              <div>
                <p className="text-[10px] font-medium text-white/70">{name}</p>
                <p className="mt-0.5 text-[8px] text-white/25">
                  {groupDescriptions[name] ?? 'Decoded file metadata'}
                </p>
              </div>
              <span className="font-mono text-[10px] text-cyan-200/70">
                {String(count).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function MetadataView({
  report,
  search,
  setSearch,
  group,
  setGroup,
  copiedId,
  onCopy,
}: {
  report: PhotoReport;
  search: string;
  setSearch: (value: string) => void;
  group: string;
  setGroup: (value: string) => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const groups = [
    'All',
    ...Array.from(new Set(report.fields.map((item) => item.group))),
  ];
  const query = search.trim().toLowerCase();
  const visible = report.fields.filter(
    (item) =>
      (group === 'All' || item.group === group) &&
      (!query ||
        `${item.name} ${item.path} ${item.display}`
          .toLowerCase()
          .includes(query)),
  );
  const visibleGroups = Array.from(new Set(visible.map((item) => item.group)));
  return (
    <div>
      <div className="sticky top-[76px] z-20 -mx-4 mb-4 border-b border-white/[0.07] bg-[#070910]/88 px-4 py-4 backdrop-blur-2xl sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-cyan-100/38" />
            <Input
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, path or value..."
              className="h-10 rounded-xl border-white/[0.09] bg-white/[0.035] pl-9 font-mono text-[9px] text-white/70 placeholder:text-white/22 focus-visible:border-cyan-200/35 focus-visible:ring-cyan-200/10"
            />
            {search && (
              <button
                aria-label="Clear search"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-cyan-100"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="scrollbar-none flex gap-1 overflow-x-auto">
            {groups.map((name) => {
              const count =
                name === 'All'
                  ? report.fields.length
                  : report.fields.filter((item) => item.group === name).length;
              return (
                <button
                  key={name}
                  onClick={() => setGroup(name)}
                  className={`shrink-0 rounded-full border px-3 py-2 font-mono text-[7px] transition ${group === name ? 'border-cyan-200/25 bg-cyan-200/[0.09] text-cyan-50/85' : 'border-white/[0.07] text-white/30 hover:border-white/15 hover:bg-white/[0.035] hover:text-white/65'}`}
                >
                  {name} <span className="ml-1 opacity-45">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.12em] text-white/25">
        <span>
          SHOWING {visible.length} / {report.fields.length} FIELDS
        </span>
        <span>UNKNOWN TAGS INCLUDED</span>
      </div>
      {!visible.length ? (
        <EmptySearch />
      ) : (
        <div className="space-y-3">
          {visibleGroups.map((name) => (
            <MetadataSection
              key={name}
              name={name}
              fields={visible.filter((item) => item.group === name)}
              copiedId={copiedId}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StructureView({ report }: { report: PhotoReport }) {
  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl border border-cyan-200/10 bg-cyan-200/[0.05]">
            <TerminalSquare className="size-4 text-cyan-100/70" />
          </div>
          <h2 className="text-xs font-semibold text-white/78">Binary header</h2>
          <span className="font-mono text-[7px] text-white/24">
            FIRST {Math.min(256, report.file.size)} BYTES
          </span>
        </div>
        <p className="mt-5 break-all rounded-xl border border-white/[0.06] bg-black/20 p-4 font-mono text-[9px] leading-5 text-cyan-50/42">
          {report.firstBytesHex}
        </p>
      </section>
      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[1fr_auto] border-b border-white/[0.07] bg-white/[0.025] px-5 py-4 font-mono text-[7px] uppercase tracking-[0.14em] text-white/28">
          <span>CONTAINER SEGMENT</span>
          <span>SIZE</span>
        </div>
        {report.structure.map((item, index) => (
          <div
            key={`${item.offset}-${index}`}
            className="grid grid-cols-[1fr_auto] gap-5 border-b border-white/[0.055] px-5 py-4 transition-colors last:border-0 hover:bg-white/[0.025]"
          >
            <div>
              <p className="text-[11px] font-medium text-white/72">
                {item.type}
              </p>
              <p className="mt-1 font-mono text-[7px] text-white/20">
                OFFSET 0x
                {item.offset.toString(16).toUpperCase().padStart(8, '0')} ·{' '}
                {item.length.toLocaleString('en-US')} BYTES
              </p>
            </div>
            <p className="self-center rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 font-mono text-[8px] text-cyan-100/55">
              {formatBytes(item.length)}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

function ShareView({
  report,
  copiedId,
  onCopy,
}: {
  report: PhotoReport;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const [includeLocation, setIncludeLocation] = useState(false);
  const [complete, setComplete] = useState(false);
  const text = buildShareText(report, { includeLocation, complete });
  const stem = report.file.name.replace(/\.[^.]+$/, '') || 'photo';
  const nativeShare = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: `DeepFrame report — ${report.file.name}`,
          text,
        });
      else onCopy(text, 'share');
    } catch {
      /* The user cancelled the native share sheet. */
    }
  };
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.02em] text-white/82">
              Plain-text report
            </h2>
            <p className="mt-1 text-[9px] text-white/29">
              Simple, readable text that works in Messages, email, Notes or
              anywhere else.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-full border-white/10 bg-white/[0.035] px-4 font-mono text-[8px] text-white/55 hover:border-cyan-200/20 hover:bg-cyan-200/[0.06] hover:text-cyan-50"
              onClick={() => onCopy(text, 'share')}
            >
              {copiedId === 'share' ? (
                <Check className="size-3.5 text-emerald-300" />
              ) : (
                <Clipboard className="size-3.5" />
              )}
              {copiedId === 'share' ? 'Copied' : 'Copy text'}
            </Button>
            <Button
              className="premium-button h-9 rounded-full px-4 font-mono text-[8px] font-semibold hover:text-[#071115]"
              onClick={nativeShare}
            >
              <Share2 className="size-3.5" />
              Share
            </Button>
          </div>
        </div>
        <pre className="max-h-[720px] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-[10px] leading-6 text-cyan-50/57 sm:p-6">
          {text}
        </pre>
      </section>
      <aside className="space-y-3">
        <section className="glass-panel rounded-2xl p-5">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-100/52">
            Share settings
          </p>
          <div className="mt-5 flex items-center justify-between gap-4">
            <span>
              <span className="block text-[11px] font-medium">
                Include exact location
              </span>
              <span className="mt-1 block text-[9px] leading-4 text-white/28">
                GPS is hidden by default for privacy.
              </span>
            </span>
            <Switch
              aria-label="Include exact location"
              checked={includeLocation}
              onCheckedChange={setIncludeLocation}
            />
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <span>
              <span className="block text-[11px] font-medium">
                Include every detail
              </span>
              <span className="mt-1 block text-[9px] leading-4 text-white/28">
                Add every decoded field, organized by family.
              </span>
            </span>
            <Switch
              aria-label="Include complete metadata"
              checked={complete}
              onCheckedChange={setComplete}
            />
          </div>
        </section>
        <Button
          variant="outline"
          className="h-11 w-full rounded-xl border-white/10 bg-white/[0.035] font-mono text-[8px] text-white/55 hover:border-cyan-200/20 hover:bg-cyan-200/[0.06] hover:text-cyan-50"
          onClick={() => download(`${stem}-metadata.txt`, text, 'text/plain')}
        >
          <Download className="size-3.5 text-cyan-100/70" />
          Download .txt
        </Button>
        <div className="rounded-2xl border border-amber-200/12 bg-amber-200/[0.035] p-4">
          <Info className="size-3.5 text-amber-300" />
          <p className="mt-3 text-[9px] leading-4 text-amber-100/45">
            Review before sharing. Device serials, owner names and precise
            coordinates can be sensitive.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Results({
  report,
  previewUrl,
  view,
  setView,
  search,
  setSearch,
  group,
  setGroup,
  copiedId,
  onCopy,
}: {
  report: PhotoReport;
  previewUrl: string | null;
  view: View;
  setView: (view: View) => void;
  search: string;
  setSearch: (value: string) => void;
  group: string;
  setGroup: (value: string) => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const stem = report.file.name.replace(/\.[^.]+$/, '') || 'photo';
  const exportJson = () =>
    download(
      `${stem}-metadata.json`,
      JSON.stringify(report, null, 2),
      'application/json',
    );
  return (
    <motion.div
      id="top"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-[1500px] px-3 pb-10 pt-4 sm:px-6 sm:pt-5"
    >
      <div className="mb-2 flex h-9 items-center gap-2 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 font-mono text-[8px] uppercase tracking-[0.1em] text-white/26">
        <FileImage className="size-3 text-cyan-100/62" />
        <span className="truncate normal-case tracking-normal text-white/52">
          {report.file.name}
        </span>
        <span className="ml-auto hidden text-cyan-100/48 sm:inline">
          {report.fields.length} details found · {report.file.detectedType}
        </span>
      </div>
      <div className="glass-panel grid min-h-[calc(100vh-144px)] overflow-hidden rounded-[1.6rem] lg:grid-cols-[260px_minmax(0,1fr)] lg:rounded-[2rem]">
        <aside className="border-b border-white/[0.07] bg-black/10 lg:border-b-0 lg:border-r">
          <div className="relative m-3 aspect-[16/9] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/35 shadow-[0_20px_60px_rgba(0,0,0,.28)] lg:aspect-[5/4]">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt={`Preview of ${report.file.name}`}
                fill
                sizes="(min-width: 1024px) 250px, 100vw"
                unoptimized
                className="object-contain p-1"
              />
            ) : (
              <ImageIcon className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-cyan-100/18" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/72 to-transparent px-3 pb-3 pt-10">
              <p className="truncate text-[10px] font-medium text-white/82">
                {report.file.name}
              </p>
              <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-cyan-100/42">
                {formatBytes(report.file.size)} · {report.file.detectedType}
              </p>
            </div>
          </div>
          <nav
            aria-label="Report sections"
            className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-5 lg:block lg:space-y-1 lg:px-3"
          >
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[10px] transition ${view === id ? 'bg-cyan-100/[0.075] text-cyan-50/85' : 'text-white/32 hover:bg-white/[0.035] hover:text-white/68'}`}
              >
                {view === id && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,.72)]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon
                  className={`size-3.5 ${view === id ? 'text-cyan-100' : ''}`}
                  strokeWidth={1.5}
                />
                {label}
              </button>
            ))}
          </nav>
          <div className="mx-3 mt-4 hidden rounded-2xl border border-emerald-200/[0.07] bg-emerald-200/[0.025] p-4 lg:block">
            <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/24">
              PRIVACY STATUS
            </p>
            <div className="mt-2 flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.1em] text-emerald-100/55">
              <ShieldCheck className="size-3" />
              LOCAL ONLY / NO UPLOAD
            </div>
          </div>
        </aside>
        <main className="min-w-0 bg-[#080a12]/52">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] bg-white/[0.015] px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.18em] text-emerald-100/50">
                <Check className="size-3 text-emerald-300" />
                inspection complete
              </div>
              <h1 className="mt-2 truncate text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl">
                {navItems.find((item) => item.id === view)?.label}
              </h1>
              <p className="mt-1.5 text-[9px] text-white/28">
                {report.file.name} · {report.fields.length} details found
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="h-9 rounded-full border-white/10 bg-white/[0.03] px-4 font-mono text-[8px] text-white/52 hover:border-cyan-200/20 hover:bg-cyan-200/[0.06] hover:text-cyan-50"
                onClick={() => setView('share')}
              >
                <Share2 className="size-3.5 text-cyan-100/70" />
                Share
              </Button>
              <Button
                variant="outline"
                className="h-9 rounded-full border-white/10 bg-white/[0.03] px-4 font-mono text-[8px] text-white/52 hover:border-violet-200/20 hover:bg-violet-200/[0.06] hover:text-violet-50"
                onClick={exportJson}
              >
                <Download className="size-3.5 text-violet-100/70" />
                Download data
              </Button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {view === 'overview' && (
                  <Overview
                    report={report}
                    copiedId={copiedId}
                    onCopy={onCopy}
                  />
                )}
                {view === 'metadata' && (
                  <MetadataView
                    report={report}
                    search={search}
                    setSearch={setSearch}
                    group={group}
                    setGroup={setGroup}
                    copiedId={copiedId}
                    onCopy={onCopy}
                  />
                )}
                {view === 'structure' && <StructureView report={report} />}
                {view === 'share' && (
                  <ShareView
                    report={report}
                    copiedId={copiedId}
                    onCopy={onCopy}
                  />
                )}
                {view === 'raw' && (
                  <section className="glass-panel overflow-hidden rounded-2xl">
                    <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.025] px-4 py-4 sm:px-5">
                      <div>
                        <h2 className="text-xs font-semibold text-white/78">
                          Lossless decoded report
                        </h2>
                        <p className="mt-1 text-[9px] text-white/28">
                          Raw tag values and binary metadata are preserved here.
                        </p>
                      </div>
                      <CopyButton
                        done={copiedId === 'raw'}
                        onClick={() =>
                          onCopy(JSON.stringify(report, null, 2), 'raw')
                        }
                      />
                    </div>
                    <pre className="max-h-[760px] overflow-auto p-5 font-mono text-[9px] leading-5 text-cyan-50/46">
                      {JSON.stringify(report, null, 2)}
                    </pre>
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/22">
          DEEPFRAME BY <span className="text-cyan-100/52">ASHER MENACHEM</span>
        </p>
        <SocialLinks />
      </div>
    </motion.div>
  );
}

export default function DeepFrame() {
  const [report, setReport] = useState<PhotoReport | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFileName, setLoadingFileName] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('All');
  const [view, setView] = useState<View>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const reportRef = useRef<PhotoReport | null>(null);

  useEffect(() => {
    reportRef.current = report;
  }, [report]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  useEffect(() => {
    const context = (document as WebMcpDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'read_current_photo_summary',
            title: 'Read current photo summary',
            description:
              'Read a concise summary of the photo currently inspected in DeepFrame.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute: () => {
              const current = reportRef.current;
              if (!current) throw new Error('No photo has been inspected yet.');
              return {
                file: current.file,
                metadataFieldCount: current.fields.length,
                groups: Array.from(
                  new Set(current.fields.map((item) => item.group)),
                ),
                gps: current.gps ?? null,
                device:
                  [
                    pick(current, [/exif\.Make$/i]),
                    pick(current, [/exif\.Model$/i]),
                  ]
                    .filter(Boolean)
                    .join(' ') || null,
                lens: pick(current, [/LensModel$/i, /LensID$/i]) ?? null,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
    } catch {
      /* Experimental API unavailable. */
    }
    return () => lifecycle.abort();
  }, []);

  const handleFile = async (file: File) => {
    setLoading(true);
    setLoadingFileName(file.name);
    setError(null);
    setSearch('');
    setGroup('All');
    setView('overview');
    try {
      const [next] = await Promise.all([
        inspectPhoto(file),
        new Promise<void>((resolve) => window.setTimeout(resolve, 1100)),
      ]);
      setReport(next);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (reason) {
      setReport(null);
      setPreviewUrl(null);
      setError(
        reason instanceof Error
          ? reason.message
          : 'This file could not be inspected.',
      );
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(
      () => setCopiedId((current) => (current === id ? null : current)),
      1600,
    );
  };

  return (
    <>
      <IntroSequence />
      <AppHeader onNew={report ? handleFile : undefined} busy={loading} />
      {report && loading ? (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto grid min-h-[calc(100svh-72px)] max-w-[1100px] place-items-center px-4 py-12 sm:px-6"
        >
          <AnalysisLoader fileName={loadingFileName} />
        </motion.main>
      ) : report ? (
        <Results
          report={report}
          previewUrl={previewUrl}
          view={view}
          setView={setView}
          search={search}
          setSearch={setSearch}
          group={group}
          setGroup={setGroup}
          copiedId={copiedId}
          onCopy={copy}
        />
      ) : (
        <Landing
          onFile={handleFile}
          loading={loading}
          error={error}
          fileName={loadingFileName}
        />
      )}
    </>
  );
}

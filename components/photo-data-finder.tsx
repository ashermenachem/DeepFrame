'use client';

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, stagger, useReducedMotion } from 'motion/react';
import {
  Aperture,
  Binary,
  CalendarClock,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  Clipboard,
  Code2,
  Download,
  Eye,
  FileImage,
  Fingerprint,
  FolderSearch2,
  Gauge,
  ImageIcon,
  Info,
  Layers3,
  LoaderCircle,
  MapPin,
  Maximize2,
  Menu,
  Radio,
  ScanLine,
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
import { findField, formatBytes, inspectPhoto, type MetadataField, type PhotoReport } from '@/lib/photo-inspector';
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
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'metadata', label: 'All metadata', icon: Layers3 },
  { id: 'structure', label: 'File structure', icon: Binary },
  { id: 'share', label: 'Share report', icon: Share2 },
  { id: 'raw', label: 'Raw JSON', icon: Code2 },
] as const;

const emptySignals = [
  { icon: MapPin, label: 'GPS coordinates', detail: 'Latitude, longitude, altitude and direction' },
  { icon: Smartphone, label: 'Camera & device', detail: 'Make, model, serial and software' },
  { icon: Aperture, label: 'Capture settings', detail: 'Lens, ISO, exposure, focus and flash' },
  { icon: Fingerprint, label: 'File integrity', detail: 'Four hashes, format and binary structure' },
];

const groupDescriptions: Record<string, string> = {
  'File properties': 'File-system facts, signatures, dimensions and integrity hashes',
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
  const width = report.image?.width ?? pick(report, [/Image Width$/i, /PixelXDimension$/i, /ImageWidth$/i]);
  const height = report.image?.height ?? pick(report, [/Image Height$/i, /PixelYDimension$/i, /ImageHeight$/i]);
  return [
    { icon: Camera, label: 'Device', value: [make, model].filter(Boolean).join(' ') || 'Not embedded' },
    { icon: Aperture, label: 'Lens', value: pick(report, [/LensModel$/i, /LensID$/i, /LensType$/i]) ?? 'Not embedded' },
    { icon: Maximize2, label: 'Dimensions', value: width && height ? `${width} × ${height}` : 'Not embedded' },
    { icon: CalendarClock, label: 'Captured', value: pick(report, [/DateTimeOriginal$/i, /CreateDate$/i, /DateCreated$/i]) ?? 'Not embedded' },
    { icon: Gauge, label: 'Exposure', value: pick(report, [/ExposureTime$/i, /ShutterSpeedValue$/i]) ?? 'Not embedded' },
    { icon: Sparkles, label: 'Aperture / ISO', value: [pick(report, [/FNumber$/i, /ApertureValue$/i]), pick(report, [/ISOSpeedRatings$/i, /PhotographicSensitivity$/i])].filter(Boolean).join(' · ') || 'Not embedded' },
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

function AppHeader({ onNew }: { onNew?: (file: File) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-400/10 bg-[#070b08]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-8 place-items-center border border-emerald-400/20 bg-emerald-400/[0.06] shadow-[inset_0_0_18px_rgba(74,222,128,.06)]">
            <ScanSearch className="size-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.025em]">Photo Data Finder</p>
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-emerald-400/45">by Asher Menachem</p>
          </div>
        </div>
        <div className="hidden xl:block"><SocialLinks /></div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 font-mono text-[9px] text-emerald-200/45 sm:flex"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />LOCAL / SECURE</div>
          {onNew && <UploadButton onFile={onNew} />}
        </div>
      </div>
    </header>
  );
}

function UploadButton({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} className="sr-only" type="file" accept="image/*,.heic,.heif,.avif,.tif,.tiff" onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile(file); }} />
      <Button variant="outline" className="h-8 border-emerald-400/15 bg-emerald-400/[0.035] font-mono text-[10px] text-emerald-100/70 hover:border-emerald-300/35 hover:bg-emerald-400/[0.08]" onClick={() => inputRef.current?.click()}>
        <Upload className="size-3.5 text-emerald-400" /> New photo
      </Button>
    </>
  );
}

function UploadSurface({ onFile, loading }: { onFile: (file: File) => void; loading: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const receive = (files: FileList | null) => { const file = files?.[0]; if (file) onFile(file); };
  const drop = (event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); setDragging(false); receive(event.dataTransfer.files); };

  return (
    <>
      <input ref={inputRef} className="sr-only" type="file" accept="image/*,.heic,.heif,.avif,.tif,.tiff" onChange={(event) => receive(event.target.files)} />
      <motion.button
        type="button"
        aria-label="Choose a photo to inspect"
        onClick={() => !loading && inputRef.current?.click()}
        onKeyDown={(event) => { if (!loading && (event.key === 'Enter' || event.key === ' ')) inputRef.current?.click(); }}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        whileHover={loading ? undefined : { y: -3 }}
        whileTap={loading ? undefined : { scale: 0.995 }}
        className={`upload-terminal group relative min-h-[330px] cursor-pointer overflow-hidden border bg-[#080d09]/95 p-1 transition-colors ${dragging ? 'border-emerald-300/65' : 'border-emerald-400/18 hover:border-emerald-300/38'}`}
      >
        <div className="flex h-9 items-center gap-2 border-b border-emerald-400/10 bg-[#0d130f] px-3">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" /><span className="size-2.5 rounded-full bg-[#febc2e]" /><span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-[9px] text-emerald-100/30">inspector.local — ready</span>
        </div>
        <div className="scan-grid absolute inset-x-1 bottom-1 top-10 opacity-55" />
        {!loading && <div className="scanner-line absolute inset-x-5 top-12 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent shadow-[0_0_16px_rgba(74,222,128,.8)]" />}
        <div className="relative flex min-h-[285px] flex-col items-center justify-center px-6 text-center">
          {loading ? (
            <><LoaderCircle className="size-9 animate-spin text-emerald-400" /><p className="mt-5 font-mono text-xs text-emerald-200">decoding every available field...</p><p className="mt-2 font-mono text-[9px] text-emerald-100/35">hashing / mapping / indexing</p></>
          ) : (
            <>
              <div className="grid size-16 place-items-center border border-emerald-400/20 bg-emerald-400/[0.055] shadow-[0_0_40px_rgba(34,197,94,.08)] transition duration-300 group-hover:border-emerald-300/45 group-hover:bg-emerald-400/10">
                <FileImage className="size-7 text-emerald-400" strokeWidth={1.5} />
              </div>
              <p className="mt-6 text-xl font-semibold tracking-[-0.035em]">Drop an image to inspect</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">The complete file is decoded inside your browser. Nothing is uploaded.</p>
              <span className="mt-6 inline-flex h-9 items-center gap-2 bg-emerald-400 px-5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#031007] transition group-hover:bg-emerald-300"><Upload className="size-3.5" />Choose file</span>
              <p className="mt-5 font-mono text-[9px] text-emerald-100/25">JPEG / PNG / HEIC / HEIF / WEBP / TIFF / AVIF / GIF</p>
            </>
          )}
        </div>
      </motion.button>
    </>
  );
}

function Landing({ onFile, loading, error }: { onFile: (file: File) => void; loading: boolean; error: string | null }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="relative overflow-hidden">
      <div className="matrix-stream pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
      <div className="mx-auto grid min-h-[calc(100vh-56px)] max-w-[1380px] items-center gap-12 px-5 py-12 lg:grid-cols-[.82fr_1.18fr] lg:px-8">
        <motion.section initial={reduceMotion ? false : { opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="mb-6 inline-flex items-center gap-2 border border-emerald-400/15 bg-emerald-400/[0.035] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-300/75"><Radio className="size-3 animate-pulse" />forensic image intelligence</div>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[.98] tracking-[-0.065em] text-white sm:text-7xl lg:text-[78px]">Your photo.<br /><span className="text-emerald-400">Fully decoded.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-slate-400">Reveal every metadata field the file still carries—device, exact lens, GPS, edits, color profiles, timestamps, maker notes, unknown tags, hashes and container structure.</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-100/35">
            <span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-emerald-400" />zero uploads</span>
            <span className="flex items-center gap-2"><ScanLine className="size-3.5 text-emerald-400" />unknown tags included</span>
            <span className="flex items-center gap-2"><Share2 className="size-3.5 text-emerald-400" />clean text sharing</span>
          </div>
        </motion.section>
        <motion.section initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>
          <UploadSurface onFile={onFile} loading={loading} />
          {error && <p role="alert" className="mt-3 border border-red-400/15 bg-red-400/[0.04] px-3 py-2 font-mono text-[10px] text-red-300">ERROR: {error}</p>}
          <div className="mt-3 grid grid-cols-2 gap-px border border-emerald-400/10 bg-emerald-400/10 sm:grid-cols-4">
            {emptySignals.map(({ icon: Icon, label, detail }) => <div key={label} className="bg-[#070b08] p-4"><Icon className="size-4 text-emerald-400" /><p className="mt-3 text-[11px] font-semibold">{label}</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">{detail}</p></div>)}
          </div>
        </motion.section>
      </div>
      <footer className="border-t border-emerald-400/10 bg-[#050806] px-5 py-5"><div className="mx-auto flex max-w-[1380px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="font-mono text-[9px] text-emerald-100/35">BUILT BY <span className="text-emerald-400">ASHER MENACHEM</span> · DATA STAYS ON DEVICE</p><SocialLinks /></div></footer>
    </div>
  );
}

function CopyButton({ onClick, done, label = 'Copy' }: { onClick: () => void; done: boolean; label?: string }) {
  return <Button variant="ghost" size="sm" onClick={onClick} className="h-7 font-mono text-[9px] text-muted-foreground hover:bg-emerald-400/[0.06] hover:text-emerald-300">{done ? <Check className="size-3 text-emerald-400" /> : <Clipboard className="size-3" />}{done ? 'Copied' : label}</Button>;
}

function MetadataSection({ name, fields, copiedId, onCopy }: { name: string; fields: MetadataField[]; copiedId: string | null; onCopy: (text: string, id: string) => void }) {
  const sectionText = fields.map((item) => `${item.name}: ${item.display}`).join('\n');
  return (
    <section className="overflow-hidden border border-emerald-400/10 bg-[#080c09]">
      <div className="flex items-center justify-between border-b border-emerald-400/10 bg-[#0c120e] px-4 py-3 sm:px-5">
        <div><div className="flex items-center gap-2"><FolderSearch2 className="size-3.5 text-emerald-400" /><h3 className="text-xs font-semibold">{name}</h3><span className="font-mono text-[8px] text-emerald-400/40">{fields.length}</span></div><p className="mt-1 hidden text-[9px] text-muted-foreground sm:block">{groupDescriptions[name] ?? 'Decoded metadata values from this file'}</p></div>
        <CopyButton done={copiedId === `group:${name}`} label="Copy section" onClick={() => onCopy(sectionText, `group:${name}`)} />
      </div>
      <div className="divide-y divide-emerald-400/[0.07]">
        {fields.map((item, index) => {
          const id = `${item.path}:${index}`;
          return (
            <div key={id} className="group/field grid gap-2 px-4 py-3.5 transition hover:bg-emerald-400/[0.025] sm:grid-cols-[minmax(180px,.72fr)_minmax(0,1.3fr)_58px] sm:items-center sm:gap-5 sm:px-5">
              <div className="min-w-0"><p className="break-words text-[11px] font-medium text-slate-200">{item.name}</p><p className="mt-1 truncate font-mono text-[8px] text-emerald-100/20" title={item.path}>{item.path}</p></div>
              <p className="break-words font-mono text-[10px] leading-5 text-emerald-50/70 sm:text-right">{item.display}</p>
              <button aria-label={`Copy ${item.name}`} title={`Copy ${item.name}`} onClick={() => onCopy(`${item.name}: ${item.display}`, id)} className="justify-self-start font-mono text-[8px] text-emerald-100/25 transition hover:text-emerald-300 sm:justify-self-end sm:opacity-0 sm:group-hover/field:opacity-100">{copiedId === id ? 'COPIED' : 'COPY'}</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmptySearch() {
  return <div className="grid min-h-60 place-items-center border border-dashed border-emerald-400/12 text-center"><div><CircleAlert className="mx-auto size-6 text-emerald-400/35" /><p className="mt-3 text-sm font-medium">No matching fields</p><p className="mt-1 text-[10px] text-muted-foreground">Try another search or category.</p></div></div>;
}

function Overview({ report, copiedId, onCopy }: { report: PhotoReport; copiedId: string | null; onCopy: (text: string, id: string) => void }) {
  const reduceMotion = useReducedMotion();
  const facts = quickFacts(report);
  const groupCounts = Array.from(new Set(report.fields.map((item) => item.group))).map((name) => ({ name, count: report.fields.filter((item) => item.group === name).length }));
  return (
    <motion.div initial={reduceMotion ? false : 'hidden'} animate="show" variants={{ show: { transition: { delayChildren: stagger(0.045) } } }} className="space-y-4">
      <motion.section variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="relative overflow-hidden border border-emerald-400/12 bg-[#080d09] p-5 sm:p-6">
        <div className="scan-grid absolute inset-0 opacity-30" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-400/65">analysis complete</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{report.fields.length} readable data points</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">Decoded across {groupCounts.length} metadata families. Values below are preserved exactly as reported by the file.</p></div><div className="flex items-center gap-2 font-mono text-[9px] text-emerald-300"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,.8)]" />VERIFIED LOCAL READ</div></div>
      </motion.section>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {facts.map(({ icon: Icon, label, value }) => <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} key={label} className="min-w-0 border border-emerald-400/10 bg-[#080c09] p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/20 hover:bg-emerald-400/[0.025]"><Icon className="size-4 text-emerald-400" /><p className="mt-4 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1.5 truncate text-xs font-medium" title={String(value)}>{value}</p></motion.div>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {report.gps ? <a href={`https://www.openstreetmap.org/?mlat=${report.gps.latitude}&mlon=${report.gps.longitude}#map=16/${report.gps.latitude}/${report.gps.longitude}`} target="_blank" rel="noreferrer" className="group block border border-amber-300/15 bg-amber-300/[0.035] p-5 transition hover:border-amber-300/30"><div className="flex items-start justify-between"><MapPin className="size-4 text-amber-300" /><ChevronRight className="size-4 text-amber-300/45 transition group-hover:translate-x-1" /></div><p className="mt-5 font-mono text-[8px] uppercase tracking-[0.14em] text-amber-200/55">precise location embedded</p><p className="mt-2 font-mono text-sm text-amber-100">{report.gps.latitude.toFixed(7)}, {report.gps.longitude.toFixed(7)}</p><p className="mt-2 text-[9px] text-amber-100/40">Open in OpenStreetMap</p></a> : <div className="border border-emerald-400/10 bg-[#080c09] p-5"><MapPin className="size-4 text-emerald-400/35" /><p className="mt-5 text-xs font-medium">No GPS coordinates embedded</p><p className="mt-1 text-[10px] text-muted-foreground">The source file does not expose a location.</p></div>}
        <div className="border border-emerald-400/10 bg-[#080c09] p-5"><div className="flex items-center justify-between"><Fingerprint className="size-4 text-emerald-400" /><CopyButton done={copiedId === 'sha256'} onClick={() => onCopy(report.file.sha256, 'sha256')} /></div><p className="mt-5 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">SHA-256 fingerprint</p><p className="mt-2 break-all font-mono text-[9px] leading-4 text-emerald-100/55">{report.file.sha256}</p></div>
      </div>
      <section className="border border-emerald-400/10 bg-[#080c09]"><div className="border-b border-emerald-400/10 px-5 py-3"><h3 className="text-xs font-semibold">Metadata coverage</h3><p className="mt-1 text-[9px] text-muted-foreground">Every decoded family, with its exact field count</p></div><div className="grid sm:grid-cols-2 xl:grid-cols-3">{groupCounts.map(({ name, count }) => <div key={name} className="flex items-center justify-between border-b border-r border-emerald-400/[0.07] px-4 py-3"><div><p className="text-[10px] font-medium">{name}</p><p className="mt-0.5 text-[8px] text-muted-foreground">{groupDescriptions[name] ?? 'Decoded file metadata'}</p></div><span className="font-mono text-[10px] text-emerald-400">{String(count).padStart(2, '0')}</span></div>)}</div></section>
    </motion.div>
  );
}

function MetadataView({ report, search, setSearch, group, setGroup, copiedId, onCopy }: { report: PhotoReport; search: string; setSearch: (value: string) => void; group: string; setGroup: (value: string) => void; copiedId: string | null; onCopy: (text: string, id: string) => void }) {
  const groups = ['All', ...Array.from(new Set(report.fields.map((item) => item.group)))];
  const query = search.trim().toLowerCase();
  const visible = report.fields.filter((item) => (group === 'All' || item.group === group) && (!query || `${item.name} ${item.path} ${item.display}`.toLowerCase().includes(query)));
  const visibleGroups = Array.from(new Set(visible.map((item) => item.group)));
  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-4 border-b border-emerald-400/10 bg-[#070b08]/95 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="relative w-full xl:max-w-sm"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-emerald-400/45" /><Input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Search name, path or value..." className="h-9 rounded-none border-emerald-400/12 bg-black/25 pl-9 font-mono text-[10px] focus-visible:border-emerald-400/40" />{search && <button aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-100/30 hover:text-emerald-300"><X className="size-3.5" /></button>}</div><div className="scrollbar-none flex gap-1 overflow-x-auto">{groups.map((name) => { const count = name === 'All' ? report.fields.length : report.fields.filter((item) => item.group === name).length; return <button key={name} onClick={() => setGroup(name)} className={`shrink-0 border px-2.5 py-1.5 font-mono text-[8px] transition ${group === name ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300' : 'border-emerald-400/8 text-emerald-100/35 hover:border-emerald-400/20 hover:text-emerald-100/70'}`}>{name} <span className="ml-1 opacity-45">{count}</span></button>; })}</div></div>
      </div>
      <div className="mb-3 flex items-center justify-between font-mono text-[8px] text-emerald-100/30"><span>SHOWING {visible.length} / {report.fields.length} FIELDS</span><span>UNKNOWN TAGS INCLUDED</span></div>
      {!visible.length ? <EmptySearch /> : <div className="space-y-3">{visibleGroups.map((name) => <MetadataSection key={name} name={name} fields={visible.filter((item) => item.group === name)} copiedId={copiedId} onCopy={onCopy} />)}</div>}
    </div>
  );
}

function StructureView({ report }: { report: PhotoReport }) {
  return <div className="space-y-4"><section className="border border-emerald-400/10 bg-[#080c09] p-5"><div className="flex items-center gap-2"><TerminalSquare className="size-4 text-emerald-400" /><h2 className="text-xs font-semibold">Binary header</h2><span className="font-mono text-[8px] text-emerald-100/25">FIRST {Math.min(256, report.file.size)} BYTES</span></div><p className="mt-4 break-all font-mono text-[9px] leading-5 text-emerald-100/45">{report.firstBytesHex}</p></section><section className="overflow-hidden border border-emerald-400/10 bg-[#080c09]"><div className="grid grid-cols-[1fr_auto] border-b border-emerald-400/10 bg-[#0c120e] px-5 py-3 font-mono text-[8px] text-emerald-100/35"><span>CONTAINER SEGMENT</span><span>SIZE</span></div>{report.structure.map((item, index) => <div key={`${item.offset}-${index}`} className="grid grid-cols-[1fr_auto] gap-5 border-b border-emerald-400/[0.07] px-5 py-3.5 last:border-0"><div><p className="text-[11px] font-medium">{item.type}</p><p className="mt-1 font-mono text-[8px] text-emerald-100/20">OFFSET 0x{item.offset.toString(16).toUpperCase().padStart(8, '0')} · {item.length.toLocaleString('en-US')} BYTES</p></div><p className="self-center font-mono text-[9px] text-emerald-300/65">{formatBytes(item.length)}</p></div>)}</section></div>;
}

function ShareView({ report, copiedId, onCopy }: { report: PhotoReport; copiedId: string | null; onCopy: (text: string, id: string) => void }) {
  const [includeLocation, setIncludeLocation] = useState(false);
  const [complete, setComplete] = useState(false);
  const text = buildShareText(report, { includeLocation, complete });
  const stem = report.file.name.replace(/\.[^.]+$/, '') || 'photo';
  const nativeShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `Photo metadata — ${report.file.name}`, text });
      else onCopy(text, 'share');
    } catch { /* The user cancelled the native share sheet. */ }
  };
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"><section className="overflow-hidden border border-emerald-400/10 bg-[#080c09]"><div className="flex flex-col gap-3 border-b border-emerald-400/10 bg-[#0c120e] p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold">Plain-text report</h2><p className="mt-1 text-[9px] text-muted-foreground">Simple, readable text that works in Messages, email, Notes or anywhere else.</p></div><div className="flex gap-2"><Button variant="outline" className="h-8 rounded-none border-emerald-400/15 bg-transparent font-mono text-[9px]" onClick={() => onCopy(text, 'share')}>{copiedId === 'share' ? <Check className="size-3.5 text-emerald-400" /> : <Clipboard className="size-3.5" />}{copiedId === 'share' ? 'Copied' : 'Copy text'}</Button><Button className="h-8 rounded-none bg-emerald-400 font-mono text-[9px] text-[#031007] hover:bg-emerald-300" onClick={nativeShare}><Share2 className="size-3.5" />Share</Button></div></div><pre className="max-h-[720px] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-[10px] leading-6 text-emerald-50/65">{text}</pre></section><aside className="space-y-3"><section className="border border-emerald-400/10 bg-[#080c09] p-4"><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-emerald-400/60">Share settings</p><div className="mt-5 flex items-center justify-between gap-4"><span><span className="block text-[11px] font-medium">Include exact location</span><span className="mt-1 block text-[9px] leading-4 text-muted-foreground">GPS is hidden by default for privacy.</span></span><Switch aria-label="Include exact location" checked={includeLocation} onCheckedChange={setIncludeLocation} /></div><div className="mt-5 flex items-center justify-between gap-4"><span><span className="block text-[11px] font-medium">Complete metadata</span><span className="mt-1 block text-[9px] leading-4 text-muted-foreground">Add every decoded field, organized by family.</span></span><Switch aria-label="Include complete metadata" checked={complete} onCheckedChange={setComplete} /></div></section><Button variant="outline" className="h-10 w-full rounded-none border-emerald-400/15 bg-[#080c09] font-mono text-[9px]" onClick={() => download(`${stem}-metadata.txt`, text, 'text/plain')}><Download className="size-3.5 text-emerald-400" />Download .txt</Button><div className="border border-amber-300/12 bg-amber-300/[0.025] p-4"><Info className="size-3.5 text-amber-300" /><p className="mt-3 text-[9px] leading-4 text-amber-100/45">Review before sharing. Device serials, owner names and precise coordinates can be sensitive.</p></div></aside></div>;
}

function Results({ report, previewUrl, view, setView, search, setSearch, group, setGroup, copiedId, onCopy }: { report: PhotoReport; previewUrl: string | null; view: View; setView: (view: View) => void; search: string; setSearch: (value: string) => void; group: string; setGroup: (value: string) => void; copiedId: string | null; onCopy: (text: string, id: string) => void }) {
  const reduceMotion = useReducedMotion();
  const stem = report.file.name.replace(/\.[^.]+$/, '') || 'photo';
  const exportJson = () => download(`${stem}-metadata.json`, JSON.stringify(report, null, 2), 'application/json');
  return (
    <div className="mx-auto max-w-[1500px] px-3 pb-10 pt-3 sm:px-6">
      <div className="flex h-9 items-center gap-2 overflow-hidden border border-emerald-400/10 bg-[#0c120e] px-3 font-mono text-[9px] text-emerald-100/35"><Menu className="size-3" /><span>EXPLORER</span><ChevronRight className="size-3" /><FileImage className="size-3 text-emerald-400" /><span className="truncate text-emerald-100/60">{report.file.name}</span><span className="ml-auto hidden text-emerald-400/55 sm:inline">{report.fields.length} FIELDS / {report.file.detectedType.toUpperCase()}</span></div>
      <div className="grid min-h-[calc(100vh-122px)] border-x border-b border-emerald-400/10 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-emerald-400/10 bg-[#060906] lg:border-b-0 lg:border-r">
          <div className="relative aspect-[16/10] overflow-hidden border-b border-emerald-400/10 bg-black lg:aspect-square">{previewUrl ? <Image src={previewUrl} alt={`Preview of ${report.file.name}`} fill sizes="(min-width: 1024px) 250px, 100vw" unoptimized className="object-contain" /> : <ImageIcon className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-emerald-400/20" />}<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-3 pb-3 pt-10"><p className="truncate text-[10px] font-medium">{report.file.name}</p><p className="mt-1 font-mono text-[8px] text-emerald-300/45">{formatBytes(report.file.size)} · {report.file.detectedType}</p></div></div>
          <nav aria-label="Report sections" className="grid grid-cols-2 p-2 sm:grid-cols-5 lg:block">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setView(id)} className={`relative flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[10px] transition ${view === id ? 'text-emerald-200' : 'text-emerald-100/35 hover:bg-emerald-400/[0.035] hover:text-emerald-100/70'}`}>{view === id && <motion.span layoutId="nav-active" className="absolute inset-y-1 left-0 w-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,.8)]" transition={{ type: 'spring', stiffness: 450, damping: 35 }} />}<Icon className={`size-3.5 ${view === id ? 'text-emerald-400' : ''}`} />{label}</button>)}</nav>
          <div className="hidden border-t border-emerald-400/10 p-4 lg:block"><p className="font-mono text-[8px] text-emerald-100/25">PRIVACY STATUS</p><div className="mt-2 flex items-center gap-2 font-mono text-[8px] text-emerald-300/60"><ShieldCheck className="size-3" />LOCAL ONLY / NO UPLOAD</div></div>
        </aside>
        <main className="min-w-0 bg-[#070b08]">
          <div className="flex flex-col gap-4 border-b border-emerald-400/10 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6"><div className="min-w-0"><div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-emerald-400/60"><Check className="size-3" />inspection complete</div><h1 className="mt-2 truncate text-xl font-semibold tracking-[-0.035em] sm:text-2xl">{navItems.find((item) => item.id === view)?.label}</h1><p className="mt-1 text-[9px] text-muted-foreground">{report.file.name} · {report.fields.length} decoded fields</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="h-8 rounded-none border-emerald-400/15 bg-transparent font-mono text-[9px]" onClick={() => setView('share')}><Share2 className="size-3.5 text-emerald-400" />Share report</Button><Button variant="outline" className="h-8 rounded-none border-emerald-400/15 bg-transparent font-mono text-[9px]" onClick={exportJson}><Download className="size-3.5 text-emerald-400" />Export JSON</Button></div></div>
          <div className="p-4 sm:p-6"><AnimatePresence mode="wait"><motion.div key={view} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>{view === 'overview' && <Overview report={report} copiedId={copiedId} onCopy={onCopy} />}{view === 'metadata' && <MetadataView report={report} search={search} setSearch={setSearch} group={group} setGroup={setGroup} copiedId={copiedId} onCopy={onCopy} />}{view === 'structure' && <StructureView report={report} />}{view === 'share' && <ShareView report={report} copiedId={copiedId} onCopy={onCopy} />}{view === 'raw' && <section className="overflow-hidden border border-emerald-400/10 bg-[#080c09]"><div className="flex items-center justify-between border-b border-emerald-400/10 bg-[#0c120e] px-4 py-3"><div><h2 className="text-xs font-semibold">Lossless decoded report</h2><p className="mt-1 text-[9px] text-muted-foreground">Raw tag values and binary metadata are preserved here.</p></div><CopyButton done={copiedId === 'raw'} onClick={() => onCopy(JSON.stringify(report, null, 2), 'raw')} /></div><pre className="max-h-[760px] overflow-auto p-5 font-mono text-[9px] leading-5 text-emerald-50/50">{JSON.stringify(report, null, 2)}</pre></section>}</motion.div></AnimatePresence></div>
        </main>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-emerald-400/10 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="font-mono text-[8px] text-emerald-100/25">PHOTO DATA FINDER BY <span className="text-emerald-400/60">ASHER MENACHEM</span></p><SocialLinks /></div>
    </div>
  );
}

export default function PhotoDataFinder() {
  const [report, setReport] = useState<PhotoReport | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('All');
  const [view, setView] = useState<View>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const reportRef = useRef<PhotoReport | null>(null);

  useEffect(() => { reportRef.current = report; }, [report]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => {
    const context = (document as WebMcpDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({ name: 'read_current_photo_summary', title: 'Read current photo summary', description: 'Read a concise summary of the photo currently inspected in Photo Data Finder.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: () => { const current = reportRef.current; if (!current) throw new Error('No photo has been inspected yet.'); return { file: current.file, metadataFieldCount: current.fields.length, groups: Array.from(new Set(current.fields.map((item) => item.group))), gps: current.gps ?? null, device: [pick(current, [/exif\.Make$/i]), pick(current, [/exif\.Model$/i])].filter(Boolean).join(' ') || null, lens: pick(current, [/LensModel$/i, /LensID$/i]) ?? null }; } }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch { /* Experimental API unavailable. */ }
    return () => lifecycle.abort();
  }, []);

  const handleFile = async (file: File) => {
    setLoading(true); setError(null); setSearch(''); setGroup('All'); setView('overview');
    try { const next = await inspectPhoto(file); setReport(next); setPreviewUrl(URL.createObjectURL(file)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'This file could not be inspected.'); }
    finally { setLoading(false); }
  };

  const copy = async (text: string, id: string) => { await navigator.clipboard.writeText(text); setCopiedId(id); window.setTimeout(() => setCopiedId((current) => current === id ? null : current), 1600); };

  return <><IntroSequence /><AppHeader onNew={report ? handleFile : undefined} />{report ? <Results report={report} previewUrl={previewUrl} view={view} setView={setView} search={search} setSearch={setSearch} group={group} setGroup={setGroup} copiedId={copiedId} onCopy={copy} /> : <Landing onFile={handleFile} loading={loading} error={error} />}</>;
}

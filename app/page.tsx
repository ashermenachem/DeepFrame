'use client';

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
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
  FileImage,
  Fingerprint,
  Gauge,
  ImageIcon,
  LoaderCircle,
  MapPin,
  Maximize2,
  ScanSearch,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { findField, formatBytes, inspectPhoto, type MetadataField, type PhotoReport } from '@/lib/photo-inspector';

type View = 'metadata' | 'structure' | 'raw';

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

const emptySignals = [
  { icon: MapPin, label: 'GPS coordinates', detail: 'Latitude, longitude & altitude' },
  { icon: Smartphone, label: 'Camera & device', detail: 'Make, model & software' },
  { icon: Aperture, label: 'Capture settings', detail: 'Lens, ISO, exposure & more' },
  { icon: Fingerprint, label: 'File fingerprint', detail: 'Hashes, format & structure' },
];

function field(report: PhotoReport, matchers: RegExp[]) {
  return findField(report.fields, matchers);
}

function makeQuickFacts(report: PhotoReport) {
  const make = field(report, [/exif\.Make$/i]);
  const model = field(report, [/exif\.Model$/i]);
  return [
    {
      icon: Camera,
      label: 'Device',
      value: [make, model].filter(Boolean).join(' ') || 'Not embedded',
    },
    {
      icon: Aperture,
      label: 'Lens',
      value: field(report, [/LensModel$/i, /LensID$/i, /LensType$/i]) ?? 'Not embedded',
    },
    {
      icon: Maximize2,
      label: 'Dimensions',
      value: (() => {
        const width = field(report, [/Image Width$/i, /PixelXDimension$/i, /ImageWidth$/i]);
        const height = field(report, [/Image Height$/i, /PixelYDimension$/i, /ImageHeight$/i]);
        return width && height ? `${width} × ${height}` : 'Not embedded';
      })(),
    },
    {
      icon: CalendarClock,
      label: 'Captured',
      value: field(report, [/DateTimeOriginal$/i, /CreateDate$/i, /DateCreated$/i]) ?? 'Not embedded',
    },
    {
      icon: Gauge,
      label: 'Exposure',
      value: field(report, [/ExposureTime$/i, /ShutterSpeedValue$/i]) ?? 'Not embedded',
    },
    {
      icon: Sparkles,
      label: 'Aperture / ISO',
      value: [field(report, [/FNumber$/i, /ApertureValue$/i]), field(report, [/ISOSpeedRatings$/i, /PhotographicSensitivity$/i])]
        .filter(Boolean)
        .join(' · ') || 'Not embedded',
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

function UploadSurface({ onFile, compact = false }: { onFile: (file: File) => void; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const receive = (files: FileList | null) => {
    const selected = files?.[0];
    if (selected) onFile(selected);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    receive(event.dataTransfer.files);
  };

  if (compact) {
    return (
      <>
        <input ref={inputRef} className="sr-only" type="file" accept="image/*,.heic,.heif,.avif,.tif,.tiff" onChange={(event) => receive(event.target.files)} />
        <Button variant="outline" className="h-9 rounded-full border-white/10 bg-white/[0.04] px-4" onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" />
          New photo
        </Button>
      </>
    );
  }

  return (
    <>
      <input ref={inputRef} className="sr-only" type="file" accept="image/*,.heic,.heif,.avif,.tif,.tiff" onChange={(event) => receive(event.target.files)} />
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose a photo to inspect"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`upload-panel group relative flex min-h-[250px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed px-6 text-center shadow-2xl shadow-black/25 backdrop-blur-xl transition ${dragging ? 'scale-[1.01] border-cyan-200/70 bg-cyan-300/[0.09]' : 'border-cyan-200/25 bg-card/75 hover:border-cyan-200/50 hover:bg-card'}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(87,228,255,0.11),transparent_48%)]" />
        <div className="relative grid size-16 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.08] text-cyan-200 transition duration-300 group-hover:-translate-y-1 group-hover:scale-105">
          <Upload className="size-7" strokeWidth={1.7} />
        </div>
        <p className="relative mt-5 text-lg font-semibold tracking-tight">{dragging ? 'Release to inspect' : 'Drop a photo here'}</p>
        <p className="relative mt-1.5 text-sm text-muted-foreground">or choose a file from your device</p>
        <span className="relative mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition group-hover:bg-cyan-200">
          <FileImage className="size-4" /> Choose photo
        </span>
        <p className="relative mt-4 text-[11px] text-slate-500">JPEG · PNG · HEIC · WebP · TIFF · AVIF</p>
      </div>
    </>
  );
}

function MetadataTable({ fields }: { fields: MetadataField[] }) {
  if (!fields.length) {
    return (
      <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-white/10 text-center">
        <div>
          <CircleAlert className="mx-auto size-6 text-slate-500" />
          <p className="mt-3 text-sm font-medium">No matching fields</p>
          <p className="mt-1 text-xs text-muted-foreground">Try another search or category.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
      <div className="divide-y divide-white/[0.06]">
        {fields.map((item, index) => (
          <div key={`${item.path}-${index}`} className="grid gap-2 bg-white/[0.018] px-4 py-3.5 hover:bg-white/[0.035] sm:grid-cols-[minmax(170px,.75fr)_minmax(0,1.4fr)] sm:gap-6 sm:px-5">
            <div className="min-w-0">
              <p className="break-words text-xs font-medium text-slate-200">{item.name}</p>
              <p className="mt-0.5 truncate font-mono text-[9px] text-slate-600" title={item.path}>{item.path}</p>
            </div>
            <p className="break-words font-mono text-[11px] leading-5 text-cyan-100/80 sm:text-right">{item.display}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [report, setReport] = useState<PhotoReport | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('All');
  const [view, setView] = useState<View>('metadata');
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<PhotoReport | null>(null);

  useEffect(() => { reportRef.current = report; }, [report]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    const context = (document as WebMcpDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: 'read_current_photo_summary',
        title: 'Read current photo summary',
        description: 'Read a concise summary of the photo currently inspected in Photo Data Finder.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: () => {
          const current = reportRef.current;
          if (!current) throw new Error('No photo has been inspected yet.');
          return {
            file: current.file,
            metadataFieldCount: current.fields.length,
            groups: Array.from(new Set(current.fields.map((item) => item.group))),
            gps: current.gps ?? null,
            device: [field(current, [/exif\.Make$/i]), field(current, [/exif\.Model$/i])].filter(Boolean).join(' ') || null,
            lens: field(current, [/LensModel$/i, /LensID$/i]) ?? null,
          };
        },
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch { /* Unsupported experimental API. */ }
    return () => lifecycle.abort();
  }, []);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setSearch('');
    setGroup('All');
    setView('metadata');
    try {
      const result = await inspectPhoto(file);
      setReport(result);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This file could not be inspected.');
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(() => report ? ['All', ...Array.from(new Set(report.fields.map((item) => item.group)))] : ['All'], [report]);
  const visibleFields = useMemo(() => {
    if (!report) return [];
    const query = search.trim().toLowerCase();
    return report.fields.filter((item) => {
      const inGroup = group === 'All' || item.group === group;
      const matches = !query || `${item.name} ${item.path} ${item.display}`.toLowerCase().includes(query);
      return inGroup && matches;
    });
  }, [report, search, group]);

  const exportReport = () => {
    if (!report) return;
    const stem = report.file.name.replace(/\.[^.]+$/, '') || 'photo';
    download(`${stem}-metadata.json`, JSON.stringify(report, null, 2), 'application/json');
  };

  const copyReport = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (!report) {
    return (
      <main className="min-h-screen overflow-hidden bg-background text-foreground">
        <Header />
        <section className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl place-items-center px-5 pb-20 sm:px-8">
          <div className="scan-grid absolute inset-x-0 top-0 z-0 h-[72%] opacity-50" />
          <div className="relative z-10 w-full max-w-4xl">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" /> Pixel-deep file inspection
              </div>
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-6xl">
                See what your photo <span className="text-cyan-300">knows.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-balance text-sm leading-6 text-muted-foreground sm:text-base">
                Uncover every metadata field still embedded in the file—from exact coordinates and camera gear to edits, timestamps, and binary structure.
              </p>
            </div>
            {loading ? (
              <div className="grid min-h-[250px] place-items-center rounded-[28px] border border-cyan-200/20 bg-card/75">
                <div className="text-center"><LoaderCircle className="mx-auto size-8 animate-spin text-cyan-300" /><p className="mt-4 text-sm font-medium">Reading every embedded field…</p></div>
              </div>
            ) : <UploadSurface onFile={handleFile} />}
            {error && <p role="alert" className="mt-4 text-center text-sm text-red-300">{error}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {emptySignals.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <Icon className="mb-3 size-4 text-cyan-300" /><p className="text-xs font-semibold">{label}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-[11px] leading-5 text-slate-500">Results show every field present in the uploaded file. Metadata removed by messaging apps, social platforms, or export tools cannot be recovered.</p>
          </div>
        </section>
      </main>
    );
  }

  const quickFacts = makeQuickFacts(report);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header action={<UploadSurface onFile={handleFile} compact />} />
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-4 sm:px-8 sm:pt-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-400"><Check className="size-3.5" /> Inspection complete</div>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{report.file.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{formatBytes(report.file.size)} · {report.file.type || 'Unknown type'} · {report.fields.length} metadata fields found</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 rounded-full border-white/10 bg-white/[0.03] px-4" onClick={copyReport}>{copied ? <Check className="size-4 text-emerald-400" /> : <Clipboard className="size-4" />}{copied ? 'Copied' : 'Copy JSON'}</Button>
            <Button className="h-9 rounded-full bg-cyan-300 px-4 text-slate-950 hover:bg-cyan-200" onClick={exportReport}><Download className="size-4" />Export report</Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-card">
              <div className="relative aspect-square bg-[#071019]">
                {previewUrl ? <img src={previewUrl} alt={`Preview of ${report.file.name}`} className="h-full w-full object-contain" /> : <ImageIcon className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-slate-700" />}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-12"><p className="truncate text-xs font-medium">{report.file.name}</p></div>
              </div>
            </div>

            {report.gps ? (
              <a href={`https://www.openstreetmap.org/?mlat=${report.gps.latitude}&mlon=${report.gps.longitude}#map=16/${report.gps.latitude}/${report.gps.longitude}`} target="_blank" rel="noreferrer" className="group block rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4 transition hover:border-amber-300/30">
                <div className="flex items-start justify-between"><div className="grid size-9 place-items-center rounded-xl bg-amber-300/10"><MapPin className="size-4 text-amber-300" /></div><ChevronRight className="size-4 text-amber-300/60 transition group-hover:translate-x-0.5" /></div>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/70">Precise location found</p>
                <p className="mt-1 font-mono text-xs text-amber-100">{report.gps.latitude.toFixed(7)}, {report.gps.longitude.toFixed(7)}</p>
                {report.gps.altitude && <p className="mt-1 text-[10px] text-amber-200/60">Altitude: {report.gps.altitude}</p>}
                <p className="mt-3 text-[10px] text-amber-200/50">Open in OpenStreetMap</p>
              </a>
            ) : (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-white/[0.04]"><MapPin className="size-4 text-slate-500" /></div><div><p className="text-xs font-medium">No GPS coordinates</p><p className="mt-0.5 text-[10px] text-muted-foreground">None are embedded in this file</p></div></div></div>
            )}

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"><Fingerprint className="size-3.5 text-cyan-300" />File fingerprint</div>
              <p className="text-[9px] text-slate-500">SHA-256</p><p className="mt-1 break-all font-mono text-[9px] leading-4 text-cyan-100/65">{report.file.sha256}</p>
              <p className="mt-3 text-[9px] text-slate-500">SHA-1</p><p className="mt-1 break-all font-mono text-[9px] leading-4 text-cyan-100/65">{report.file.sha1}</p>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {quickFacts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><Icon className="size-4 text-cyan-300" /><p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</p><p className="mt-1 truncate text-xs font-medium" title={value}>{value}</p></div>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-white/[0.08] bg-card/55">
              <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex rounded-xl bg-black/20 p-1">
                  {([['metadata', 'All metadata', ScanSearch], ['structure', 'File structure', Binary], ['raw', 'Raw JSON', Code2]] as const).map(([id, label, Icon]) => (
                    <button key={id} onClick={() => setView(id)} className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition ${view === id ? 'bg-white/[0.09] text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}><Icon className="size-3.5" />{label}</button>
                  ))}
                </div>
                {view === 'metadata' && <div className="relative w-full sm:w-64"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" /><Input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Search every field…" className="h-9 rounded-xl border-white/10 bg-black/20 pl-8 text-xs" />{search && <button aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="size-3.5" /></button>}</div>}
              </div>

              <div className="p-4 sm:p-5">
                {view === 'metadata' && (
                  <>
                    <div className="scrollbar-none mb-4 flex gap-2 overflow-x-auto pb-1">
                      {groups.map((name) => {
                        const count = name === 'All' ? report.fields.length : report.fields.filter((item) => item.group === name).length;
                        return <button key={name} onClick={() => setGroup(name)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-medium transition ${group === name ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200' : 'border-white/[0.08] bg-white/[0.025] text-muted-foreground hover:text-white'}`}>{name} <span className="ml-1 opacity-50">{count}</span></button>;
                      })}
                    </div>
                    <div className="mb-3 flex items-center justify-between"><p className="text-[10px] text-muted-foreground">Showing {visibleFields.length} of {report.fields.length} fields</p><p className="hidden text-[9px] uppercase tracking-[0.12em] text-slate-600 sm:block">Complete decoded metadata</p></div>
                    <MetadataTable fields={visibleFields} />
                  </>
                )}

                {view === 'structure' && (
                  <div>
                    <div className="mb-5 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">Binary header · first {Math.min(256, report.file.size)} bytes</p><p className="mt-3 break-all font-mono text-[10px] leading-5 text-cyan-100/60">{report.firstBytesHex}</p></div>
                    <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
                      {report.structure.map((item, index) => <div key={`${item.offset}-${index}`} className="grid grid-cols-[1fr_auto] gap-5 border-b border-white/[0.06] bg-white/[0.018] px-4 py-3 last:border-0"><div><p className="text-xs font-medium">{item.type}</p><p className="mt-1 font-mono text-[9px] text-slate-600">Offset 0x{item.offset.toString(16).toUpperCase().padStart(8, '0')}</p></div><p className="self-center font-mono text-[10px] text-cyan-100/70">{formatBytes(item.length)}</p></div>)}
                    </div>
                  </div>
                )}

                {view === 'raw' && (
                  <div><div className="mb-3 flex items-center justify-between"><p className="text-[10px] text-muted-foreground">Lossless decoded report, including raw tag values</p><Button variant="ghost" size="sm" onClick={copyReport}>{copied ? <Check /> : <Clipboard />}{copied ? 'Copied' : 'Copy'}</Button></div><pre className="max-h-[720px] overflow-auto rounded-2xl border border-white/[0.08] bg-[#050b11] p-4 font-mono text-[10px] leading-5 text-cyan-100/65">{JSON.stringify(report, null, 2)}</pre></div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Header({ action }: { action?: React.ReactNode }) {
  return (
    <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
      <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] shadow-inner"><ScanSearch className="size-5 text-cyan-300" /></div><div><p className="font-semibold tracking-[-0.02em]">Photo Data Finder</p><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Local metadata lab</p></div></div>
      {action ?? <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald-400" /><span className="hidden sm:inline">Your photo never leaves this device</span><span className="sm:hidden">100% local</span></div>}
    </header>
  );
}

import ExifReader from 'exifreader';

export type MetadataField = {
  group: string;
  name: string;
  path: string;
  display: string;
  raw: unknown;
};

export type StructureItem = {
  type: string;
  offset: number;
  length: number;
};

export type PhotoReport = {
  createdAt: string;
  file: {
    name: string;
    size: number;
    type: string;
    extension: string;
    detectedType: string;
    lastModified: string;
    sha256: string;
    sha1: string;
    sha384: string;
    sha512: string;
  };
  image?: { width: number; height: number; megapixels: number; aspectRatio: string };
  fields: MetadataField[];
  rawMetadata: unknown;
  structure: StructureItem[];
  firstBytesHex: string;
  gps?: { latitude: number; longitude: number; altitude?: string };
};

const GROUP_NAMES: Record<string, string> = {
  file: 'File',
  jfif: 'JFIF',
  pngFile: 'PNG',
  pngText: 'PNG text',
  png: 'PNG',
  exif: 'EXIF',
  iptc: 'IPTC',
  xmp: 'XMP',
  icc: 'Color profile',
  riff: 'WebP / RIFF',
  gif: 'GIF',
  Thumbnail: 'Embedded thumbnail',
  gps: 'Location',
  photoshop: 'Photoshop',
  makerNotes: 'Maker notes',
  composite: 'Computed',
  metadataRange: 'Metadata structure',
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function serialize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof ArrayBuffer) {
    const bytes = new Uint8Array(value);
    return { byteLength: bytes.byteLength, encoding: 'base64', data: bytesToBase64(bytes) };
  }
  if (ArrayBuffer.isView(value)) {
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return { byteLength: bytes.byteLength, encoding: 'base64', data: bytesToBase64(bytes) };
  }
  if (Array.isArray(value)) return value.map((entry) => serialize(entry, seen));
  if (typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) output[key] = serialize(entry, seen);
    seen.delete(value);
    return output;
  }
  if (typeof value === 'symbol') return value.description ?? 'Symbol';
  if (typeof value === 'function') return value.name || 'Function';
  return 'Unknown';
}

function displayValue(tag: unknown): string {
  if (tag && typeof tag === 'object') {
    const record = tag as Record<string, unknown>;
    const candidate = record.description ?? record.computed ?? record.value;
    if (candidate !== undefined) return displayValue(candidate);
  }
  if (Array.isArray(tag)) return tag.map(displayValue).join(', ');
  if (tag instanceof ArrayBuffer || ArrayBuffer.isView(tag)) {
    const length = tag instanceof ArrayBuffer ? tag.byteLength : tag.byteLength;
    return `Binary data · ${formatBytes(length)}`;
  }
  if (tag === null || tag === undefined || tag === '') return '—';
  if (typeof tag === 'object') return JSON.stringify(serialize(tag));
  if (typeof tag === 'string') return tag;
  if (typeof tag === 'number' || typeof tag === 'boolean' || typeof tag === 'bigint') return `${tag}`;
  if (typeof tag === 'symbol') return tag.description ?? 'Symbol';
  if (typeof tag === 'function') return tag.name || 'Function';
  return 'Unknown';
}

function flattenGroup(groupKey: string, value: unknown): MetadataField[] {
  if (!value || typeof value !== 'object') return [];
  const group = GROUP_NAMES[groupKey] ?? groupKey;
  const fields: MetadataField[] = [];

  const walk = (entry: unknown, parts: string[]) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const record = entry as Record<string, unknown>;
      const isTag = 'description' in record || 'value' in record || 'computed' in record;
      if (isTag) {
        fields.push({
          group,
          name: parts.at(-1) ?? group,
          path: [groupKey, ...parts].join('.'),
          display: displayValue(entry),
          raw: serialize(entry),
        });
        return;
      }
      for (const [key, child] of Object.entries(record)) walk(child, [...parts, key]);
      return;
    }
    fields.push({
      group,
      name: parts.at(-1) ?? group,
      path: [groupKey, ...parts].join('.'),
      display: displayValue(entry),
      raw: serialize(entry),
    });
  };

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    walk(entry, [key]);
  }
  return fields;
}

function hex(bytes: Uint8Array, limit = 256) {
  return Array.from(bytes.subarray(0, limit), (byte) => byte.toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase();
}

async function digest(name: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', buffer: ArrayBuffer) {
  const output = await crypto.subtle.digest(name, buffer);
  return Array.from(new Uint8Array(output), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function readAscii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function detectFileType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'JPEG';
  if (bytes[0] === 0x89 && readAscii(bytes, 1, 3) === 'PNG') return 'PNG';
  if (readAscii(bytes, 0, 6) === 'GIF87a' || readAscii(bytes, 0, 6) === 'GIF89a') return 'GIF';
  if (readAscii(bytes, 0, 4) === 'RIFF' && readAscii(bytes, 8, 4) === 'WEBP') return 'WebP';
  if ((readAscii(bytes, 0, 2) === 'II' && bytes[2] === 0x2a) || (readAscii(bytes, 0, 2) === 'MM' && bytes[3] === 0x2a)) return 'TIFF';
  if (readAscii(bytes, 0, 2) === 'BM') return 'BMP';
  if (readAscii(bytes, 4, 4) === 'ftyp') {
    const brand = readAscii(bytes, 8, 4).toLowerCase();
    if (brand.includes('avif') || brand.includes('avis')) return 'AVIF';
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) return 'HEIC / HEIF';
    return `ISO Base Media (${brand || 'unknown brand'})`;
  }
  return 'Unknown signature';
}

async function decodedDimensions(file: File) {
  if (typeof createImageBitmap !== 'function') return undefined;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    if (!width || !height) return undefined;
    const divisor = (a: number, b: number): number => b === 0 ? a : divisor(b, a % b);
    const common = divisor(width, height);
    return {
      width,
      height,
      megapixels: Number(((width * height) / 1_000_000).toFixed(2)),
      aspectRatio: `${width / common}:${height / common}`,
    };
  } catch {
    return undefined;
  }
}

function systemField(name: string, display: string, raw: unknown): MetadataField {
  return { group: 'File properties', name, path: `fileSystem.${name.replaceAll(' ', '')}`, display, raw };
}

const JPEG_MARKERS: Record<number, string> = {
  0xd8: 'SOI', 0xd9: 'EOI', 0xda: 'SOS', 0xdb: 'DQT', 0xc0: 'SOF0', 0xc1: 'SOF1',
  0xc2: 'SOF2', 0xc4: 'DHT', 0xdd: 'DRI', 0xe0: 'APP0 / JFIF', 0xe1: 'APP1 / EXIF or XMP',
  0xe2: 'APP2 / ICC or MPF', 0xed: 'APP13 / IPTC', 0xee: 'APP14', 0xfe: 'COM',
};

function jpegStructure(bytes: Uint8Array): StructureItem[] {
  const items: StructureItem[] = [{ type: 'SOI', offset: 0, length: 2 }];
  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    const start = offset - 1;
    if (marker === 0xd9) { items.push({ type: 'EOI', offset: start, length: 2 }); break; }
    if (marker === 0xda) {
      const headerLength = (bytes[offset + 1] << 8) | bytes[offset + 2];
      items.push({ type: 'SOS header', offset: start, length: headerLength + 2 });
      items.push({ type: 'Compressed image data', offset: start + headerLength + 2, length: Math.max(0, bytes.length - start - headerLength - 4) });
      break;
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      items.push({ type: JPEG_MARKERS[marker] ?? `Marker FF${marker.toString(16).toUpperCase()}`, offset: start, length: 2 });
      offset += 1;
      continue;
    }
    const length = (bytes[offset + 1] << 8) | bytes[offset + 2];
    if (length < 2 || start + length + 2 > bytes.length) break;
    items.push({ type: JPEG_MARKERS[marker] ?? `Marker FF${marker.toString(16).toUpperCase()}`, offset: start, length: length + 2 });
    offset = start + length + 2;
  }
  return items;
}

function pngStructure(bytes: Uint8Array): StructureItem[] {
  const items: StructureItem[] = [{ type: 'PNG signature', offset: 0, length: 8 }];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = readAscii(bytes, offset + 4, 4);
    if (offset + length + 12 > bytes.length) break;
    items.push({ type: `PNG ${type}`, offset, length: length + 12 });
    offset += length + 12;
    if (type === 'IEND') break;
  }
  return items;
}

function riffStructure(bytes: Uint8Array): StructureItem[] {
  const items: StructureItem[] = [{ type: `RIFF ${readAscii(bytes, 8, 4)}`, offset: 0, length: 12 }];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset + 4, true);
    const type = readAscii(bytes, offset, 4);
    items.push({ type: `RIFF ${type}`, offset, length: 8 + length + (length % 2) });
    offset += 8 + length + (length % 2);
  }
  return items;
}

function isoStructure(bytes: Uint8Array): StructureItem[] {
  const items: StructureItem[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (offset + 8 <= bytes.length) {
    let length = view.getUint32(offset);
    const type = readAscii(bytes, offset + 4, 4);
    let header = 8;
    if (length === 1 && offset + 16 <= bytes.length) {
      const high = view.getUint32(offset + 8);
      const low = view.getUint32(offset + 12);
      length = high * 2 ** 32 + low;
      header = 16;
    } else if (length === 0) length = bytes.length - offset;
    if (length < header || offset + length > bytes.length) break;
    items.push({ type: `ISO box ${type}`, offset, length });
    offset += length;
  }
  return items;
}

function inspectStructure(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return jpegStructure(bytes);
  if (readAscii(bytes, 1, 3) === 'PNG') return pngStructure(bytes);
  if (readAscii(bytes, 0, 4) === 'RIFF') return riffStructure(bytes);
  if (readAscii(bytes, 4, 4) === 'ftyp') return isoStructure(bytes);
  return [{ type: 'Image data / unrecognized container', offset: 0, length: bytes.length }];
}

function numericField(fields: MetadataField[], matcher: RegExp) {
  const field = fields.find((item) => matcher.test(item.path));
  if (!field) return undefined;
  const raw = field.raw as Record<string, unknown> | number;
  const candidate = typeof raw === 'number' ? raw : raw?.computed ?? raw?.value ?? field.display;
  const number = typeof candidate === 'number' ? candidate : Number(candidate);
  return Number.isFinite(number) ? number : undefined;
}

export async function inspectPhoto(file: File): Promise<PhotoReport> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let metadata: Record<string, unknown> = {};
  try {
    metadata = ExifReader.load(buffer, {
      expanded: true,
      includeOffsets: true,
      includeUnknown: true,
      computed: true,
    }) as unknown as Record<string, unknown>;
  } catch {
    metadata = {};
  }

  const detectedType = detectFileType(bytes);
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() ?? '' : '';
  const image = await decodedDimensions(file);
  const [sha1, sha256, sha384, sha512] = await Promise.all([
    digest('SHA-1', buffer.slice(0)),
    digest('SHA-256', buffer.slice(0)),
    digest('SHA-384', buffer.slice(0)),
    digest('SHA-512', buffer.slice(0)),
  ]);
  const systemFields: MetadataField[] = [
    systemField('File name', file.name, file.name),
    systemField('File size', `${formatBytes(file.size)} (${file.size.toLocaleString('en-US')} bytes)`, file.size),
    systemField('File extension', extension ? `.${extension}` : 'None', extension),
    systemField('Declared MIME type', file.type || 'Not supplied', file.type || null),
    systemField('Detected format', detectedType, detectedType),
    systemField('Last modified', new Date(file.lastModified).toISOString(), file.lastModified),
    systemField('Magic bytes', hex(bytes, 16), Array.from(bytes.subarray(0, 16))),
    systemField('SHA-1', sha1, sha1),
    systemField('SHA-256', sha256, sha256),
    systemField('SHA-384', sha384, sha384),
    systemField('SHA-512', sha512, sha512),
    ...(image ? [
      systemField('Decoded width', `${image.width.toLocaleString('en-US')} px`, image.width),
      systemField('Decoded height', `${image.height.toLocaleString('en-US')} px`, image.height),
      systemField('Pixel count', `${image.megapixels} MP`, image.width * image.height),
      systemField('Aspect ratio', image.aspectRatio, image.aspectRatio),
    ] : []),
  ];
  const fields = [
    ...systemFields,
    ...Object.entries(metadata).flatMap(([group, value]) => flattenGroup(group, value)),
  ].sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  const latitude = numericField(fields, /gps\.Latitude$/i);
  const longitude = numericField(fields, /gps\.Longitude$/i);
  const altitudeField = fields.find((item) => /gps\.GPSAltitude$|gps\.Altitude$/i.test(item.path));

  return {
    createdAt: new Date().toISOString(),
    file: {
      name: file.name,
      size: file.size,
      type: file.type || 'Unknown',
      extension,
      detectedType,
      lastModified: new Date(file.lastModified).toISOString(),
      sha256,
      sha1,
      sha384,
      sha512,
    },
    image,
    fields,
    rawMetadata: serialize(metadata),
    structure: inspectStructure(bytes),
    firstBytesHex: hex(bytes),
    gps: latitude !== undefined && longitude !== undefined
      ? { latitude, longitude, altitude: altitudeField?.display }
      : undefined,
  };
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return '0 bytes';
  const units = ['bytes', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const amount = bytes / 1024 ** index;
  return `${amount.toFixed(index === 0 ? 0 : amount >= 10 ? 1 : 2)} ${units[index]}`;
}

export function findField(fields: MetadataField[], patterns: RegExp[]) {
  return fields.find((field) => patterns.some((pattern) => pattern.test(field.path)))?.display;
}

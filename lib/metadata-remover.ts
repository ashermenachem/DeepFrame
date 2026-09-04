const JPEG_REMOVED_MARKERS = new Set([0xe1, 0xed, 0xfe]);
const PNG_REMOVED_CHUNKS = new Set(['eXIf', 'iTXt', 'tEXt', 'zTXt', 'tIME']);
const WEBP_REMOVED_CHUNKS = new Set(['EXIF', 'XMP ']);

export type CleanedPhoto = {
  blob: Blob;
  fileName: string;
  removedKinds: string[];
};

function bytesToAscii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function cleanedName(name: string) {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return `${name}-clean`;
  return `${name.slice(0, dot)}-clean${name.slice(dot)}`;
}

function concat(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function cleanJpeg(bytes: Uint8Array) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('This file does not contain a valid JPEG container.');
  }
  const parts = [bytes.slice(0, 2)];
  const removed = new Set<string>();
  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      parts.push(bytes.slice(offset));
      break;
    }
    let markerOffset = offset;
    while (bytes[markerOffset] === 0xff) markerOffset += 1;
    const marker = bytes[markerOffset];
    if (marker === 0xda) {
      parts.push(bytes.slice(offset));
      break;
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(bytes.slice(offset, markerOffset + 1));
      offset = markerOffset + 1;
      continue;
    }
    if (markerOffset + 2 >= bytes.length) throw new Error('The JPEG is truncated.');
    const segmentLength = (bytes[markerOffset + 1] << 8) | bytes[markerOffset + 2];
    const end = markerOffset + 1 + segmentLength;
    if (segmentLength < 2 || end > bytes.length) throw new Error('The JPEG contains an invalid segment.');
    if (JPEG_REMOVED_MARKERS.has(marker)) {
      removed.add(marker === 0xe1 ? 'EXIF/XMP' : marker === 0xed ? 'IPTC' : 'comments');
    } else {
      parts.push(bytes.slice(offset, end));
    }
    offset = end;
  }
  return { bytes: concat(parts), removed: [...removed] };
}

function cleanPng(bytes: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((value, index) => bytes[index] === value)) {
    throw new Error('This file does not contain a valid PNG container.');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const parts = [bytes.slice(0, 8)];
  const removed = new Set<string>();
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset, false);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error('The PNG contains an invalid chunk.');
    const type = bytesToAscii(bytes, offset + 4, 4);
    if (PNG_REMOVED_CHUNKS.has(type)) removed.add(type === 'eXIf' ? 'EXIF' : 'text/time metadata');
    else parts.push(bytes.slice(offset, end));
    offset = end;
    if (type === 'IEND') break;
  }
  return { bytes: concat(parts), removed: [...removed] };
}

function cleanWebp(bytes: Uint8Array) {
  if (bytesToAscii(bytes, 0, 4) !== 'RIFF' || bytesToAscii(bytes, 8, 4) !== 'WEBP') {
    throw new Error('This file does not contain a valid WebP container.');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: Uint8Array[] = [];
  const removed = new Set<string>();
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = bytesToAscii(bytes, offset, 4);
    const length = view.getUint32(offset + 4, true);
    const end = offset + 8 + length + (length % 2);
    if (end > bytes.length) throw new Error('The WebP contains an invalid chunk.');
    if (WEBP_REMOVED_CHUNKS.has(type)) {
      removed.add(type.trim());
    } else {
      const chunk = bytes.slice(offset, end);
      if (type === 'VP8X' && length > 0) chunk[8] &= ~0x0c;
      chunks.push(chunk);
    }
    offset = end;
  }
  const body = concat(chunks);
  const output = new Uint8Array(12 + body.length);
  output.set([82, 73, 70, 70], 0);
  new DataView(output.buffer).setUint32(4, output.length - 8, true);
  output.set([87, 69, 66, 80], 8);
  output.set(body, 12);
  return { bytes: output, removed: [...removed] };
}

export async function removePrivacyMetadata(file: Blob & { name?: string }): Promise<CleanedPhoto> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = file.type.toLowerCase();
  let result: { bytes: Uint8Array; removed: string[] };
  if (type === 'image/jpeg' || (bytes[0] === 0xff && bytes[1] === 0xd8)) result = cleanJpeg(bytes);
  else if (type === 'image/png' || bytesToAscii(bytes, 1, 3) === 'PNG') result = cleanPng(bytes);
  else if (type === 'image/webp' || bytesToAscii(bytes, 8, 4) === 'WEBP') result = cleanWebp(bytes);
  else throw new Error('Metadata removal currently supports JPEG, PNG, and WebP files.');

  const blobBytes = new Uint8Array(result.bytes.byteLength);
  blobBytes.set(result.bytes);
  return {
    blob: new Blob([blobBytes.buffer], { type: file.type || 'application/octet-stream' }),
    fileName: cleanedName(file.name || 'photo'),
    removedKinds: result.removed,
  };
}

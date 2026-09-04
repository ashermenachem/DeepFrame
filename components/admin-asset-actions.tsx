'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Download, Eye, FileImage, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

type AssetKind = 'original' | 'cleaned';

type AssetAccessRow = {
  bucket_name: string;
  storage_path: string;
  download_name: string;
  mime_type: string | null;
};

type Preview = {
  url: string;
  name: string;
  type: string;
};

export function AdminAssetActions({
  inspectionId,
  hasOriginal,
  hasCleaned,
}: {
  inspectionId: string;
  hasOriginal: boolean;
  hasCleaned: boolean;
}) {
  const supabase = createClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(
    () => () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );

  const getAsset = async (kind: AssetKind) => {
    const { data, error } = await supabase.rpc('admin_get_inspection_asset', {
      p_inspection_id: inspectionId,
      p_asset_kind: kind,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as AssetAccessRow | null;
    if (!row?.storage_path) throw new Error('This stored file is unavailable.');

    const { data: file, error: downloadError } = await supabase.storage
      .from(row.bucket_name)
      .download(row.storage_path);
    if (downloadError || !file)
      throw downloadError ?? new Error('The stored file could not be loaded.');
    return { file, row };
  };

  const downloadAsset = async (kind: AssetKind) => {
    setBusy(`download-${kind}`);
    setMessage(null);
    try {
      const { file, row } = await getAsset(kind);
      const url = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = row.download_name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setMessage(
        `${kind === 'original' ? 'Original' : 'Cleaned'} file downloaded. Access was audited.`,
      );
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Download failed.');
    } finally {
      setBusy(null);
    }
  };

  const previewOriginal = async () => {
    setBusy('preview-original');
    setMessage(null);
    setPreviewFailed(false);
    try {
      const { file, row } = await getAsset('original');
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return {
          url: URL.createObjectURL(file),
          name: row.download_name,
          type: row.mime_type ?? file.type,
        };
      });
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Preview failed.');
    } finally {
      setBusy(null);
    }
  };

  const closePreview = () => {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
    setPreviewFailed(false);
  };

  if (!hasOriginal && !hasCleaned) {
    return <span className="text-[9px] text-white/25">No stored file</span>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {hasOriginal ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void previewOriginal()}
              className="rounded-lg border-white/10 bg-white/[0.025] text-white/65"
            >
              <Eye className="size-3.5" /> View original
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void downloadAsset('original')}
              className="rounded-lg border-cyan-100/12 bg-cyan-100/[0.035] text-cyan-50/70"
            >
              <Download className="size-3.5" /> Original
            </Button>
          </>
        ) : null}
        {hasCleaned ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void downloadAsset('cleaned')}
            className="rounded-lg border-emerald-100/12 bg-emerald-100/[0.035] text-emerald-50/70"
          >
            <Download className="size-3.5" /> Clean copy
          </Button>
        ) : null}
      </div>
      {message ? (
        <p role="status" className="mt-2 text-[9px] leading-4 text-cyan-50/55">
          {message}
        </p>
      ) : null}

      {preview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Original preview for ${preview.name}`}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur-xl"
        >
          <div className="glass-panel w-full max-w-5xl rounded-[2rem] p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white/75">
                  {preview.name}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/30">
                  Original upload · {preview.type || 'unknown type'} · access
                  audited
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={closePreview}
                aria-label="Close original preview"
                className="rounded-full border-white/10 bg-white/[0.035]"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="relative mt-4 grid min-h-[22rem] place-items-center overflow-hidden rounded-2xl border border-white/[0.07] bg-black/60 sm:min-h-[34rem]">
              {previewFailed ? (
                <div className="max-w-sm px-6 text-center">
                  <FileImage className="mx-auto size-9 text-white/25" />
                  <p className="mt-4 text-sm text-white/55">
                    This browser cannot preview the original format. Downloading
                    the untouched file still works.
                  </p>
                </div>
              ) : (
                <Image
                  src={preview.url}
                  alt={`Original upload ${preview.name}`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 960px"
                  onError={() => setPreviewFailed(true)}
                  className="object-contain"
                />
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => void downloadAsset('original')}
                disabled={busy !== null}
                className="rounded-full bg-white px-5 text-[#060710] hover:bg-cyan-50"
              >
                <Download className="size-4" /> Download untouched original
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

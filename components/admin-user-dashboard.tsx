'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CalendarClock,
  Eye,
  FileImage,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeepFrameLogo } from '@/components/deepframe-logo';
import { formatBytes } from '@/lib/photo-inspector';
import type { AccountProfile } from '@/lib/account';

type Inspection = {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  detected_type: string | null;
  metadata_field_count: number;
  sha256: string | null;
  created_at: string;
  privacy_cleaned_at: string | null;
};
type Event = {
  id: number;
  event_type: string;
  event_data: unknown;
  created_at: string;
};
type Usage = {
  usage_date: string;
  inspections_count: number;
  removals_count: number;
};

export function AdminUserDashboard({
  profile,
  inspections,
  events,
  usage,
}: {
  profile: AccountProfile;
  inspections: Inspection[];
  events: Event[];
  usage: Usage[];
}) {
  return (
    <main className="min-h-screen bg-[#03040a] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <DeepFrameLogo />
          <Link href="/admin">
            <Button
              variant="outline"
              className="rounded-full border-white/10 bg-white/[0.035]"
            >
              <ArrowLeft className="size-4" /> Admin console
            </Button>
          </Link>
        </header>
        <section className="glass-panel mt-12 rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-violet-100/55">
                Security review workspace
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
                {profile.username}
              </h1>
              <p className="mt-3 text-sm text-white/38">
                {profile.email ?? 'No email'} · {profile.auth_provider}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/50">
                {profile.account_status}
              </span>
              <span className="rounded-full border border-cyan-100/15 bg-cyan-100/[0.04] px-3 py-1.5 text-[10px] text-cyan-100/65">
                {profile.plan}
              </span>
              <span className="rounded-full border border-violet-100/15 bg-violet-100/[0.04] px-3 py-1.5 text-[10px] text-violet-100/65">
                {profile.role}
              </span>
            </div>
          </div>
          <p className="mt-6 flex max-w-2xl gap-2 text-[11px] leading-5 text-white/30">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-200/60" />{' '}
            Use this restricted view only for a documented security, safety,
            abuse, support, privacy, or legal reason.
          </p>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_.55fr]">
          <article className="glass-panel rounded-[2rem] p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileImage className="size-4 text-cyan-200" /> Stored inspections
            </h2>
            <div className="mt-4 space-y-2">
              {inspections.length ? (
                inspections.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-white/70">
                        {item.file_name}
                      </p>
                      <p className="mt-1 text-[9px] text-white/28">
                        {item.detected_type ?? item.status} ·{' '}
                        {formatBytes(item.file_size)} ·{' '}
                        {item.metadata_field_count} fields ·{' '}
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                      {item.sha256 ? (
                        <p className="mt-1 truncate font-mono text-[8px] text-white/20">
                          SHA-256 {item.sha256}
                        </p>
                      ) : null}
                    </div>
                    {item.status === 'complete' ? (
                      <Link href={`/?inspection=${item.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg border-white/10 bg-white/[0.025]"
                        >
                          <Eye className="size-3.5" /> Open report
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="py-10 text-center text-xs text-white/30">
                  No inspections.
                </p>
              )}
            </div>
          </article>
          <div className="space-y-5">
            <article className="glass-panel rounded-[2rem] p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CalendarClock className="size-4 text-violet-200" /> Usage
              </h2>
              <div className="mt-4 space-y-2">
                {usage.length ? (
                  usage.map((day) => (
                    <div
                      key={day.usage_date}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                    >
                      <p className="text-[10px] text-white/55">
                        {day.usage_date}
                      </p>
                      <p className="mt-1 text-[9px] text-white/28">
                        {day.inspections_count} inspections ·{' '}
                        {day.removals_count} cleans
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/30">No usage yet.</p>
                )}
              </div>
            </article>
            <article className="glass-panel rounded-[2rem] p-6">
              <h2 className="text-lg font-semibold">Activity</h2>
              <div className="mt-4 max-h-[520px] space-y-2 overflow-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <p className="font-mono text-[9px] text-cyan-100/60">
                      {event.event_type}
                    </p>
                    <p className="mt-1 text-[8px] text-white/25">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

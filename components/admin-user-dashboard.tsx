'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  Ban,
  CalendarClock,
  Eye,
  FileJson,
  FileImage,
  RotateCcw,
  Save,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeepFrameLogo } from '@/components/deepframe-logo';
import { AdminAssetActions } from '@/components/admin-asset-actions';
import { createClient } from '@/lib/supabase/client';
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
  completed_at: string | null;
  privacy_cleaned_at: string | null;
  storage_path: string | null;
  cleaned_storage_path: string | null;
  report: unknown;
  failure_reason: string | null;
  hidden_from_history_at: string | null;
};
type Event = {
  id: number;
  event_type: string;
  event_data: Record<string, unknown>;
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
  currentAdminId,
}: {
  profile: AccountProfile;
  inspections: Inspection[];
  events: Event[];
  usage: Usage[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [username, setUsername] = useState(profile.username);

  const act = async (action: string, value?: string) => {
    setBusy(action);
    setMessage(null);
    const { error } = await supabase.rpc('admin_update_user', {
      p_target_user_id: profile.id,
      p_action: action,
      p_value: value ?? null,
    });
    setMessage(
      error
        ? error.message
        : 'Account updated and added to the admin audit log.',
    );
    setBusy(null);
    if (!error) router.refresh();
  };

  const downloadReport = (inspection: Inspection) => {
    if (!inspection.report) return;
    const blob = new Blob([JSON.stringify(inspection.report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${inspection.file_name.replace(/[^a-zA-Z0-9._-]/g, '_')}.deepframe.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  const totalInspections = usage.reduce(
    (sum, day) => sum + day.inspections_count,
    0,
  );
  const totalCleaned = usage.reduce((sum, day) => sum + day.removals_count, 0);

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
          {message ? (
            <p
              role="status"
              className="mt-5 rounded-xl border border-cyan-100/10 bg-cyan-100/[0.04] px-4 py-3 text-xs text-cyan-50/70"
            >
              {message}
            </p>
          ) : null}
        </section>

        <section className="glass-panel mt-5 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <UserCog className="size-5 text-cyan-200/70" />
            <h2 className="text-lg font-semibold">Account controls</h2>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_170px_170px_auto]">
            <div className="flex gap-2">
              <Input
                aria-label="Account username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-11 border-white/10 bg-black/20"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={busy !== null || username === profile.username}
                onClick={() => void act('set_username', username)}
                aria-label="Save username"
                className="size-11 shrink-0 rounded-xl border-white/10 bg-white/[0.03]"
              >
                <Save className="size-4" />
              </Button>
            </div>
            <select
              aria-label="Account plan"
              value={profile.plan}
              disabled={busy !== null}
              onChange={(event) => void act('set_plan', event.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-[#0b0d14] px-3 text-xs text-white/65"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="studio">Studio</option>
            </select>
            <select
              aria-label="Account role"
              value={profile.role}
              disabled={busy !== null || currentAdminId === profile.id}
              onChange={(event) => void act('set_role', event.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-[#0b0d14] px-3 text-xs text-white/65 disabled:opacity-40"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy !== null}
                onClick={() => void act('reset_usage')}
                className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-white/60"
              >
                <RotateCcw className="size-4" /> Reset today
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy !== null || currentAdminId === profile.id}
                onClick={() =>
                  void act(
                    profile.account_status === 'banned' ? 'unban' : 'ban',
                  )
                }
                className="h-11 rounded-xl border-red-100/10 bg-red-100/[0.03] text-red-100/65"
              >
                <Ban className="size-4" />{' '}
                {profile.account_status === 'banned' ? 'Unban' : 'Ban'}
              </Button>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-[9px] text-white/28 sm:grid-cols-4">
            <p>Created {new Date(profile.created_at).toLocaleString()}</p>
            <p>
              Last seen{' '}
              {profile.last_seen_at
                ? new Date(profile.last_seen_at).toLocaleString()
                : 'never'}
            </p>
            <p>{totalInspections} inspections in visible usage history</p>
            <p>{totalCleaned} metadata cleans in visible usage history</p>
          </div>
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
                      {item.failure_reason ? (
                        <p className="mt-2 text-[9px] text-red-100/55">
                          {item.failure_reason}
                        </p>
                      ) : null}
                      {item.hidden_from_history_at ? (
                        <p className="mt-2 text-[9px] text-amber-100/50">
                          Hidden by user{' '}
                          {new Date(
                            item.hidden_from_history_at,
                          ).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <AdminAssetActions
                        inspectionId={item.id}
                        hasOriginal={Boolean(item.storage_path)}
                        hasCleaned={Boolean(item.cleaned_storage_path)}
                      />
                      {item.report ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReport(item)}
                          className="rounded-lg border-white/10 bg-white/[0.025] text-white/60"
                        >
                          <FileJson className="size-3.5" /> Report JSON
                        </Button>
                      ) : null}
                      {item.status === 'complete' ? (
                        <Link href={`/?inspection=${item.id}`}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-white/10 bg-white/[0.025]"
                          >
                            <Eye className="size-3.5" /> Open report
                          </Button>
                        </Link>
                      ) : null}
                    </div>
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
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="size-4 text-cyan-200" /> Activity
              </h2>
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
                    {Object.keys(event.event_data ?? {}).length ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[8px] uppercase tracking-[0.12em] text-white/30">
                          Event details
                        </summary>
                        <pre className="mt-2 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/25 p-2 font-mono text-[8px] leading-4 text-white/35">
                          {JSON.stringify(event.event_data, null, 2)}
                        </pre>
                      </details>
                    ) : null}
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

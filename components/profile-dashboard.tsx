'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarClock,
  Check,
  Database,
  FileImage,
  Gauge,
  LogOut,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeepFrameLogo } from '@/components/deepframe-logo';
import { useAuth } from '@/components/auth-provider';
import { plans, type AccountProfile } from '@/lib/account';
import { createClient } from '@/lib/supabase/client';
import { formatBytes } from '@/lib/photo-inspector';

type HistoryItem = {
  id: string;
  file_name: string;
  file_size: number;
  detected_type: string | null;
  metadata_field_count: number;
  status: string;
  created_at: string;
  privacy_cleaned_at: string | null;
};

export function ProfileDashboard({
  profile,
  history,
  usage,
}: {
  profile: AccountProfile;
  history: HistoryItem[];
  usage: { inspections_count: number; removals_count: number } | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { signOut, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile.username);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const plan = plans[profile.plan];
  const inspectionsUsed = usage?.inspections_count ?? 0;
  const uploadLimit = profile.role === 'admin' ? Infinity : plan.uploads;

  const updateUsername = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('set_username', {
      p_username: username,
    });
    setMessage(error ? error.message : 'Username updated.');
    if (!error) await refreshProfile();
    setBusy(false);
  };

  const hideHistory = async (id: string) => {
    if (
      !window.confirm(
        'Hide this item from your profile history? This archives it from your view but does not erase the security record.',
      )
    )
      return;
    const { error } = await supabase.rpc('hide_inspection', {
      p_inspection_id: id,
    });
    setMessage(error ? error.message : 'History item hidden.');
    if (!error) router.refresh();
  };

  const requestDeletion = async () => {
    if (
      !window.confirm(
        'Request permanent account-data deletion? Your account will be locked while the request is reviewed. Limited records may be retained only for stated security or legal reasons.',
      )
    )
      return;
    setBusy(true);
    const { error } = await supabase.rpc('request_account_deletion', {
      p_reason: 'Requested from profile',
    });
    if (error) {
      setMessage(error.message);
    } else {
      await supabase.auth.signOut();
      router.push('/?deletion=requested');
    }
    setBusy(false);
  };

  return (
    <main className="min-h-screen bg-[#03040a] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <DeepFrameLogo />
          <div className="flex items-center gap-2">
            {profile.role === 'admin' ? (
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="rounded-full border-violet-100/15 bg-violet-100/[0.05]"
                >
                  <Settings2 className="size-4" /> Admin
                </Button>
              </Link>
            ) : null}
            <Link href="/">
              <Button
                variant="outline"
                className="rounded-full border-white/10 bg-white/[0.035]"
              >
                <ArrowLeft className="size-4" /> Inspector
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => void signOut().then(() => router.push('/'))}
              className="rounded-full text-white/45"
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </header>

        <section className="mt-14 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-100/55">
              Your private workspace
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
              Welcome, {profile.username}.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/42">
              Your reports are saved here and available whenever you sign in.
              Other users cannot find or view this profile.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-100/12 bg-cyan-100/[0.05] px-3 py-1.5 text-[10px] text-cyan-50/70">
                {profile.role === 'admin' ? 'Admin access' : plan.name}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] text-white/45">
                {history.length} saved reports
              </span>
              <span className="rounded-full border border-emerald-100/10 bg-emerald-100/[0.04] px-3 py-1.5 text-[10px] text-emerald-100/60">
                <ShieldCheck className="mr-1 inline size-3" /> Private profile
              </span>
            </div>
          </article>

          <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-violet-100/55">
                  Today’s access
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {profile.role === 'admin'
                    ? 'Unlimited'
                    : `${Math.max(uploadLimit - inspectionsUsed, 0)} upload${uploadLimit - inspectionsUsed === 1 ? '' : 's'} left`}
                </h2>
              </div>
              <Gauge className="size-6 text-violet-200/65" />
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
                style={{
                  width:
                    profile.role === 'admin'
                      ? '100%'
                      : `${Math.min((inspectionsUsed / uploadLimit) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="mt-3 text-xs text-white/35">
              {profile.role === 'admin'
                ? 'Admin accounts are not subject to plan limits.'
                : `${inspectionsUsed} of ${uploadLimit} used · resets daily · no rollover`}
            </p>
            {profile.plan === 'free' && profile.role !== 'admin' ? (
              <Link
                href="/#plans"
                className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-cyan-100/75 hover:text-cyan-50"
              >
                Compare plans <ArrowRight className="size-3.5" />
              </Link>
            ) : null}
          </article>
        </section>

        {message ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-cyan-100/10 bg-cyan-100/[0.04] px-4 py-3 text-sm text-cyan-50/70"
          >
            {message}
          </p>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-4">
            <article className="glass-panel rounded-[2rem] p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Settings2 className="size-4 text-cyan-200" /> Account
              </h2>
              <label
                htmlFor="username"
                className="mt-5 block text-[10px] uppercase tracking-[0.16em] text-white/35"
              >
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 border-white/10 bg-black/20"
              />
              <Button
                disabled={busy || username === profile.username}
                onClick={() => void updateUsername()}
                className="mt-3 w-full rounded-xl bg-white text-[#070810]"
              >
                Save username
              </Button>
              <p className="mt-4 text-[11px] leading-5 text-white/30">
                Signed in with {profile.auth_provider}. DeepFrame does not store
                your provider password.
              </p>
            </article>
            <article className="rounded-[2rem] border border-red-100/10 bg-red-100/[0.025] p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-red-50/80">
                <Ban className="size-4" /> Data controls
              </h2>
              <p className="mt-3 text-xs leading-5 text-white/35">
                Request permanent account-data deletion. Your account is locked
                while the request is processed.
              </p>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => void requestDeletion()}
                className="mt-4 w-full rounded-xl border-red-200/15 bg-red-200/[0.035] text-red-100/70"
              >
                <Trash2 className="size-4" /> Request deletion
              </Button>
              <Link
                href="/privacy"
                className="mt-4 block text-center text-[10px] text-white/35 hover:text-white"
              >
                Read the Privacy Policy
              </Link>
            </article>
          </div>

          <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-100/55">
                  Saved across devices
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Inspection history
                </h2>
              </div>
              <Database className="size-5 text-cyan-200/60" />
            </div>
            <div className="mt-6 space-y-2">
              {history.length ? (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.045]">
                      <FileImage className="size-4 text-cyan-200/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white/78">
                        {item.file_name}
                      </p>
                      <p className="mt-1 text-[10px] text-white/30">
                        {item.detected_type ?? 'Image'} ·{' '}
                        {formatBytes(item.file_size)} ·{' '}
                        {item.metadata_field_count} fields ·{' '}
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {item.privacy_cleaned_at ? (
                      <span title="Metadata-cleaned copy created">
                        <Check className="size-4 text-emerald-300/65" />
                      </span>
                    ) : null}
                    <Link
                      href={`/?inspection=${item.id}`}
                      aria-label={`Open ${item.file_name}`}
                      className="grid size-8 place-items-center rounded-full border border-white/10 text-white/45 hover:text-white"
                    >
                      <ArrowRight className="size-3.5" />
                    </Link>
                    <button
                      type="button"
                      aria-label={`Hide ${item.file_name} from history`}
                      onClick={() => void hideHistory(item.id)}
                      className="grid size-8 place-items-center rounded-full text-white/25 hover:bg-red-100/[0.05] hover:text-red-100/70"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
                  <CalendarClock className="mx-auto size-6 text-white/25" />
                  <p className="mt-4 text-sm text-white/45">
                    No saved inspections yet.
                  </p>
                  <Link
                    href="/#inspect"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-100/70"
                  >
                    Inspect your first photo <ArrowRight className="size-3" />
                  </Link>
                </div>
              )}
            </div>
          </article>
        </section>

        <section id="plans" className="mt-6 grid gap-3 md:grid-cols-3">
          {Object.entries(plans).map(([id, option]) => (
            <article
              key={id}
              className={`rounded-[1.75rem] border p-6 ${profile.plan === id ? 'border-cyan-200/25 bg-cyan-200/[0.055]' : 'border-white/[0.07] bg-white/[0.02]'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{option.name}</h3>
                {profile.plan === id ? (
                  <span className="text-[9px] text-cyan-100/70">CURRENT</span>
                ) : (
                  <Sparkles className="size-4 text-violet-200/50" />
                )}
              </div>
              <p className="mt-3 text-3xl font-semibold">
                {option.price}
                <span className="text-xs text-white/30">/month</span>
              </p>
              <p className="mt-3 text-xs leading-5 text-white/35">
                {option.description}
              </p>
              <p className="mt-5 text-[11px] text-white/55">
                {option.uploads} inspection{option.uploads === 1 ? '' : 's'}/day ·{' '}
                {option.removals
                  ? `${option.removals} privacy cleans/day`
                  : 'inspection only'}
              </p>
              {id !== 'free' ? (
                <Button
                  disabled
                  className="mt-5 w-full rounded-xl bg-white/10 text-white/45"
                >
                  Payments coming soon
                </Button>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

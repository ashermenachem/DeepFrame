'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Database,
  Eye,
  FileImage,
  HardDrive,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeepFrameLogo } from '@/components/deepframe-logo';
import { AdminAssetActions } from '@/components/admin-asset-actions';
import { createClient } from '@/lib/supabase/client';
import { formatBytes } from '@/lib/photo-inspector';
import type { AccountProfile } from '@/lib/account';

type EventRow = {
  id: number;
  user_id: string;
  event_type: string;
  created_at: string;
  event_data: Record<string, unknown>;
};
type DeletionRow = {
  id: string;
  user_id: string;
  scope: string;
  status: string;
  requested_at: string;
};
type AdminAction = {
  id: number;
  admin_user_id: string;
  target_user_id: string | null;
  action_type: string;
  created_at: string;
};
export type AdminMetrics = {
  accounts_total: number;
  active_accounts: number;
  banned_accounts: number;
  admin_accounts: number;
  free_accounts: number;
  pro_accounts: number;
  studio_accounts: number;
  inspections_total: number;
  completed_inspections: number;
  failed_inspections: number;
  inspections_today: number;
  inspections_7d: number;
  metadata_fields_total: number;
  originals_stored: number;
  cleaned_files_stored: number;
  stored_source_bytes: number;
  events_today: number;
  pending_deletions: number;
};
export type InspectionRow = {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  status: string;
  detected_type: string | null;
  metadata_field_count: number;
  storage_path: string | null;
  cleaned_storage_path: string | null;
  created_at: string;
};

export function AdminDashboard({
  users,
  events,
  deletionRequests,
  adminActions,
  metrics,
  recentInspections,
}: {
  users: AccountProfile[];
  events: EventRow[];
  deletionRequests: DeletionRow[];
  adminActions: AdminAction[];
  metrics: AdminMetrics;
  recentInspections: InspectionRow[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.username.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'all' || user.account_status === statusFilter;
      const matchesPlan = planFilter === 'all' || user.plan === planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [planFilter, search, statusFilter, users]);

  const act = async (userId: string, action: string, value?: string) => {
    setBusyId(userId);
    const { error } = await supabase.rpc('admin_update_user', {
      p_target_user_id: userId,
      p_action: action,
      p_value: value ?? null,
    });
    setMessage(error ? error.message : 'Admin action completed and logged.');
    setBusyId(null);
    if (!error) router.refresh();
  };

  const permanentlyDelete = async (userId: string, username: string) => {
    if (
      !window.confirm(
        `Permanently delete ${username}, all reports, and all stored photos? This cannot be undone.`,
      )
    )
      return;
    setBusyId(userId);
    const { error } = await supabase.functions.invoke('admin-delete-user', {
      body: { targetUserId: userId },
    });
    setMessage(
      error
        ? error.message
        : 'Account and stored data permanently deleted. The action was audited.',
    );
    setBusyId(null);
    if (!error) router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#03040a] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <DeepFrameLogo />
          <Link href="/profile">
            <Button
              variant="outline"
              className="rounded-full border-white/10 bg-white/[0.035]"
            >
              <ArrowLeft className="size-4" /> Profile
            </Button>
          </Link>
        </header>
        <section className="mt-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-100/15 bg-violet-100/[0.05] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-violet-100/70">
            <ShieldCheck className="size-3" /> Restricted administrator console
          </div>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">
            Control, with accountability.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/40">
            Manage access, plans, roles, safety incidents, and privacy requests.
            Every change is written to the admin audit log.
          </p>
        </section>
        {message ? (
          <p
            role="status"
            className="mt-5 rounded-xl border border-cyan-100/10 bg-cyan-100/[0.04] px-4 py-3 text-sm text-cyan-50/70"
          >
            {message}
          </p>
        ) : null}

        <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="glass-panel rounded-2xl p-5">
            <Users className="size-5 text-cyan-200/70" />
            <p className="mt-4 text-3xl font-semibold">
              {metrics.accounts_total}
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
              total accounts
            </p>
            <p className="mt-2 text-[9px] text-white/25">
              {metrics.active_accounts} active · {metrics.admin_accounts} admins
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <Activity className="size-5 text-violet-200/70" />
            <p className="mt-4 text-3xl font-semibold">
              {metrics.inspections_today}
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
              inspections today
            </p>
            <p className="mt-2 text-[9px] text-white/25">
              {metrics.inspections_7d} during the last 7 days
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <CheckCircle2 className="size-5 text-emerald-200/70" />
            <p className="mt-4 text-3xl font-semibold">
              {metrics.completed_inspections}
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
              completed
            </p>
            <p className="mt-2 text-[9px] text-white/25">
              {metrics.metadata_fields_total.toLocaleString()} fields found
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <XCircle className="size-5 text-red-200/70" />
            <p className="mt-4 text-3xl font-semibold">
              {metrics.failed_inspections}
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
              failed
            </p>
            <p className="mt-2 text-[9px] text-white/25">
              {metrics.inspections_total} total attempts
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <HardDrive className="size-5 text-blue-200/70" />
            <p className="mt-4 text-3xl font-semibold">
              {metrics.originals_stored}
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
              originals stored
            </p>
            <p className="mt-2 text-[9px] text-white/25">
              {formatBytes(metrics.stored_source_bytes)} recorded
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <Database className="size-5 text-amber-200/70" />
            <p className="mt-4 text-3xl font-semibold">
              {metrics.pending_deletions}
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
              privacy requests
            </p>
            <p className="mt-2 text-[9px] text-white/25">
              {metrics.events_today} events today
            </p>
          </div>
        </section>

        <section className="glass-panel mt-5 overflow-hidden rounded-[2rem]">
          <div className="border-b border-white/[0.07] p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <FileImage className="size-5 text-cyan-200/70" /> Recent uploads
            </h2>
            <p className="mt-2 text-xs text-white/35">
              Original files stay private. Viewing or downloading one is
              restricted to admins and written to the audit log.
            </p>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {recentInspections.length ? (
              recentInspections.map((inspection) => {
                const owner = usersById.get(inspection.user_id);
                return (
                  <div
                    key={inspection.id}
                    className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-white/75">
                          {inspection.file_name}
                        </p>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] text-white/35">
                          {inspection.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[9px] text-white/28">
                        {owner?.username ?? inspection.user_id} ·{' '}
                        {formatBytes(inspection.file_size)} ·{' '}
                        {inspection.metadata_field_count} fields ·{' '}
                        {new Date(inspection.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <AdminAssetActions
                        inspectionId={inspection.id}
                        hasOriginal={Boolean(inspection.storage_path)}
                        hasCleaned={Boolean(inspection.cleaned_storage_path)}
                      />
                      <Link href={`/admin/users/${inspection.user_id}`}>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-lg border-white/10 bg-white/[0.025] text-white/60"
                        >
                          <Eye className="size-3.5" /> Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="px-6 py-10 text-center text-xs text-white/30">
                No uploads yet.
              </p>
            )}
          </div>
        </section>

        <section className="glass-panel mt-5 overflow-hidden rounded-[2rem]">
          <div className="border-b border-white/[0.07] p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <UserCog className="size-5 text-cyan-200/70" /> Accounts
                </h2>
                <p className="mt-2 text-xs text-white/35">
                  Profiles are private and searchable only inside this admin
                  console.
                </p>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/25">
                Showing {filteredUsers.length} of {users.length}
              </p>
            </div>
            <div className="mt-5 grid gap-2 md:grid-cols-[1fr_150px_150px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
                <Input
                  aria-label="Search accounts"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search username, email, or account ID"
                  className="h-11 border-white/10 bg-black/20 pl-10"
                />
              </div>
              <select
                aria-label="Filter accounts by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-[#0b0d14] px-3 text-xs text-white/65"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
                <option value="deletion_pending">Deletion pending</option>
              </select>
              <select
                aria-label="Filter accounts by plan"
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-[#0b0d14] px-3 text-xs text-white/65"
              >
                <option value="all">All plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="studio">Studio</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="bg-white/[0.025] text-[9px] uppercase tracking-[0.14em] text-white/30">
                <tr>
                  <th className="px-6 py-4">Account</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Plan</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white/75">
                        {user.username}
                      </p>
                      <p className="mt-1 text-[10px] text-white/28">
                        {user.email ?? user.id}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-white/50">
                      {user.account_status}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        aria-label={`Plan for ${user.username}`}
                        value={user.plan}
                        disabled={busyId === user.id}
                        onChange={(event) =>
                          void act(user.id, 'set_plan', event.target.value)
                        }
                        className="rounded-lg border border-white/10 bg-[#0b0d14] px-2 py-1.5 text-white/65"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="studio">Studio</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        aria-label={`Role for ${user.username}`}
                        value={user.role}
                        disabled={busyId === user.id}
                        onChange={(event) =>
                          void act(user.id, 'set_role', event.target.value)
                        }
                        className="rounded-lg border border-white/10 bg-[#0b0d14] px-2 py-1.5 text-white/65"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-white/10 bg-white/[0.025] text-white/60"
                          >
                            <Eye className="size-3.5" /> Review
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          disabled={busyId === user.id}
                          variant="outline"
                          onClick={() =>
                            void act(
                              user.id,
                              user.account_status === 'banned'
                                ? 'unban'
                                : 'ban',
                            )
                          }
                          className="rounded-lg border-red-100/10 bg-red-100/[0.025] text-red-100/65"
                        >
                          <Ban className="size-3.5" />{' '}
                          {user.account_status === 'banned' ? 'Unban' : 'Ban'}
                        </Button>
                        <Button
                          aria-label={`Permanently delete ${user.username}`}
                          size="sm"
                          disabled={busyId === user.id || user.role === 'admin'}
                          variant="outline"
                          onClick={() =>
                            void permanentlyDelete(user.id, user.username)
                          }
                          className="rounded-lg border-red-100/10 bg-red-100/[0.025] text-red-100/65"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredUsers.length ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-xs text-white/30"
                    >
                      No accounts match those filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {deletionRequests.length ? (
          <section className="glass-panel mt-5 rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold">Privacy requests</h2>
            <div className="mt-4 space-y-2">
              {deletionRequests.map((request) => {
                const account = users.find(
                  (user) => user.id === request.user_id,
                );
                return (
                  <div
                    key={request.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <p className="text-xs text-white/65">
                        {account?.username ?? request.user_id}
                      </p>
                      <p className="mt-1 text-[9px] text-white/28">
                        {request.scope} deletion · {request.status} ·{' '}
                        {new Date(request.requested_at).toLocaleString()}
                      </p>
                    </div>
                    {request.status === 'pending' && account ? (
                      <Button
                        disabled={busyId === account.id}
                        onClick={() =>
                          void permanentlyDelete(account.id, account.username)
                        }
                        variant="outline"
                        className="rounded-lg border-red-100/12 bg-red-100/[0.03] text-red-100/70"
                      >
                        <Trash2 className="size-3.5" /> Approve permanent
                        deletion
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="glass-panel rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold">
              Security and product events
            </h2>
            <div className="mt-4 max-h-[420px] space-y-2 overflow-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-mono text-[9px] text-cyan-100/65">
                      {event.event_type}
                    </span>
                    <time className="text-[9px] text-white/25">
                      {new Date(event.created_at).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-1 truncate text-[10px] text-white/28">
                    User {event.user_id}
                  </p>
                </div>
              ))}
            </div>
          </article>
          <article className="glass-panel rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold">Admin audit log</h2>
            <div className="mt-4 max-h-[420px] space-y-2 overflow-auto">
              {adminActions.length ? (
                adminActions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex justify-between gap-3">
                      <span className="font-mono text-[9px] text-violet-100/65">
                        {action.action_type}
                      </span>
                      <time className="text-[9px] text-white/25">
                        {new Date(action.created_at).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-1 truncate text-[10px] text-white/28">
                      Target {action.target_user_id ?? 'removed account'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/30">
                  No administrative changes yet.
                </p>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

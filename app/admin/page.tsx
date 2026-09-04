import { redirect } from 'next/navigation';
import {
  AdminDashboard,
  type AdminMetrics,
  type InspectionRow,
} from '@/components/admin-dashboard';
import { createClient } from '@/lib/supabase/server';

const emptyMetrics: AdminMetrics = {
  accounts_total: 0,
  active_accounts: 0,
  banned_accounts: 0,
  admin_accounts: 0,
  free_accounts: 0,
  pro_accounts: 0,
  studio_accounts: 0,
  inspections_total: 0,
  completed_inspections: 0,
  failed_inspections: 0,
  inspections_today: 0,
  inspections_7d: 0,
  metadata_fields_total: 0,
  originals_stored: 0,
  cleaned_files_stored: 0,
  stored_source_bytes: 0,
  events_today: 0,
  pending_deletions: 0,
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect('/login');

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();
  if (
    !currentProfile ||
    currentProfile.role !== 'admin' ||
    currentProfile.account_status !== 'active'
  )
    redirect('/profile');

  const [users, events, requests, actions, metrics, inspections] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('activity_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('deletion_requests')
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(100),
      supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.rpc('admin_dashboard_metrics'),
      supabase
        .from('inspections')
        .select(
          'id,user_id,file_name,file_size,status,detected_type,metadata_field_count,storage_path,cleaned_storage_path,created_at',
        )
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

  return (
    <AdminDashboard
      users={users.data ?? []}
      events={events.data ?? []}
      deletionRequests={requests.data ?? []}
      adminActions={actions.data ?? []}
      metrics={(metrics.data as AdminMetrics | null) ?? emptyMetrics}
      recentInspections={(inspections.data as InspectionRow[] | null) ?? []}
    />
  );
}

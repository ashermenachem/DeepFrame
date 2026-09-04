import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin-dashboard';
import { createClient } from '@/lib/supabase/server';

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

  const [users, events, requests, actions] = await Promise.all([
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
  ]);

  return (
    <AdminDashboard
      users={users.data ?? []}
      events={events.data ?? []}
      deletionRequests={requests.data ?? []}
      adminActions={actions.data ?? []}
    />
  );
}

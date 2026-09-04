import { notFound, redirect } from 'next/navigation';
import { AdminUserDashboard } from '@/components/admin-user-dashboard';
import { createClient } from '@/lib/supabase/server';

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect('/login');
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role,account_status')
    .eq('id', authData.user.id)
    .single();
  if (
    currentProfile?.role !== 'admin' ||
    currentProfile.account_status !== 'active'
  )
    redirect('/profile');

  const [profile, inspections, events, usage] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('inspections')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('activity_events')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('usage_daily')
      .select('*')
      .eq('user_id', id)
      .order('usage_date', { ascending: false })
      .limit(30),
  ]);
  if (!profile.data) notFound();
  return (
    <AdminUserDashboard
      profile={profile.data}
      inspections={inspections.data ?? []}
      events={events.data ?? []}
      usage={usage.data ?? []}
    />
  );
}

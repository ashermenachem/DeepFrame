import { redirect } from 'next/navigation';
import { ProfileDashboard } from '@/components/profile-dashboard';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect('/login');

  const today = new Date().toISOString().slice(0, 10);
  const [profileResult, historyResult, usageResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', authData.user.id).single(),
    supabase
      .from('inspections')
      .select('id,file_name,file_size,detected_type,metadata_field_count,status,created_at,privacy_cleaned_at,hidden_from_history_at')
      .is('hidden_from_history_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('usage_daily').select('*').eq('usage_date', today).maybeSingle(),
  ]);

  if (!profileResult.data) redirect('/login');
  return (
    <ProfileDashboard
      profile={profileResult.data}
      history={historyResult.data ?? []}
      usage={usageResult.data}
    />
  );
}

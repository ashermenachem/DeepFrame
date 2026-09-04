import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.115.0';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'AUTH_REQUIRED' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'SERVER_CONFIG_ERROR' }, 500);
  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authorization.slice(7);
  const { data: authData, error: authError } = await service.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'AUTH_REQUIRED' }, 401);
  const adminId = authData.user.id;
  const { data: admin } = await service
    .from('profiles')
    .select('role,account_status')
    .eq('id', adminId)
    .single();
  if (admin?.role !== 'admin' || admin.account_status !== 'active') {
    return json({ error: 'ADMIN_REQUIRED' }, 403);
  }

  const body = (await request.json().catch(() => null)) as { targetUserId?: string } | null;
  const targetUserId = body?.targetUserId;
  if (!targetUserId) return json({ error: 'TARGET_REQUIRED' }, 400);
  if (targetUserId === adminId) return json({ error: 'CANNOT_DELETE_SELF' }, 400);

  const { data: target } = await service
    .from('profiles')
    .select('id,account_status')
    .eq('id', targetUserId)
    .single();
  if (!target) return json({ error: 'USER_NOT_FOUND' }, 404);

  const { data: inspections } = await service
    .from('inspections')
    .select('storage_path,cleaned_storage_path')
    .eq('user_id', targetUserId);
  const sourcePaths = (inspections ?? [])
    .map((item) => item.storage_path)
    .filter((value): value is string => Boolean(value));
  const cleanedPaths = (inspections ?? [])
    .map((item) => item.cleaned_storage_path)
    .filter((value): value is string => Boolean(value));

  if (sourcePaths.length) {
    const { error } = await service.storage.from('source-photos').remove(sourcePaths);
    if (error) return json({ error: 'SOURCE_FILE_DELETE_FAILED' }, 500);
  }
  if (cleanedPaths.length) {
    const { error } = await service.storage.from('cleaned-photos').remove(cleanedPaths);
    if (error) return json({ error: 'CLEANED_FILE_DELETE_FAILED' }, 500);
  }

  await service.from('admin_actions').insert({
    admin_user_id: adminId,
    target_user_id: targetUserId,
    action_type: 'delete_account',
    action_data: {
      previous_status: target.account_status,
      source_files_removed: sourcePaths.length,
      cleaned_files_removed: cleanedPaths.length,
    },
  });
  const { error: deleteError } = await service.auth.admin.deleteUser(targetUserId);
  if (deleteError) return json({ error: deleteError.message }, 500);
  return json({ success: true });
});

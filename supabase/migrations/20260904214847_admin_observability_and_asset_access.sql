create or replace function public.record_inspection_source(
  p_inspection_id uuid,
  p_storage_path text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_storage_path is null or p_storage_path = '' then
    raise exception 'SOURCE_PATH_REQUIRED';
  end if;
  if split_part(p_storage_path, '/', 1) <> auth.uid()::text then
    raise exception 'SOURCE_PATH_INVALID';
  end if;

  update public.inspections
  set storage_path = p_storage_path
  where id = p_inspection_id
    and user_id = auth.uid()
    and status = 'processing';
  if not found then raise exception 'INSPECTION_NOT_FOUND'; end if;

  insert into public.activity_events (
    user_id,
    inspection_id,
    event_type,
    event_data
  ) values (
    auth.uid(),
    p_inspection_id,
    'source_photo_stored',
    jsonb_build_object('bucket', 'source-photos')
  );
end;
$$;

create or replace function public.admin_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;

  return jsonb_build_object(
    'accounts_total', (select count(*) from public.profiles),
    'active_accounts', (select count(*) from public.profiles where account_status = 'active'),
    'banned_accounts', (select count(*) from public.profiles where account_status = 'banned'),
    'admin_accounts', (select count(*) from public.profiles where role = 'admin'),
    'free_accounts', (select count(*) from public.profiles where plan = 'free'),
    'pro_accounts', (select count(*) from public.profiles where plan = 'pro'),
    'studio_accounts', (select count(*) from public.profiles where plan = 'studio'),
    'inspections_total', (select count(*) from public.inspections),
    'completed_inspections', (select count(*) from public.inspections where status = 'complete'),
    'failed_inspections', (select count(*) from public.inspections where status = 'failed'),
    'inspections_today', (select count(*) from public.inspections where created_at >= current_date),
    'inspections_7d', (select count(*) from public.inspections where created_at >= now() - interval '7 days'),
    'metadata_fields_total', (select coalesce(sum(metadata_field_count), 0) from public.inspections),
    'originals_stored', (select count(*) from public.inspections where storage_path is not null),
    'cleaned_files_stored', (select count(*) from public.inspections where cleaned_storage_path is not null),
    'stored_source_bytes', (select coalesce(sum(file_size), 0) from public.inspections where storage_path is not null),
    'events_today', (select count(*) from public.activity_events where created_at >= current_date),
    'pending_deletions', (select count(*) from public.deletion_requests where status = 'pending')
  );
end;
$$;

create or replace function public.admin_get_inspection_asset(
  p_inspection_id uuid,
  p_asset_kind text
)
returns table (
  bucket_name text,
  storage_path text,
  download_name text,
  mime_type text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset_path text;
  original_name text;
  original_mime text;
  owner_id uuid;
begin
  if not private.is_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  if p_asset_kind not in ('original', 'cleaned') then
    raise exception 'ASSET_KIND_INVALID';
  end if;

  select
    case when p_asset_kind = 'original' then i.storage_path else i.cleaned_storage_path end,
    i.file_name,
    i.mime_type,
    i.user_id
  into asset_path, original_name, original_mime, owner_id
  from public.inspections i
  where i.id = p_inspection_id;

  if owner_id is null then raise exception 'INSPECTION_NOT_FOUND'; end if;
  if asset_path is null then raise exception 'ASSET_UNAVAILABLE'; end if;

  insert into public.admin_actions (
    admin_user_id,
    target_user_id,
    action_type,
    action_data
  ) values (
    auth.uid(),
    owner_id,
    'inspection_asset_accessed',
    jsonb_build_object(
      'inspection_id', p_inspection_id,
      'asset_kind', p_asset_kind,
      'file_name', original_name
    )
  );

  return query select
    case when p_asset_kind = 'original' then 'source-photos' else 'cleaned-photos' end,
    asset_path,
    case
      when p_asset_kind = 'original' then original_name
      else regexp_replace(asset_path, '^.*/', '')
    end,
    original_mime;
end;
$$;

create or replace function public.admin_update_user(
  p_target_user_id uuid,
  p_action text,
  p_value text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_value text;
begin
  if not private.is_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  if not exists (select 1 from public.profiles where id = p_target_user_id) then
    raise exception 'USER_NOT_FOUND';
  end if;
  if p_target_user_id = auth.uid() and p_action in ('ban', 'set_role') then
    raise exception 'CANNOT_RESTRICT_SELF';
  end if;

  if p_action = 'ban' then
    select account_status into old_value from public.profiles where id = p_target_user_id;
    update public.profiles set account_status = 'banned', updated_at = now() where id = p_target_user_id;
  elsif p_action = 'unban' then
    select account_status into old_value from public.profiles where id = p_target_user_id;
    update public.profiles set account_status = 'active', updated_at = now() where id = p_target_user_id;
  elsif p_action = 'set_plan' and p_value in ('free', 'pro', 'studio') then
    select plan into old_value from public.profiles where id = p_target_user_id;
    update public.profiles set plan = p_value, updated_at = now() where id = p_target_user_id;
  elsif p_action = 'set_role' and p_value in ('user', 'admin') then
    select role into old_value from public.profiles where id = p_target_user_id;
    update public.profiles set role = p_value, updated_at = now() where id = p_target_user_id;
  elsif p_action = 'set_username' then
    if p_value is null or lower(trim(p_value)) !~ '^[a-z0-9][a-z0-9_-]{2,29}$' then
      raise exception 'USERNAME_INVALID';
    end if;
    select username into old_value from public.profiles where id = p_target_user_id;
    update public.profiles set username = lower(trim(p_value)), updated_at = now() where id = p_target_user_id;
  elsif p_action = 'reset_usage' then
    select concat(inspections_count, '/', removals_count)
      into old_value
    from public.usage_daily
    where user_id = p_target_user_id and usage_date = current_date;
    delete from public.usage_daily
    where user_id = p_target_user_id and usage_date = current_date;
    old_value := coalesce(old_value, '0/0');
  else
    raise exception 'ADMIN_ACTION_INVALID';
  end if;

  insert into public.admin_actions (
    admin_user_id,
    target_user_id,
    action_type,
    action_data
  ) values (
    auth.uid(),
    p_target_user_id,
    p_action,
    jsonb_build_object('old_value', old_value, 'new_value', p_value)
  );
exception
  when unique_violation then raise exception 'USERNAME_TAKEN';
end;
$$;

revoke all on function public.record_inspection_source(uuid, text) from public, anon;
revoke all on function public.admin_dashboard_metrics() from public, anon;
revoke all on function public.admin_get_inspection_asset(uuid, text) from public, anon;
revoke all on function public.admin_update_user(uuid, text, text) from public, anon;

grant execute on function public.record_inspection_source(uuid, text) to authenticated;
grant execute on function public.admin_dashboard_metrics() to authenticated;
grant execute on function public.admin_get_inspection_asset(uuid, text) to authenticated;
grant execute on function public.admin_update_user(uuid, text, text) to authenticated;

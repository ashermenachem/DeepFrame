create unique index deletion_requests_one_open_per_user_idx
on public.deletion_requests(user_id)
where status in ('pending', 'processing');

create or replace function public.log_activity(p_event_type text, p_inspection_id uuid default null, p_event_data jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_event_type not in ('report_viewed', 'report_shared', 'report_exported', 'upgrade_viewed', 'profile_viewed', 'signed_out') then
    raise exception 'EVENT_NOT_ALLOWED';
  end if;
  if length(p_event_data::text) > 4000 then raise exception 'EVENT_TOO_LARGE'; end if;
  if p_inspection_id is not null and not exists (
    select 1 from public.inspections
    where id = p_inspection_id
      and (user_id = auth.uid() or private.is_admin(auth.uid()))
  ) then
    raise exception 'INSPECTION_NOT_FOUND';
  end if;
  insert into public.activity_events(user_id, inspection_id, event_type, event_data)
  values (auth.uid(), p_inspection_id, p_event_type, p_event_data);
end;
$$;

create or replace function public.admin_update_user(p_target_user_id uuid, p_action text, p_value text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare old_value text;
begin
  if not private.is_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
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
  else
    raise exception 'ADMIN_ACTION_INVALID';
  end if;

  if not found then raise exception 'USER_NOT_FOUND'; end if;
  insert into public.admin_actions(admin_user_id, target_user_id, action_type, action_data)
  values (auth.uid(), p_target_user_id, p_action, jsonb_build_object('old_value', old_value, 'new_value', p_value));
end;
$$;

revoke all on function public.log_activity(text, uuid, jsonb) from public, anon;
revoke all on function public.admin_update_user(uuid, text, text) from public, anon;
grant execute on function public.log_activity(text, uuid, jsonb) to authenticated;
grant execute on function public.admin_update_user(uuid, text, text) to authenticated;

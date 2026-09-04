create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text,
  auth_provider text not null default 'email',
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'pro', 'studio')),
  account_status text not null default 'active' check (account_status in ('active', 'banned', 'deletion_pending')),
  terms_version text,
  terms_accepted_at timestamptz,
  privacy_version text,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_size bigint not null check (file_size >= 0),
  mime_type text,
  detected_type text,
  storage_path text,
  report jsonb,
  metadata_field_count integer not null default 0,
  sha256 text,
  status text not null default 'processing' check (status in ('processing', 'complete', 'failed')),
  failure_reason text,
  privacy_cleaned_at timestamptz,
  cleaned_storage_path text,
  hidden_from_history_at timestamptz,
  source_retention_until timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index inspections_user_created_idx on public.inspections(user_id, created_at desc);
create index inspections_retention_idx on public.inspections(source_retention_until) where storage_path is not null;

create table public.usage_daily (
  user_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null default current_date,
  inspections_count integer not null default 0 check (inspections_count >= 0),
  removals_count integer not null default 0 check (removals_count >= 0),
  primary key (user_id, usage_date)
);

create table public.activity_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  inspection_id uuid references public.inspections(id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  retain_until timestamptz not null default (now() + interval '180 days')
);

create index activity_events_user_created_idx on public.activity_events(user_id, created_at desc);
create index activity_events_retention_idx on public.activity_events(retain_until);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null default 'account' check (scope in ('account', 'history', 'upload')),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'denied')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  admin_note text
);

create index deletion_requests_status_idx on public.deletion_requests(status, requested_at);

create table public.admin_actions (
  id bigint generated always as identity primary key,
  admin_user_id uuid not null references public.profiles(id) on delete restrict,
  target_user_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  action_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role = 'admin'
      and account_status = 'active'
  );
$$;

revoke all on function private.is_admin(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin(uuid) to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  username_base text;
begin
  username_base := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'member'),
    '[^a-zA-Z0-9_]+', '-', 'g'
  ));
  username_base := trim(both '-' from username_base);
  if char_length(username_base) < 3 then
    username_base := 'member';
  end if;

  insert into public.profiles (id, username, email, auth_provider)
  values (
    new.id,
    left(username_base, 21) || '-' || left(new.id::text, 8),
    new.email,
    coalesce(new.raw_app_meta_data ->> 'provider', 'email')
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function public.accept_legal(p_terms_version text, p_privacy_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  update public.profiles
  set terms_version = p_terms_version,
      terms_accepted_at = now(),
      privacy_version = p_privacy_version,
      privacy_accepted_at = now(),
      updated_at = now()
  where id = auth.uid() and account_status = 'active';
  if not found then
    raise exception 'ACCOUNT_UNAVAILABLE';
  end if;
end;
$$;

create or replace function public.set_username(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := lower(trim(p_username));
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if normalized !~ '^[a-z0-9][a-z0-9_-]{2,29}$' then
    raise exception 'USERNAME_INVALID';
  end if;
  update public.profiles
  set username = normalized, updated_at = now()
  where id = auth.uid() and account_status = 'active';
  return normalized;
exception
  when unique_violation then raise exception 'USERNAME_TAKEN';
end;
$$;

create or replace function public.consume_inspection(
  p_file_name text,
  p_file_size bigint,
  p_mime_type text
)
returns table (inspection_id uuid, daily_limit integer, used_today integer, remaining integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles%rowtype;
  limit_value integer;
  next_count integer;
  new_inspection_id uuid;
begin
  select * into current_profile from public.profiles where id = auth.uid() for update;
  if current_profile.id is null then raise exception 'AUTH_REQUIRED'; end if;
  if current_profile.account_status <> 'active' then raise exception 'ACCOUNT_UNAVAILABLE'; end if;

  limit_value := case current_profile.plan
    when 'free' then 1
    when 'pro' then 25
    when 'studio' then 250
    else 1
  end;

  insert into public.usage_daily(user_id, usage_date, inspections_count)
  values (current_profile.id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set inspections_count = public.usage_daily.inspections_count + 1
  returning inspections_count into next_count;

  if current_profile.role <> 'admin' and next_count > limit_value then
    raise exception 'DAILY_LIMIT_REACHED';
  end if;

  insert into public.inspections(user_id, file_name, file_size, mime_type)
  values (current_profile.id, left(p_file_name, 255), p_file_size, left(p_mime_type, 120))
  returning id into new_inspection_id;

  insert into public.activity_events(user_id, inspection_id, event_type, event_data)
  values (current_profile.id, new_inspection_id, 'inspection_started', jsonb_build_object('file_size', p_file_size, 'mime_type', p_mime_type));

  return query select new_inspection_id, limit_value, next_count,
    case when current_profile.role = 'admin' then 2147483647 else greatest(limit_value - next_count, 0) end;
end;
$$;

create or replace function public.complete_inspection(
  p_inspection_id uuid,
  p_storage_path text,
  p_detected_type text,
  p_report jsonb,
  p_field_count integer,
  p_sha256 text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.inspections
  set storage_path = p_storage_path,
      detected_type = left(p_detected_type, 120),
      report = p_report,
      metadata_field_count = greatest(p_field_count, 0),
      sha256 = p_sha256,
      status = 'complete',
      completed_at = now()
  where id = p_inspection_id and user_id = auth.uid() and status = 'processing';
  if not found then raise exception 'INSPECTION_NOT_FOUND'; end if;

  insert into public.activity_events(user_id, inspection_id, event_type, event_data)
  values (auth.uid(), p_inspection_id, 'inspection_completed', jsonb_build_object('field_count', p_field_count, 'detected_type', p_detected_type));
end;
$$;

create or replace function public.fail_inspection(p_inspection_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.inspections
  set status = 'failed', failure_reason = left(p_reason, 500), completed_at = now()
  where id = p_inspection_id and user_id = auth.uid() and status = 'processing';
end;
$$;

create or replace function public.consume_metadata_removal(p_inspection_id uuid)
returns table (daily_limit integer, used_today integer, remaining integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles%rowtype;
  limit_value integer;
  next_count integer;
begin
  select * into current_profile from public.profiles where id = auth.uid() for update;
  if current_profile.id is null then raise exception 'AUTH_REQUIRED'; end if;
  if current_profile.account_status <> 'active' then raise exception 'ACCOUNT_UNAVAILABLE'; end if;
  if current_profile.role <> 'admin' and current_profile.plan = 'free' then
    raise exception 'UPGRADE_REQUIRED';
  end if;
  if not exists (select 1 from public.inspections where id = p_inspection_id and user_id = current_profile.id and status = 'complete') then
    raise exception 'INSPECTION_NOT_FOUND';
  end if;

  limit_value := case current_profile.plan when 'pro' then 10 when 'studio' then 100 else 0 end;
  insert into public.usage_daily(user_id, usage_date, removals_count)
  values (current_profile.id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set removals_count = public.usage_daily.removals_count + 1
  returning removals_count into next_count;

  if current_profile.role <> 'admin' and next_count > limit_value then
    raise exception 'REMOVAL_LIMIT_REACHED';
  end if;

  insert into public.activity_events(user_id, inspection_id, event_type)
  values (current_profile.id, p_inspection_id, 'metadata_removal_started');

  return query select limit_value, next_count,
    case when current_profile.role = 'admin' then 2147483647 else greatest(limit_value - next_count, 0) end;
end;
$$;

create or replace function public.complete_metadata_removal(p_inspection_id uuid, p_cleaned_storage_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.inspections
  set privacy_cleaned_at = now(), cleaned_storage_path = p_cleaned_storage_path
  where id = p_inspection_id and user_id = auth.uid();
  if not found then raise exception 'INSPECTION_NOT_FOUND'; end if;
  insert into public.activity_events(user_id, inspection_id, event_type)
  values (auth.uid(), p_inspection_id, 'metadata_removal_completed');
end;
$$;

create or replace function public.hide_inspection(p_inspection_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.inspections set hidden_from_history_at = now()
  where id = p_inspection_id and user_id = auth.uid();
  if not found then raise exception 'INSPECTION_NOT_FOUND'; end if;
  insert into public.activity_events(user_id, inspection_id, event_type)
  values (auth.uid(), p_inspection_id, 'history_item_hidden');
end;
$$;

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
  insert into public.activity_events(user_id, inspection_id, event_type, event_data)
  values (auth.uid(), p_inspection_id, p_event_type, p_event_data);
end;
$$;

create or replace function public.request_account_deletion(p_reason text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare request_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.deletion_requests(user_id, reason)
  values (auth.uid(), left(p_reason, 1000))
  returning id into request_id;
  update public.profiles set account_status = 'deletion_pending', updated_at = now() where id = auth.uid();
  insert into public.activity_events(user_id, event_type) values (auth.uid(), 'account_deletion_requested');
  return request_id;
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

  if p_action = 'ban' then
    update public.profiles set account_status = 'banned', updated_at = now() where id = p_target_user_id returning 'active' into old_value;
  elsif p_action = 'unban' then
    update public.profiles set account_status = 'active', updated_at = now() where id = p_target_user_id returning 'banned' into old_value;
  elsif p_action = 'set_plan' and p_value in ('free', 'pro', 'studio') then
    select plan into old_value from public.profiles where id = p_target_user_id;
    update public.profiles set plan = p_value, updated_at = now() where id = p_target_user_id;
  elsif p_action = 'set_role' and p_value in ('user', 'admin') then
    if p_target_user_id = auth.uid() and p_value = 'user' then raise exception 'CANNOT_DEMOTE_SELF'; end if;
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

alter table public.profiles enable row level security;
alter table public.inspections enable row level security;
alter table public.usage_daily enable row level security;
alter table public.activity_events enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.admin_actions enable row level security;

create policy profiles_select_own_or_admin on public.profiles for select to authenticated
using ((select auth.uid()) = id or private.is_admin((select auth.uid())));
create policy inspections_select_own_or_admin on public.inspections for select to authenticated
using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
create policy usage_select_own_or_admin on public.usage_daily for select to authenticated
using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
create policy events_select_own_or_admin on public.activity_events for select to authenticated
using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
create policy deletion_requests_select_own_or_admin on public.deletion_requests for select to authenticated
using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
create policy admin_actions_select_admin on public.admin_actions for select to authenticated
using (private.is_admin((select auth.uid())));

revoke all on public.profiles, public.inspections, public.usage_daily, public.activity_events, public.deletion_requests, public.admin_actions from anon, authenticated;
grant select on public.profiles, public.inspections, public.usage_daily, public.activity_events, public.deletion_requests, public.admin_actions to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke all on function public.accept_legal(text, text) from public;
revoke all on function public.set_username(text) from public;
revoke all on function public.consume_inspection(text, bigint, text) from public;
revoke all on function public.complete_inspection(uuid, text, text, jsonb, integer, text) from public;
revoke all on function public.fail_inspection(uuid, text) from public;
revoke all on function public.consume_metadata_removal(uuid) from public;
revoke all on function public.complete_metadata_removal(uuid, text) from public;
revoke all on function public.hide_inspection(uuid) from public;
revoke all on function public.log_activity(text, uuid, jsonb) from public;
revoke all on function public.request_account_deletion(text) from public;
revoke all on function public.admin_update_user(uuid, text, text) from public;

grant execute on function public.accept_legal(text, text) to authenticated;
grant execute on function public.set_username(text) to authenticated;
grant execute on function public.consume_inspection(text, bigint, text) to authenticated;
grant execute on function public.complete_inspection(uuid, text, text, jsonb, integer, text) to authenticated;
grant execute on function public.fail_inspection(uuid, text) to authenticated;
grant execute on function public.consume_metadata_removal(uuid) to authenticated;
grant execute on function public.complete_metadata_removal(uuid, text) to authenticated;
grant execute on function public.hide_inspection(uuid) to authenticated;
grant execute on function public.log_activity(text, uuid, jsonb) to authenticated;
grant execute on function public.request_account_deletion(text) to authenticated;
grant execute on function public.admin_update_user(uuid, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('source-photos', 'source-photos', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif', 'image/tiff']),
  ('cleaned-photos', 'cleaned-photos', false, 52428800, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy source_photos_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'source-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy source_photos_select_own_or_admin on storage.objects for select to authenticated
using (bucket_id = 'source-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin((select auth.uid()))));
create policy cleaned_photos_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'cleaned-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy cleaned_photos_select_own_or_admin on storage.objects for select to authenticated
using (bucket_id = 'cleaned-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin((select auth.uid()))));

grant select, insert on storage.objects to authenticated;

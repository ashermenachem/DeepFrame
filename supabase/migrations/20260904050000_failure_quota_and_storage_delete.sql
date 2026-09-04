create or replace function public.fail_inspection(p_inspection_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  failed_user_id uuid;
begin
  update public.inspections
  set status = 'failed', failure_reason = left(p_reason, 500), completed_at = now()
  where id = p_inspection_id and user_id = auth.uid() and status = 'processing'
  returning user_id into failed_user_id;

  if failed_user_id is not null then
    update public.usage_daily
    set inspections_count = greatest(inspections_count - 1, 0)
    where user_id = failed_user_id and usage_date = current_date;
  end if;
end;
$$;

revoke all on function public.fail_inspection(uuid, text) from public, anon;
grant execute on function public.fail_inspection(uuid, text) to authenticated;

create policy source_photos_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'source-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy cleaned_photos_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'cleaned-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

grant delete on storage.objects to authenticated;

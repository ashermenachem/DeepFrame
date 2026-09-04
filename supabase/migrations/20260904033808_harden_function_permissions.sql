revoke execute on function public.accept_legal(text, text) from anon;
revoke execute on function public.set_username(text) from anon;
revoke execute on function public.consume_inspection(text, bigint, text) from anon;
revoke execute on function public.complete_inspection(uuid, text, text, jsonb, integer, text) from anon;
revoke execute on function public.fail_inspection(uuid, text) from anon;
revoke execute on function public.consume_metadata_removal(uuid) from anon;
revoke execute on function public.complete_metadata_removal(uuid, text) from anon;
revoke execute on function public.hide_inspection(uuid) from anon;
revoke execute on function public.log_activity(text, uuid, jsonb) from anon;
revoke execute on function public.request_account_deletion(text) from anon;
revoke execute on function public.admin_update_user(uuid, text, text) from anon;

create index activity_events_inspection_idx on public.activity_events(inspection_id) where inspection_id is not null;
create index admin_actions_admin_idx on public.admin_actions(admin_user_id, created_at desc);
create index admin_actions_target_idx on public.admin_actions(target_user_id, created_at desc) where target_user_id is not null;
create index deletion_requests_user_idx on public.deletion_requests(user_id, requested_at desc);

drop index if exists public.inspections_retention_idx;
alter table public.inspections drop column if exists source_retention_until;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'deepframe-prune-expired-activity',
  '17 3 * * *',
  $$delete from public.activity_events where retain_until < now()$$
)
where not exists (
  select 1 from cron.job where jobname = 'deepframe-prune-expired-activity'
);

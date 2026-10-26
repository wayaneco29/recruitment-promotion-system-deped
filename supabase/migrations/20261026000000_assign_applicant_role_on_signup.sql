do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'app_user_role'
  ) then
    create type public.app_user_role as enum (
      'teacher',
      'school_personnel',
      'school_head',
      'psds',
      'division_personnel',
      'evaluation_committee',
      'applicant',
      'super_admin'
    );
  elsif not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'app_user_role'
      and e.enumlabel = 'applicant'
  ) then
    alter type public.app_user_role add value 'applicant';
  end if;
end;
$$;

create or replace function public.handle_new_applicant_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'applicant'::public.app_user_role)
  on conflict (user_id, role, organization_unit_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_applicant_role()
from public, anon, authenticated;

drop trigger if exists on_auth_user_applicant_role_created on auth.users;

create trigger on_auth_user_applicant_role_created
after insert on auth.users
for each row execute function public.handle_new_applicant_role();

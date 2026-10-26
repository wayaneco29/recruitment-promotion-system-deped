alter table public.user_profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata_first_name text := nullif(new.raw_user_meta_data ->> 'first_name', '');
  metadata_last_name text := nullif(new.raw_user_meta_data ->> 'last_name', '');
  metadata_full_name text := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(concat_ws(' ', metadata_first_name, metadata_last_name), '')
  );
begin
  insert into public.user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    full_name
  )
  values (
    new.id,
    new.email,
    metadata_first_name,
    metadata_last_name,
    metadata_full_name
  )
  on conflict (user_id) do update
    set email = excluded.email,
        first_name = coalesce(excluded.first_name, public.user_profiles.first_name),
        last_name = coalesce(excluded.last_name, public.user_profiles.last_name),
        full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
        updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'applicant'::public.app_user_role)
  on conflict (user_id, role, organization_unit_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_applicant_role_created on auth.users;

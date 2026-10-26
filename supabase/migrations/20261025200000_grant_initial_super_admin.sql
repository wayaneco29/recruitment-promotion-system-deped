do $$
declare
  admin_user_id uuid;
begin
  select u.id
  into admin_user_id
  from auth.users u
  where lower(u.email) = 'sdo.8@deped.edu'
  order by u.created_at
  limit 1;

  if admin_user_id is not null then
    insert into public.user_profiles (user_id, email)
    values (admin_user_id, 'sdo.8@deped.edu')
    on conflict (user_id) do update
      set email = excluded.email,
          updated_at = now();

    insert into public.user_roles (user_id, role, organization_unit_id)
    values (
      admin_user_id,
      'super_admin'::public.app_user_role,
      null
    )
    on conflict (user_id, role, organization_unit_id) do nothing;
  end if;
end;
$$;

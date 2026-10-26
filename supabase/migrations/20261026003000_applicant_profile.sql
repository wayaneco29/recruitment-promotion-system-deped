alter table public.user_profiles
  add column if not exists middle_name text,
  add column if not exists name_suffix text,
  add column if not exists phone_number text,
  add column if not exists alternate_phone text,
  add column if not exists residential_address text,
  add column if not exists date_of_birth date,
  add column if not exists sex text,
  add column if not exists current_position text,
  add column if not exists current_school_division text,
  add column if not exists employee_number text;

create or replace function public.update_applicant_profile(
  p_first_name text,
  p_middle_name text,
  p_last_name text,
  p_name_suffix text,
  p_phone_number text,
  p_alternate_phone text,
  p_residential_address text,
  p_date_of_birth date,
  p_sex text,
  p_current_position text,
  p_current_school_division text,
  p_employee_number text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_full_name text;
begin
  if v_user_id is null or not exists (
    select 1
    from public.user_roles ur
    where ur.user_id = v_user_id
      and ur.role = 'applicant'::public.app_user_role
  ) then
    raise exception 'Only authenticated applicants can update applicant profiles.'
      using errcode = '42501';
  end if;

  if nullif(trim(p_first_name), '') is null
    or char_length(trim(p_first_name)) > 100
    or nullif(trim(p_last_name), '') is null
    or char_length(trim(p_last_name)) > 100 then
    raise exception 'First name and last name are required and must be 100 characters or fewer.'
      using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_middle_name, ''))) > 100
    or char_length(trim(coalesce(p_name_suffix, ''))) > 20
    or char_length(trim(coalesce(p_phone_number, ''))) > 50
    or char_length(trim(coalesce(p_alternate_phone, ''))) > 50
    or char_length(trim(coalesce(p_residential_address, ''))) > 1000
    or char_length(trim(coalesce(p_current_position, ''))) > 150
    or char_length(trim(coalesce(p_current_school_division, ''))) > 200
    or char_length(trim(coalesce(p_employee_number, ''))) > 50 then
    raise exception 'One or more profile fields exceed the allowed length.'
      using errcode = '22023';
  end if;

  if p_date_of_birth > current_date then
    raise exception 'Date of birth cannot be in the future.'
      using errcode = '22023';
  end if;

  if p_sex is not null
    and p_sex not in ('Female', 'Male', 'Prefer not to say') then
    raise exception 'Choose a valid sex option.'
      using errcode = '22023';
  end if;

  select auth_user.email
  into v_email
  from auth.users as auth_user
  where auth_user.id = v_user_id;

  v_full_name := concat_ws(
    ' ',
    nullif(trim(p_first_name), ''),
    nullif(trim(p_middle_name), ''),
    nullif(trim(p_last_name), ''),
    nullif(trim(p_name_suffix), '')
  );

  insert into public.user_profiles (
    user_id,
    email,
    first_name,
    middle_name,
    last_name,
    name_suffix,
    full_name,
    phone_number,
    alternate_phone,
    residential_address,
    date_of_birth,
    sex,
    current_position,
    current_school_division,
    employee_number,
    updated_at
  )
  values (
    v_user_id,
    v_email,
    trim(p_first_name),
    nullif(trim(p_middle_name), ''),
    trim(p_last_name),
    nullif(trim(p_name_suffix), ''),
    v_full_name,
    nullif(trim(p_phone_number), ''),
    nullif(trim(p_alternate_phone), ''),
    nullif(trim(p_residential_address), ''),
    p_date_of_birth,
    nullif(p_sex, ''),
    nullif(trim(p_current_position), ''),
    nullif(trim(p_current_school_division), ''),
    nullif(trim(p_employee_number), ''),
    now()
  )
  on conflict (user_id) do update
  set email = excluded.email,
      first_name = excluded.first_name,
      middle_name = excluded.middle_name,
      last_name = excluded.last_name,
      name_suffix = excluded.name_suffix,
      full_name = excluded.full_name,
      phone_number = excluded.phone_number,
      alternate_phone = excluded.alternate_phone,
      residential_address = excluded.residential_address,
      date_of_birth = excluded.date_of_birth,
      sex = excluded.sex,
      current_position = excluded.current_position,
      current_school_division = excluded.current_school_division,
      employee_number = excluded.employee_number,
      updated_at = now();
end;
$$;

revoke all on function public.update_applicant_profile(
  text, text, text, text, text, text, text, date, text, text, text, text
) from public, anon;
grant execute on function public.update_applicant_profile(
  text, text, text, text, text, text, text, date, text, text, text, text
) to authenticated;

alter table public.recruitment_positions
  add column if not exists description text not null default '';

create or replace function public.create_recruitment_position(
  p_organization_unit_id uuid,
  p_cycle_name text,
  p_policy_reference text,
  p_starts_on date,
  p_ends_on date,
  p_title text,
  p_item_number text,
  p_description text,
  p_is_open boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_cycle_id uuid;
  new_position_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required to create a recruitment position';
  end if;

  if not (
    public.is_current_user_super_admin()
    or (
      public.is_user_in_role('division_personnel'::public.app_user_role)
      and public.has_unit_access(p_organization_unit_id)
    )
  ) then
    raise exception 'You are not authorized to create a recruitment position'
      using errcode = '42501';
  end if;

  if p_organization_unit_id is null
    or nullif(trim(p_cycle_name), '') is null
    or char_length(trim(p_cycle_name)) > 150
    or nullif(trim(p_policy_reference), '') is null
    or char_length(trim(p_policy_reference)) > 200
    or nullif(trim(p_title), '') is null
    or char_length(trim(p_title)) > 200
    or char_length(trim(coalesce(p_item_number, ''))) > 100
    or char_length(trim(coalesce(p_description, ''))) > 4000
    or p_starts_on is null
    or p_ends_on is null
    or p_ends_on < p_starts_on then
    raise exception 'Enter a valid position, policy reference, organization, and application date range'
      using errcode = '22023';
  end if;

  insert into public.recruitment_cycles (
    organization_unit_id,
    name,
    policy_reference,
    starts_at,
    ends_at,
    is_open,
    created_by
  )
  values (
    p_organization_unit_id,
    trim(p_cycle_name),
    trim(p_policy_reference),
    p_starts_on::timestamp at time zone 'Asia/Manila',
    (p_ends_on + 1)::timestamp at time zone 'Asia/Manila',
    p_is_open,
    (select auth.uid())
  )
  returning id into new_cycle_id;

  insert into public.recruitment_positions (
    recruitment_cycle_id,
    title,
    item_number,
    description,
    is_open
  )
  values (
    new_cycle_id,
    trim(p_title),
    nullif(trim(p_item_number), ''),
    trim(coalesce(p_description, '')),
    p_is_open
  )
  returning id into new_position_id;

  return new_position_id;
end;
$$;

revoke all on function public.create_recruitment_position(
  uuid, text, text, date, date, text, text, text, boolean
) from public, anon;
grant execute on function public.create_recruitment_position(
  uuid, text, text, date, date, text, text, text, boolean
) to authenticated;

create or replace function public.create_application(
  p_position_id uuid,
  p_legal_name text,
  p_contact_number text,
  p_qualifications jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_application_id uuid;
  applicant_email text;
  applicant_id uuid := (select auth.uid());
begin
  if applicant_id is null then
    raise exception 'Authentication is required to submit an application';
  end if;
  if not public.is_user_in_role('applicant'::public.app_user_role) then
    raise exception 'Only applicant accounts can submit applications'
      using errcode = '42501';
  end if;
  if nullif(trim(p_legal_name), '') is null
    or char_length(trim(p_legal_name)) > 200
    or char_length(trim(coalesce(p_contact_number, ''))) > 50 then
    raise exception 'Applicant legal name and contact number must be valid and within the allowed length';
  end if;
  if jsonb_typeof(p_qualifications) is distinct from 'array' then
    raise exception 'Qualifications must be supplied as a JSON array';
  end if;

  select u.email into applicant_email
  from auth.users u
  where u.id = applicant_id;

  if applicant_email is null then
    raise exception 'The authenticated account must have an email address';
  end if;

  if not exists (
    select 1
    from public.recruitment_positions rp
    join public.recruitment_cycles rc on rc.id = rp.recruitment_cycle_id
    where rp.id = p_position_id
      and rp.is_open
      and rc.is_open
      and now() between rc.starts_at and rc.ends_at
  ) then
    raise exception 'The selected recruitment position is not open';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(applicant_id::text || ':' || p_position_id::text, 0)
  );

  if exists (
    select 1
    from public.applications a
    join public.application_identities ai on ai.application_id = a.id
    where a.position_id = p_position_id
      and ai.applicant_user_id = applicant_id
  ) then
    raise exception 'You have already applied for this position';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_qualifications) as q(
      criterion_key text,
      numeric_value numeric,
      boolean_value boolean,
      text_value text
    )
    left join public.position_eligibility_rules rule
      on rule.position_id = p_position_id
      and rule.criterion_key = q.criterion_key
    where rule.id is null
      or (rule.rule_type = 'minimum' and q.numeric_value is null)
      or (rule.rule_type = 'must_have' and q.boolean_value is null)
      or (rule.rule_type = 'equals' and q.text_value is null)
  ) or exists (
    select 1
    from public.position_eligibility_rules rule
    where rule.position_id = p_position_id
      and not exists (
        select 1
        from jsonb_to_recordset(p_qualifications) as q(
          criterion_key text,
          numeric_value numeric,
          boolean_value boolean,
          text_value text
        )
        where q.criterion_key = rule.criterion_key
          and (
            (rule.rule_type = 'minimum' and q.numeric_value is not null)
            or (rule.rule_type = 'must_have' and q.boolean_value is not null)
            or (rule.rule_type = 'equals' and q.text_value is not null)
          )
      )
  ) then
    raise exception 'Qualifications must match the configured eligibility rules and value types';
  end if;

  insert into public.applications (position_id, applicant_code)
  values (
    p_position_id,
    'SL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  )
  returning id into new_application_id;

  insert into public.application_identities (
    application_id,
    applicant_user_id,
    legal_name,
    contact_email,
    contact_number
  )
  values (
    new_application_id,
    applicant_id,
    trim(p_legal_name),
    applicant_email,
    nullif(trim(p_contact_number), '')
  );

  insert into public.application_qualifications (
    application_id,
    criterion_key,
    numeric_value,
    boolean_value,
    text_value
  )
  select
    new_application_id,
    q.criterion_key,
    q.numeric_value,
    q.boolean_value,
    q.text_value
  from jsonb_to_recordset(p_qualifications) as q(
    criterion_key text,
    numeric_value numeric,
    boolean_value boolean,
    text_value text
  );

  return new_application_id;
end;
$$;

revoke all on function public.create_application(uuid, text, text, jsonb)
from public, anon;
grant execute on function public.create_application(uuid, text, text, jsonb)
to authenticated;

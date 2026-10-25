create extension if not exists pgcrypto with schema extensions;

create type public.organization_unit_type as enum (
  'school',
  'district',
  'division'
);

create or replace function public.user_has_unit_access(p_user_id uuid, p_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with recursive unit_ancestors(id, parent_id) as (
    select ou.id, ou.parent_id
    from public.organization_units ou
    where ou.id = p_unit_id
    union all
    select parent.id, parent.parent_id
    from public.organization_units parent
    join unit_ancestors child on child.parent_id = parent.id
  )
  select exists (
    select 1
    from public.user_roles ur
    join public.user_profiles up on up.user_id = ur.user_id and up.is_active
    join unit_ancestors ua on ua.id = ur.organization_unit_id
    where ur.user_id = p_user_id
  )
  or exists (
    select 1
    from public.user_roles ur
    join public.user_profiles up on up.user_id = ur.user_id and up.is_active
    where ur.user_id = p_user_id
      and ur.role = 'super_admin'
  );
$$;

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

create type public.submission_status as enum (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'returned',
  'rejected'
);

create type public.application_status as enum (
  'submitted',
  'under_review',
  'eligible',
  'ineligible',
  'shortlisted',
  'approved',
  'rejected',
  'withdrawn'
);

create type public.document_status as enum (
  'pending',
  'accepted',
  'rejected'
);

create type public.application_decision_status as enum (
  'approved',
  'rejected',
  'returned'
);

create table public.organization_units (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.organization_units(id) on delete restrict,
  unit_type public.organization_unit_type not null,
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint organization_units_no_self_parent check (parent_id is distinct from id)
);

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  organization_unit_id uuid references public.organization_units(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_user_role not null,
  organization_unit_id uuid references public.organization_units(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  constraint user_roles_unique_scope unique nulls not distinct (user_id, role, organization_unit_id)
);

create table public.user_task_assignments (
  id uuid primary key default gen_random_uuid(),
  assignee_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  organization_unit_id uuid not null references public.organization_units(id) on delete cascade,
  task_code text not null,
  description text not null,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.personnel_records (
  id uuid primary key default gen_random_uuid(),
  organization_unit_id uuid not null references public.organization_units(id) on delete restrict,
  personnel_number text,
  full_name text not null,
  position_title text not null,
  employment_status text not null,
  record_data jsonb not null default '{}'::jsonb,
  last_monthly_update date,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personnel_records_data_is_object check (jsonb_typeof(record_data) = 'object')
);

create unique index personnel_records_number_per_unit
  on public.personnel_records (organization_unit_id, personnel_number)
  where personnel_number is not null;

create table public.monthly_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_unit_id uuid not null references public.organization_units(id) on delete restrict,
  reporting_month date not null,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  payload jsonb not null default '{}'::jsonb,
  status public.submission_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_submissions_month_start check (extract(day from reporting_month) = 1),
  constraint monthly_submissions_payload_is_object check (jsonb_typeof(payload) = 'object')
);

create unique index monthly_submissions_one_per_unit_month
  on public.monthly_submissions (organization_unit_id, reporting_month);

create table public.submission_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.monthly_submissions(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  outcome public.submission_status not null
    check (outcome in ('approved', 'returned', 'rejected', 'under_review')),
  comments text not null default '',
  created_at timestamptz not null default now()
);

create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.recruitment_cycles (
  id uuid primary key default gen_random_uuid(),
  organization_unit_id uuid not null references public.organization_units(id) on delete restrict,
  name text not null,
  policy_reference text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_open boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint recruitment_cycles_valid_dates check (ends_at > starts_at)
);

create table public.recruitment_positions (
  id uuid primary key default gen_random_uuid(),
  recruitment_cycle_id uuid not null references public.recruitment_cycles(id) on delete cascade,
  title text not null,
  item_number text,
  is_open boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.position_document_requirements (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.recruitment_positions(id) on delete cascade,
  document_type text not null,
  description text not null,
  policy_reference text not null,
  constraint position_document_requirements_unique unique (position_id, document_type)
);

create table public.position_eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.recruitment_positions(id) on delete cascade,
  criterion_key text not null,
  rule_type text not null check (rule_type in ('minimum', 'must_have', 'equals')),
  numeric_threshold numeric,
  text_threshold text,
  description text not null,
  policy_reference text not null,
  constraint position_eligibility_rules_unique unique (position_id, criterion_key),
  constraint position_eligibility_rule_value check (
    (rule_type = 'minimum' and numeric_threshold is not null and text_threshold is null)
    or (rule_type = 'must_have' and numeric_threshold is null and text_threshold is null)
    or (rule_type = 'equals' and numeric_threshold is null and text_threshold is not null)
  )
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.recruitment_positions(id) on delete restrict,
  applicant_code text not null unique,
  status public.application_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.application_identities (
  application_id uuid primary key references public.applications(id) on delete cascade,
  applicant_user_id uuid not null references auth.users(id) on delete restrict,
  legal_name text not null,
  contact_email text not null,
  contact_number text,
  created_at timestamptz not null default now()
);

create index application_identities_applicant
  on public.application_identities (applicant_user_id);

create table public.application_qualifications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  criterion_key text not null,
  numeric_value numeric,
  boolean_value boolean,
  text_value text,
  created_at timestamptz not null default now(),
  constraint application_qualifications_unique unique (application_id, criterion_key),
  constraint application_qualifications_one_value check (
    (case when numeric_value is not null then 1 else 0 end)
    + (case when boolean_value is not null then 1 else 0 end)
    + (case when text_value is not null then 1 else 0 end) <= 1
  )
);

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  identity_document_id uuid,
  document_type text not null,
  file_path text not null unique,
  content_type text not null,
  expires_at date,
  validation_status public.document_status not null default 'pending',
  validation_notes text not null default '',
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  uploaded_at timestamptz not null default now(),
  constraint application_documents_content_type check (
    content_type in (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  constraint application_documents_app_path check (
    file_path ~ (
      '^' || application_id::text
      || '/screening/[0-9a-fA-F-]{36}\.(pdf|jpg|jpeg|png|docx)$'
    )
  )
);

create table public.application_identity_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  document_type text not null,
  file_path text not null unique,
  original_filename text not null,
  uploaded_at timestamptz not null default now(),
  constraint application_identity_documents_app_path check (
    file_path ~ (
      '^' || application_id::text
      || '/identity/[0-9a-fA-F-]{36}\.(pdf|jpg|jpeg|png|docx)$'
    )
  ),
  constraint application_identity_documents_app_id_unique unique (application_id, id)
);

alter table public.application_documents
  add constraint application_documents_identity_document_fk
  foreign key (application_id, identity_document_id)
  references public.application_identity_documents(application_id, id)
  on delete restrict;

create table public.evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.recruitment_positions(id) on delete cascade,
  criterion_code text not null,
  description text not null,
  max_points numeric not null check (max_points > 0),
  weight numeric not null check (weight > 0),
  policy_reference text not null,
  rubric_version text not null,
  is_active boolean not null default true,
  constraint evaluation_criteria_unique unique (position_id, criterion_code)
);

create table public.application_scores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  criterion_id uuid not null references public.evaluation_criteria(id) on delete restrict,
  evaluator_id uuid not null references auth.users(id) on delete restrict,
  score numeric not null check (score >= 0),
  justification text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_scores_unique unique (application_id, criterion_id, evaluator_id)
);

create table public.application_decisions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  decision public.application_decision_status not null,
  rationale text not null,
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_status text,
  new_status text,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index monthly_submissions_queue
  on public.monthly_submissions (organization_unit_id, status, submitted_at);
create index application_documents_validation_queue
  on public.application_documents (validation_status, uploaded_at);
create index applications_position_status
  on public.applications (position_id, status, submitted_at);
create index user_notifications_unread
  on public.user_notifications (recipient_id, created_at desc)
  where read_at is null;
create index audit_logs_entity_history
  on public.audit_logs (entity_type, entity_id, occurred_at desc);

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (user_id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_profile_created
after insert or update of email on auth.users
for each row execute function public.handle_auth_user_profile();

create or replace function public.is_user_in_role(p_role public.app_user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.user_profiles up on up.user_id = ur.user_id and up.is_active
    where ur.user_id = (select auth.uid())
      and ur.role = p_role
  );
$$;

create or replace function public.is_current_user_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_user_in_role('super_admin'::public.app_user_role);
$$;

create or replace function public.has_unit_access(p_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.user_has_unit_access((select auth.uid()), p_unit_id);
$$;

create or replace function public.is_application_owner(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.application_identities ai
    where ai.application_id = p_application_id
      and ai.applicant_user_id = (select auth.uid())
  );
$$;

create or replace function public.can_review_application(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_current_user_super_admin()
    or exists (
      select 1
      from public.applications a
      join public.recruitment_positions rp on rp.id = a.position_id
      join public.recruitment_cycles rc on rc.id = rp.recruitment_cycle_id
      where a.id = p_application_id
        and public.has_unit_access(rc.organization_unit_id)
        and (
          public.is_user_in_role('division_personnel'::public.app_user_role)
          or public.is_user_in_role('school_head'::public.app_user_role)
          or public.is_user_in_role('psds'::public.app_user_role)
          or public.is_user_in_role('evaluation_committee'::public.app_user_role)
        )
    );
$$;

create or replace function public.provision_super_admin(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if lower(trim(p_email)) <> 'sdo.8@deped.edu' then
    raise exception 'This provisioning function is restricted to the configured administrator email';
  end if;

  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email));

  if target_user_id is null then
    raise exception 'No Supabase Auth user exists for %; invite the user before provisioning', p_email;
  end if;

  insert into public.user_profiles (user_id, email)
  values (target_user_id, lower(trim(p_email)))
  on conflict (user_id) do update
    set email = excluded.email,
        updated_at = now();

  insert into public.user_roles (user_id, role, organization_unit_id)
  values (target_user_id, 'super_admin', null)
  on conflict (user_id, role, organization_unit_id) do nothing;

  return target_user_id;
end;
$$;

revoke all on function public.provision_super_admin(text) from public, anon, authenticated;
grant execute on function public.provision_super_admin(text) to service_role;

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
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required to submit an application';
  end if;
  if nullif(trim(p_legal_name), '') is null then
    raise exception 'Applicant legal name is required';
  end if;
  if jsonb_typeof(p_qualifications) <> 'array' then
    raise exception 'Qualifications must be supplied as a JSON array';
  end if;

  select u.email into applicant_email
  from auth.users u
  where u.id = (select auth.uid());

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
    (select auth.uid()),
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

revoke all on function public.create_application(uuid, text, text, jsonb) from public, anon;
grant execute on function public.create_application(uuid, text, text, jsonb) to authenticated;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  status_before text;
  status_after text;
  record_id uuid;
  changed_fields text[];
  audit_details jsonb := '{}'::jsonb;
begin
  if tg_op <> 'INSERT' then
    old_row := to_jsonb(old);
    status_before := old_row ->> 'status';
    record_id := nullif(old_row ->> 'id', '')::uuid;
  end if;
  if tg_op <> 'DELETE' then
    new_row := to_jsonb(new);
    status_after := new_row ->> 'status';
    record_id := coalesce(record_id, nullif(new_row ->> 'id', '')::uuid);
  end if;

  select array_agg(keys.key order by keys.key)
  into changed_fields
  from (
    select key from jsonb_each(coalesce(old_row, '{}'::jsonb))
    union
    select key from jsonb_each(coalesce(new_row, '{}'::jsonb))
  ) keys
  where old_row -> keys.key is distinct from new_row -> keys.key;

  audit_details := jsonb_build_object(
    'changed_fields',
    coalesce(changed_fields, array[]::text[])
  );

  if tg_table_name = 'application_scores' then
    audit_details := audit_details || jsonb_build_object(
      'score_before', old_row -> 'score',
      'score_after', new_row -> 'score',
      'justification_before', old_row -> 'justification',
      'justification_after', new_row -> 'justification'
    );
  end if;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_status,
    new_status,
    details
  )
  values (
    (select auth.uid()),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    record_id,
    status_before,
    status_after,
    audit_details
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger audit_personnel_records
after insert or update or delete on public.personnel_records
for each row execute function public.write_audit_log();
create trigger audit_applications
after insert or update or delete on public.applications
for each row execute function public.write_audit_log();
create trigger audit_monthly_submissions
after insert or update or delete on public.monthly_submissions
for each row execute function public.write_audit_log();
create trigger audit_submission_reviews
after insert or update or delete on public.submission_reviews
for each row execute function public.write_audit_log();
create trigger audit_application_documents
after insert or update or delete on public.application_documents
for each row execute function public.write_audit_log();
create trigger audit_application_scores
after insert or update or delete on public.application_scores
for each row execute function public.write_audit_log();
create trigger audit_application_decisions
after insert or update or delete on public.application_decisions
for each row execute function public.write_audit_log();
create trigger audit_application_qualifications
after insert or update or delete on public.application_qualifications
for each row execute function public.write_audit_log();
create trigger audit_application_identity_documents
after insert or update or delete on public.application_identity_documents
for each row execute function public.write_audit_log();
create trigger audit_user_task_assignments
after insert or update or delete on public.user_task_assignments
for each row execute function public.write_audit_log();
create trigger audit_recruitment_cycles
after insert or update or delete on public.recruitment_cycles
for each row execute function public.write_audit_log();
create trigger audit_recruitment_positions
after insert or update or delete on public.recruitment_positions
for each row execute function public.write_audit_log();
create trigger audit_position_document_requirements
after insert or update or delete on public.position_document_requirements
for each row execute function public.write_audit_log();
create trigger audit_position_eligibility_rules
after insert or update or delete on public.position_eligibility_rules
for each row execute function public.write_audit_log();
create trigger audit_evaluation_criteria
after insert or update or delete on public.evaluation_criteria
for each row execute function public.write_audit_log();
create trigger audit_user_roles
after insert or update or delete on public.user_roles
for each row execute function public.write_audit_log();

create or replace function public.notify_submission_reviewers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'submitted' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;

  insert into public.user_notifications (
    recipient_id,
    notification_type,
    title,
    message,
    entity_type,
    entity_id
  )
  select distinct
    ur.user_id,
    'submission_pending_validation',
    'Monthly report awaiting validation',
    'A monthly submission is ready for review.',
    'monthly_submissions',
    new.id
  from public.user_roles ur
  join public.user_profiles up on up.user_id = ur.user_id and up.is_active
  where ur.role in ('school_head', 'psds', 'division_personnel')
    and public.user_has_unit_access(ur.user_id, new.organization_unit_id)
    and ur.user_id <> new.submitted_by;

  return new;
end;
$$;

create trigger notify_submission_reviewers
after insert or update of status on public.monthly_submissions
for each row execute function public.notify_submission_reviewers();

create or replace function public.notify_application_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_application_id uuid;
  target_owner_id uuid;
  message_text text;
begin
  if tg_table_name = 'application_documents' then
    if new.validation_status = 'pending'
      or (tg_op = 'UPDATE' and old.validation_status = new.validation_status) then
      return new;
    end if;
    target_application_id := new.application_id;
    message_text := 'A document in your application has been ' || new.validation_status::text || '.';
  else
    target_application_id := new.application_id;
    message_text := 'A decision has been recorded for your application: ' || new.decision::text || '.';
  end if;

  select ai.applicant_user_id into target_owner_id
  from public.application_identities ai
  where ai.application_id = target_application_id;

  if target_owner_id is not null then
    insert into public.user_notifications (
      recipient_id,
      notification_type,
      title,
      message,
      entity_type,
      entity_id
    )
    values (
      target_owner_id,
      'application_update',
      'Application status update',
      message_text,
      'applications',
      target_application_id
    );
  end if;
  return new;
end;
$$;

create trigger notify_application_document_owner
after insert or update of validation_status on public.application_documents
for each row execute function public.notify_application_owner();
create trigger notify_application_decision_owner
after insert on public.application_decisions
for each row execute function public.notify_application_owner();

create or replace function public.notify_application_reviewers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_application_id uuid;
  target_organization_unit_id uuid;
  target_notification_type text;
  target_title text;
  target_message text;
begin
  if tg_table_name = 'applications' then
    target_application_id := new.id;
    target_notification_type := 'application_pending_review';
    target_title := 'Application awaiting screening';
    target_message := 'An anonymous application is ready for screening.';
  else
    target_application_id := new.application_id;
    target_notification_type := 'application_document_pending_validation';
    target_title := 'Application document awaiting validation';
    target_message := 'An application document is ready for validation.';
  end if;

  select rc.organization_unit_id into target_organization_unit_id
  from public.applications a
  join public.recruitment_positions rp on rp.id = a.position_id
  join public.recruitment_cycles rc on rc.id = rp.recruitment_cycle_id
  where a.id = target_application_id;

  insert into public.user_notifications (
    recipient_id,
    notification_type,
    title,
    message,
    entity_type,
    entity_id
  )
  select distinct
    ur.user_id,
    target_notification_type,
    target_title,
    target_message,
    'applications',
    target_application_id
  from public.user_roles ur
  join public.user_profiles up on up.user_id = ur.user_id and up.is_active
  where ur.role in (
      'school_head',
      'psds',
      'division_personnel',
      'evaluation_committee',
      'super_admin'
    )
    and public.user_has_unit_access(ur.user_id, target_organization_unit_id)
    and not public.is_application_owner(target_application_id);

  return new;
end;
$$;

create trigger notify_application_reviewers_on_submission
after insert on public.applications
for each row execute function public.notify_application_reviewers();
create trigger notify_application_reviewers_on_document
after insert on public.application_documents
for each row execute function public.notify_application_reviewers();

create or replace function public.sync_submission_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.monthly_submissions
  set status = new.outcome,
      reviewed_by = new.reviewer_id,
      reviewed_at = new.created_at,
      updated_at = now()
  where id = new.submission_id;

  insert into public.user_notifications (
    recipient_id,
    notification_type,
    title,
    message,
    entity_type,
    entity_id
  )
  select
    ms.submitted_by,
    'submission_review_update',
    'Monthly report review update',
    'Your monthly submission was marked ' || new.outcome::text || '.',
    'monthly_submissions',
    ms.id
  from public.monthly_submissions ms
  where ms.id = new.submission_id;

  return new;
end;
$$;

create trigger sync_submission_review
after insert on public.submission_reviews
for each row execute function public.sync_submission_review();

create or replace function public.sync_application_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.applications
  set status = case new.decision
      when 'approved' then 'approved'::public.application_status
      when 'rejected' then 'rejected'::public.application_status
      when 'returned' then 'under_review'::public.application_status
    end,
      updated_at = now()
  where id = new.application_id;
  return new;
end;
$$;

create trigger sync_application_decision
after insert on public.application_decisions
for each row execute function public.sync_application_decision();

create view public.application_screening_results
with (security_invoker = true)
as
with document_summary as (
  select
    a.id as application_id,
    count(distinct req.id) as required_document_count,
    count(distinct req.id) filter (
      where doc.validation_status = 'accepted'
        and (doc.expires_at is null or doc.expires_at >= current_date)
    ) as accepted_document_count,
    count(distinct req.id) filter (
      where doc.validation_status = 'rejected'
        or (doc.expires_at is not null and doc.expires_at < current_date)
    ) as rejected_or_expired_document_count,
    count(doc.id) filter (
      where doc.id is not null
        and exists (
          select 1
          from public.application_documents duplicate
          where duplicate.application_id = doc.application_id
            and duplicate.document_type = doc.document_type
            and duplicate.id <> doc.id
        )
    ) as duplicate_document_count
  from public.applications a
  join public.recruitment_positions rp on rp.id = a.position_id
  left join public.position_document_requirements req on req.position_id = rp.id
  left join public.application_documents doc
    on doc.application_id = a.id and doc.document_type = req.document_type
  group by a.id
),
eligibility_summary as (
  select
    a.id as application_id,
    count(rule.id) as eligibility_rule_count,
    count(rule.id) filter (
      where qualification.id is not null
        and case rule.rule_type
          when 'minimum' then qualification.numeric_value >= rule.numeric_threshold
          when 'must_have' then qualification.boolean_value is true
          when 'equals' then lower(qualification.text_value) = lower(rule.text_threshold)
        end
    ) as passed_eligibility_rule_count
  from public.applications a
  join public.recruitment_positions rp on rp.id = a.position_id
  left join public.position_eligibility_rules rule on rule.position_id = rp.id
  left join public.application_qualifications qualification
    on qualification.application_id = a.id
    and qualification.criterion_key = rule.criterion_key
  group by a.id
),
score_summary as (
  select
    a.id as application_id,
    count(distinct criterion.id) filter (where criterion.is_active) as required_score_count,
    count(distinct criterion.id) filter (where criterion.is_active and score.score is not null)
      as completed_score_count,
    case
      when sum(criterion.weight) filter (where criterion.is_active) > 0 then
        100 * sum(
          coalesce(score.average_score / criterion.max_points, 0) * criterion.weight
        ) filter (where criterion.is_active)
        / sum(criterion.weight) filter (where criterion.is_active)
      else null
    end as preliminary_score
  from public.applications a
  join public.recruitment_positions rp on rp.id = a.position_id
  left join public.evaluation_criteria criterion
    on criterion.position_id = rp.id and criterion.is_active
  left join lateral (
    select avg(s.score) as average_score
    from public.application_scores s
    where s.application_id = a.id and s.criterion_id = criterion.id
  ) score on true
  group by a.id
)
select
  a.id as application_id,
  a.applicant_code,
  a.position_id,
  a.status,
  coalesce(ds.required_document_count, 0) as required_document_count,
  coalesce(ds.accepted_document_count, 0) as accepted_document_count,
  coalesce(ds.rejected_or_expired_document_count, 0) as rejected_or_expired_document_count,
  coalesce(ds.duplicate_document_count, 0) as duplicate_document_count,
  coalesce(es.eligibility_rule_count, 0) as eligibility_rule_count,
  coalesce(es.passed_eligibility_rule_count, 0) as passed_eligibility_rule_count,
  coalesce(ss.required_score_count, 0) as required_score_count,
  coalesce(ss.completed_score_count, 0) as completed_score_count,
  ss.preliminary_score,
  (
    coalesce(ds.accepted_document_count, 0) = coalesce(ds.required_document_count, 0)
    and coalesce(ds.rejected_or_expired_document_count, 0) = 0
    and coalesce(ds.duplicate_document_count, 0) = 0
  ) as documents_complete,
  (
    coalesce(es.passed_eligibility_rule_count, 0) = coalesce(es.eligibility_rule_count, 0)
  ) as eligibility_passed,
  (
    coalesce(ds.accepted_document_count, 0) = coalesce(ds.required_document_count, 0)
    and coalesce(ds.rejected_or_expired_document_count, 0) = 0
    and coalesce(ds.duplicate_document_count, 0) = 0
    and coalesce(es.passed_eligibility_rule_count, 0) = coalesce(es.eligibility_rule_count, 0)
  ) as preliminarily_qualified,
  case
    when coalesce(ds.accepted_document_count, 0) < coalesce(ds.required_document_count, 0)
      then 'missing_or_unvalidated_documents'
    when coalesce(ds.rejected_or_expired_document_count, 0) > 0
      then 'rejected_or_expired_documents'
    when coalesce(ds.duplicate_document_count, 0) > 0
      then 'duplicate_documents'
    when coalesce(es.passed_eligibility_rule_count, 0) < coalesce(es.eligibility_rule_count, 0)
      then 'eligibility_rules_not_met'
    else null
  end as screening_exception
from public.applications a
left join document_summary ds on ds.application_id = a.id
left join eligibility_summary es on es.application_id = a.id
left join score_summary ss on ss.application_id = a.id;

create view public.preliminary_application_rankings
with (security_invoker = true)
as
select
  s.application_id,
  s.applicant_code,
  s.position_id,
  s.preliminary_score,
  rank() over (
    partition by s.position_id
    order by s.preliminary_score desc, s.applicant_code
  ) as preliminary_rank
from public.application_screening_results s
where s.preliminarily_qualified
  and s.required_score_count > 0
  and s.completed_score_count = s.required_score_count;

create view public.monthly_reporting_summary
with (security_invoker = true)
as
select
  ms.organization_unit_id,
  ms.reporting_month,
  count(*) as submission_count,
  count(*) filter (where ms.status = 'submitted') as pending_validation_count,
  count(*) filter (where ms.status = 'under_review') as under_review_count,
  count(*) filter (where ms.status = 'approved') as approved_count,
  count(*) filter (where ms.status in ('returned', 'rejected')) as needs_revision_count
from public.monthly_submissions ms
group by ms.organization_unit_id, ms.reporting_month;

alter table public.organization_units enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_task_assignments enable row level security;
alter table public.personnel_records enable row level security;
alter table public.monthly_submissions enable row level security;
alter table public.submission_reviews enable row level security;
alter table public.user_notifications enable row level security;
alter table public.recruitment_cycles enable row level security;
alter table public.recruitment_positions enable row level security;
alter table public.position_document_requirements enable row level security;
alter table public.position_eligibility_rules enable row level security;
alter table public.applications enable row level security;
alter table public.application_identities enable row level security;
alter table public.application_qualifications enable row level security;
alter table public.application_documents enable row level security;
alter table public.application_identity_documents enable row level security;
alter table public.evaluation_criteria enable row level security;
alter table public.application_scores enable row level security;
alter table public.application_decisions enable row level security;
alter table public.audit_logs enable row level security;

grant select, insert, update, delete on public.organization_units to authenticated;
grant select, update on public.user_profiles to authenticated;
grant select on public.user_roles to authenticated;
grant insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.user_task_assignments to authenticated;
grant select, insert, update, delete on public.personnel_records to authenticated;
grant select, insert, update, delete on public.monthly_submissions to authenticated;
grant select, insert on public.submission_reviews to authenticated;
grant select, update on public.user_notifications to authenticated;
grant select, insert, update, delete on public.recruitment_cycles to authenticated;
grant select, insert, update, delete on public.recruitment_positions to authenticated;
grant select, insert, update, delete on public.position_document_requirements to authenticated;
grant select, insert, update, delete on public.position_eligibility_rules to authenticated;
grant select on public.applications to authenticated;
grant select on public.application_identities to authenticated;
grant select on public.application_qualifications to authenticated;
grant select, insert, update on public.application_documents to authenticated;
grant select, insert, delete on public.application_identity_documents to authenticated;
grant select, insert, update, delete on public.evaluation_criteria to authenticated;
grant select, insert, update on public.application_scores to authenticated;
grant select, insert on public.application_decisions to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.application_screening_results,
  public.preliminary_application_rankings,
  public.monthly_reporting_summary to authenticated;

revoke all on table
  public.organization_units,
  public.user_profiles,
  public.user_roles,
  public.user_task_assignments,
  public.personnel_records,
  public.monthly_submissions,
  public.submission_reviews,
  public.user_notifications,
  public.recruitment_cycles,
  public.recruitment_positions,
  public.position_document_requirements,
  public.position_eligibility_rules,
  public.applications,
  public.application_identities,
  public.application_qualifications,
  public.application_documents,
  public.application_identity_documents,
  public.evaluation_criteria,
  public.application_scores,
  public.application_decisions,
  public.audit_logs,
  public.application_screening_results,
  public.preliminary_application_rankings,
  public.monthly_reporting_summary
from anon, public;

grant select, update (is_active, organization_unit_id, full_name)
on public.user_profiles to authenticated;
grant select on public.user_roles to authenticated;
grant insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.user_task_assignments to authenticated;
grant select, insert, update, delete on public.personnel_records to authenticated;
grant select, insert, update, delete on public.monthly_submissions to authenticated;
grant select, insert on public.submission_reviews to authenticated;
grant select, update on public.user_notifications to authenticated;
grant select, insert, update, delete on public.recruitment_cycles to authenticated;
grant select, insert, update, delete on public.recruitment_positions to authenticated;
grant select, insert, update, delete on public.position_document_requirements to authenticated;
grant select, insert, update, delete on public.position_eligibility_rules to authenticated;
grant select on public.applications to authenticated;
grant select on public.application_identities to authenticated;
grant select on public.application_qualifications to authenticated;
grant select, insert, update on public.application_documents to authenticated;
grant select, insert, delete on public.application_identity_documents to authenticated;
grant select, insert, update, delete on public.evaluation_criteria to authenticated;
grant select, insert, update on public.application_scores to authenticated;
grant select, insert on public.application_decisions to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.application_screening_results,
  public.preliminary_application_rankings,
  public.monthly_reporting_summary to authenticated;

revoke all on function public.user_has_unit_access(uuid, uuid) from public, anon, authenticated;
revoke all on function public.handle_auth_user_profile() from public, anon, authenticated;
revoke all on function public.write_audit_log() from public, anon, authenticated;
revoke all on function public.notify_submission_reviewers() from public, anon, authenticated;
revoke all on function public.notify_application_owner() from public, anon, authenticated;
revoke all on function public.notify_application_reviewers() from public, anon, authenticated;
revoke all on function public.sync_submission_review() from public, anon, authenticated;
revoke all on function public.sync_application_decision() from public, anon, authenticated;
grant execute on function public.is_user_in_role(public.app_user_role) to authenticated;
grant execute on function public.is_current_user_super_admin() to authenticated;
grant execute on function public.has_unit_access(uuid) to authenticated;
grant execute on function public.is_application_owner(uuid) to authenticated;
grant execute on function public.can_review_application(uuid) to authenticated;

create policy "Authenticated users can view active organization units"
on public.organization_units for select to authenticated
using (is_active or public.is_current_user_super_admin());
create policy "Super admins can manage organization units"
on public.organization_units for all to authenticated
using (public.is_current_user_super_admin())
with check (public.is_current_user_super_admin());

create policy "Users can view their own profile"
on public.user_profiles for select to authenticated
using (user_id = (select auth.uid()) or public.is_current_user_super_admin());
create policy "Super admins can update user profiles"
on public.user_profiles for update to authenticated
using (public.is_current_user_super_admin())
with check (public.is_current_user_super_admin());

create policy "Users can view their own roles"
on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or public.is_current_user_super_admin());
create policy "Super admins can manage user roles"
on public.user_roles for all to authenticated
using (public.is_current_user_super_admin())
with check (public.is_current_user_super_admin());

create policy "Users can view assigned tasks"
on public.user_task_assignments for select to authenticated
using (
  assignee_id = (select auth.uid())
  or public.is_current_user_super_admin()
  or (
    public.is_user_in_role('school_head'::public.app_user_role)
    and public.has_unit_access(organization_unit_id)
  )
);
create policy "Managers can assign tasks"
on public.user_task_assignments for insert to authenticated
with check (
  assigned_by = (select auth.uid())
  and public.has_unit_access(organization_unit_id)
  and (
    public.is_current_user_super_admin()
    or public.is_user_in_role('school_head'::public.app_user_role)
    or public.is_user_in_role('psds'::public.app_user_role)
    or public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);
create policy "Managers can update assigned tasks"
on public.user_task_assignments for update to authenticated
using (
  public.is_current_user_super_admin()
  or (
    public.has_unit_access(organization_unit_id)
    and (
      public.is_user_in_role('school_head'::public.app_user_role)
      or public.is_user_in_role('psds'::public.app_user_role)
      or public.is_user_in_role('division_personnel'::public.app_user_role)
    )
  )
)
with check (
  public.is_current_user_super_admin()
  or (
    submitted_by = (select auth.uid())
    and status in ('draft', 'submitted')
    and public.has_unit_access(organization_unit_id)
    and (
      public.is_user_in_role('teacher'::public.app_user_role)
      or public.is_user_in_role('school_personnel'::public.app_user_role)
      or public.is_user_in_role('school_head'::public.app_user_role)
      or public.is_user_in_role('psds'::public.app_user_role)
      or public.is_user_in_role('division_personnel'::public.app_user_role)
    )
  )
);
create policy "Managers can delete assigned tasks"
on public.user_task_assignments for delete to authenticated
using (public.is_current_user_super_admin());

create policy "Users can view personnel in their scope"
on public.personnel_records for select to authenticated
using (public.has_unit_access(organization_unit_id));
create policy "Authorized users can add personnel in their scope"
on public.personnel_records for insert to authenticated
with check (
  created_by = (select auth.uid())
  and public.has_unit_access(organization_unit_id)
  and (
    public.is_current_user_super_admin()
    or public.is_user_in_role('school_personnel'::public.app_user_role)
    or public.is_user_in_role('school_head'::public.app_user_role)
    or public.is_user_in_role('psds'::public.app_user_role)
    or public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);
create policy "Authorized users can update personnel in their scope"
on public.personnel_records for update to authenticated
using (
  public.has_unit_access(organization_unit_id)
  and (
    public.is_current_user_super_admin()
    or public.is_user_in_role('school_personnel'::public.app_user_role)
    or public.is_user_in_role('school_head'::public.app_user_role)
    or public.is_user_in_role('psds'::public.app_user_role)
    or public.is_user_in_role('division_personnel'::public.app_user_role)
  )
)
with check (public.has_unit_access(organization_unit_id));
create policy "Administrators can delete personnel records"
on public.personnel_records for delete to authenticated
using (public.is_current_user_super_admin());

create policy "Submitters and scoped reviewers can view monthly submissions"
on public.monthly_submissions for select to authenticated
using (
  submitted_by = (select auth.uid())
  or public.has_unit_access(organization_unit_id)
);
create policy "Authorized users can submit monthly reports"
on public.monthly_submissions for insert to authenticated
with check (
  submitted_by = (select auth.uid())
  and public.has_unit_access(organization_unit_id)
  and (
    public.is_current_user_super_admin()
    or public.is_user_in_role('teacher'::public.app_user_role)
    or public.is_user_in_role('school_personnel'::public.app_user_role)
    or public.is_user_in_role('school_head'::public.app_user_role)
    or public.is_user_in_role('psds'::public.app_user_role)
    or public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);
create policy "Submitters and scoped reviewers can update monthly submissions"
on public.monthly_submissions for update to authenticated
using (
  public.is_current_user_super_admin()
  or (
    submitted_by = (select auth.uid())
    and status in ('draft', 'returned')
    and public.has_unit_access(organization_unit_id)
  )
)
with check (public.has_unit_access(organization_unit_id));
create policy "Administrators can delete monthly submissions"
on public.monthly_submissions for delete to authenticated
using (public.is_current_user_super_admin());

create policy "Submitters and scoped reviewers can view submission reviews"
on public.submission_reviews for select to authenticated
using (
  public.is_current_user_super_admin()
  or exists (
    select 1 from public.monthly_submissions ms
    where ms.id = submission_id
      and (ms.submitted_by = (select auth.uid()) or public.has_unit_access(ms.organization_unit_id))
  )
);
create policy "Scoped reviewers can review submissions"
on public.submission_reviews for insert to authenticated
with check (
  reviewer_id = (select auth.uid())
  and exists (
    select 1 from public.monthly_submissions ms
    where ms.id = submission_id
      and public.has_unit_access(ms.organization_unit_id)
  )
  and (
    public.is_current_user_super_admin()
    or public.is_user_in_role('school_head'::public.app_user_role)
    or public.is_user_in_role('psds'::public.app_user_role)
    or public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);

create policy "Users can view their own notifications"
on public.user_notifications for select to authenticated
using (recipient_id = (select auth.uid()));
create policy "Users can mark their own notifications read"
on public.user_notifications for update to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

create policy "Authorized users can view recruitment cycles"
on public.recruitment_cycles for select to authenticated
using (
  is_open
  or public.is_current_user_super_admin()
  or (
    public.has_unit_access(organization_unit_id)
    and (
      public.is_user_in_role('division_personnel'::public.app_user_role)
      or public.is_user_in_role('evaluation_committee'::public.app_user_role)
      or public.is_user_in_role('school_head'::public.app_user_role)
    )
  )
);
create policy "Administrators can manage recruitment cycles"
on public.recruitment_cycles for all to authenticated
using (
  public.is_current_user_super_admin()
  or (
    public.has_unit_access(organization_unit_id)
    and public.is_user_in_role('division_personnel'::public.app_user_role)
  )
)
with check (
  public.is_current_user_super_admin()
  or (
    public.has_unit_access(organization_unit_id)
    and public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);

create policy "Authorized users can view recruitment positions"
on public.recruitment_positions for select to authenticated
using (
  is_open
  or public.is_current_user_super_admin()
  or exists (
    select 1 from public.recruitment_cycles rc
    where rc.id = recruitment_cycle_id
      and public.has_unit_access(rc.organization_unit_id)
      and (
        public.is_user_in_role('division_personnel'::public.app_user_role)
        or public.is_user_in_role('evaluation_committee'::public.app_user_role)
        or public.is_user_in_role('school_head'::public.app_user_role)
      )
  )
);
create policy "Administrators can manage recruitment positions"
on public.recruitment_positions for all to authenticated
using (
  public.is_current_user_super_admin()
  or exists (
    select 1 from public.recruitment_cycles rc
    where rc.id = recruitment_cycle_id
      and public.has_unit_access(rc.organization_unit_id)
      and public.is_user_in_role('division_personnel'::public.app_user_role)
  )
)
with check (
  public.is_current_user_super_admin()
  or exists (
    select 1 from public.recruitment_cycles rc
    where rc.id = recruitment_cycle_id
      and public.has_unit_access(rc.organization_unit_id)
      and public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);

create policy "Authenticated users can view position document requirements"
on public.position_document_requirements for select to authenticated
using (true);
create policy "Division administrators can manage document requirements"
on public.position_document_requirements for all to authenticated
using (
  public.is_current_user_super_admin()
  or exists (
    select 1
    from public.recruitment_positions rp
    join public.recruitment_cycles rc on rc.id = rp.recruitment_cycle_id
    where rp.id = position_id
      and public.has_unit_access(rc.organization_unit_id)
      and public.is_user_in_role('division_personnel'::public.app_user_role)
  )
)
with check (
  public.is_current_user_super_admin()
  or exists (
    select 1
    from public.recruitment_positions rp
    join public.recruitment_cycles rc on rc.id = rp.recruitment_cycle_id
    where rp.id = position_id
      and public.has_unit_access(rc.organization_unit_id)
      and public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);

create policy "Authenticated users can view position eligibility rules"
on public.position_eligibility_rules for select to authenticated
using (true);
create policy "Division administrators can manage eligibility rules"
on public.position_eligibility_rules for all to authenticated
using (
  public.is_current_user_super_admin()
  or exists (
    select 1
    from public.recruitment_positions rp
    join public.recruitment_cycles rc on rc.id = rp.recruitment_cycle_id
    where rp.id = position_id
      and public.has_unit_access(rc.organization_unit_id)
      and public.is_user_in_role('division_personnel'::public.app_user_role)
  )
)
with check (
  public.is_current_user_super_admin()
  or exists (
    select 1
    from public.recruitment_positions rp
    join public.recruitment_cycles rc on rc.id = rp.recruitment_cycle_id
    where rp.id = position_id
      and public.has_unit_access(rc.organization_unit_id)
      and public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);

create policy "Applicants and reviewers can view anonymous applications"
on public.applications for select to authenticated
using (
  public.is_application_owner(id)
  or public.can_review_application(id)
);

create policy "Applicants and authorized identity verifiers can view identities"
on public.application_identities for select to authenticated
using (
  applicant_user_id = (select auth.uid())
  or public.is_current_user_super_admin()
  or (
    public.is_user_in_role('division_personnel'::public.app_user_role)
    and public.can_review_application(application_id)
  )
);

create policy "Applicants and reviewers can view application qualifications"
on public.application_qualifications for select to authenticated
using (
  public.is_application_owner(application_id)
  or public.can_review_application(application_id)
);

create policy "Applicants and reviewers can view application documents"
on public.application_documents for select to authenticated
using (
  public.is_application_owner(application_id)
  or public.can_review_application(application_id)
);
create policy "Applicants and authorized verifiers can view original documents"
on public.application_identity_documents for select to authenticated
using (
  public.is_application_owner(application_id)
  or public.is_current_user_super_admin()
  or (
    public.is_user_in_role('division_personnel'::public.app_user_role)
    and public.can_review_application(application_id)
  )
);
create policy "Applicants can upload original identity documents"
on public.application_identity_documents for insert to authenticated
with check (
  public.is_application_owner(application_id)
  and split_part(file_path, '/', 1) = application_id::text
);
create policy "Applicants can remove original identity documents"
on public.application_identity_documents for delete to authenticated
using (public.is_application_owner(application_id));
create policy "Applicants can upload their own application documents"
on public.application_documents for insert to authenticated
with check (
  public.is_application_owner(application_id)
  and validation_status = 'pending'
  and validated_by is null
  and split_part(file_path, '/', 1) = application_id::text
);
create policy "Scoped reviewers can validate application documents"
on public.application_documents for update to authenticated
using (public.can_review_application(application_id))
with check (
  public.can_review_application(application_id)
  and (
    public.is_current_user_super_admin()
    or public.is_user_in_role('division_personnel'::public.app_user_role)
    or public.is_user_in_role('school_head'::public.app_user_role)
    or public.is_user_in_role('psds'::public.app_user_role)
    or public.is_user_in_role('evaluation_committee'::public.app_user_role)
  )
);

create policy "Authenticated users can view evaluation rubrics"
on public.evaluation_criteria for select to authenticated
using (true);
create policy "Division administrators can manage evaluation rubrics"
on public.evaluation_criteria for all to authenticated
using (
  public.is_current_user_super_admin()
  or exists (
    select 1
    from public.recruitment_positions rp
    join public.recruitment_cycles rc on rc.id = rp.recruitment_cycle_id
    where rp.id = position_id
      and public.has_unit_access(rc.organization_unit_id)
      and public.is_user_in_role('division_personnel'::public.app_user_role)
  )
)
with check (
  public.is_current_user_super_admin()
  or exists (
    select 1
    from public.recruitment_positions rp
    join public.recruitment_cycles rc on rc.id = rp.recruitment_cycle_id
    where rp.id = position_id
      and public.has_unit_access(rc.organization_unit_id)
      and public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);

create policy "Applicants and reviewers can view application scores"
on public.application_scores for select to authenticated
using (
  public.is_application_owner(application_id)
  or public.can_review_application(application_id)
);
create policy "Evaluators can add their own application scores"
on public.application_scores for insert to authenticated
with check (
  evaluator_id = (select auth.uid())
  and public.can_review_application(application_id)
  and (
    public.is_current_user_super_admin()
    or public.is_user_in_role('evaluation_committee'::public.app_user_role)
    or public.is_user_in_role('division_personnel'::public.app_user_role)
  )
  and exists (
    select 1
    from public.evaluation_criteria ec
    join public.applications a on a.id = application_id
    where ec.id = criterion_id
      and ec.position_id = a.position_id
      and ec.is_active
      and score <= ec.max_points
  )
);
create policy "Evaluators can update their own application scores"
on public.application_scores for update to authenticated
using (
  evaluator_id = (select auth.uid())
  and public.can_review_application(application_id)
  and (
    public.is_current_user_super_admin()
    or public.is_user_in_role('evaluation_committee'::public.app_user_role)
    or public.is_user_in_role('division_personnel'::public.app_user_role)
  )
)
with check (
  evaluator_id = (select auth.uid())
  and public.can_review_application(application_id)
  and (
    public.is_current_user_super_admin()
    or public.is_user_in_role('evaluation_committee'::public.app_user_role)
    or public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);

create policy "Applicants and reviewers can view application decisions"
on public.application_decisions for select to authenticated
using (
  public.is_application_owner(application_id)
  or public.can_review_application(application_id)
);
create policy "Authorized officials can record final decisions"
on public.application_decisions for insert to authenticated
with check (
  decided_by = (select auth.uid())
  and public.can_review_application(application_id)
  and (
    public.is_current_user_super_admin()
    or public.is_user_in_role('division_personnel'::public.app_user_role)
  )
);

create policy "Authorized administrators can view audit logs"
on public.audit_logs for select to authenticated
using (public.is_current_user_super_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-documents',
  'application-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-identity-documents',
  'application-identity-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Applicants can upload files to their application folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'application-documents'
  and (storage.foldername(name))[2] = 'screening'
  and public.is_application_owner(((storage.foldername(name))[1])::uuid)
);

create policy "Applicants can upload original identity files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'application-identity-documents'
  and (storage.foldername(name))[2] = 'identity'
  and public.is_application_owner(((storage.foldername(name))[1])::uuid)
);
create policy "Applicants and authorized verifiers can read original identity files"
on storage.objects for select to authenticated
using (
  bucket_id = 'application-identity-documents'
  and (
    public.is_application_owner(((storage.foldername(name))[1])::uuid)
    or public.is_current_user_super_admin()
    or (
      public.is_user_in_role('division_personnel'::public.app_user_role)
      and public.can_review_application(((storage.foldername(name))[1])::uuid)
    )
  )
);
create policy "Applicants can remove original identity files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'application-identity-documents'
  and public.is_application_owner(((storage.foldername(name))[1])::uuid)
);
create policy "Applicants and reviewers can read application files"
on storage.objects for select to authenticated
using (
  bucket_id = 'application-documents'
  and (
    public.is_application_owner(((storage.foldername(name))[1])::uuid)
    or public.can_review_application(((storage.foldername(name))[1])::uuid)
  )
);
create policy "Applicants can remove their application files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'application-documents'
  and public.is_application_owner(((storage.foldername(name))[1])::uuid)
);

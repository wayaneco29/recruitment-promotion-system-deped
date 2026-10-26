insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'applicant-documents',
  'applicant-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table public.applicant_documents (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (
    document_type in (
      'Training / Certificates',
      'Transcript of Records',
      'Performance / IPCR / OPCR',
      'PDS',
      'Letter of Intent',
      'Other'
    )
  ),
  custom_document_type text,
  file_name text not null check (length(file_name) between 1 and 255),
  mime_type text not null check (
    mime_type in (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  file_size bigint not null check (file_size between 1 and 10485760),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applicant_documents_other_type check (
    (
      document_type = 'Other'
      and custom_document_type is not null
      and length(trim(custom_document_type)) between 1 and 100
    )
    or (document_type <> 'Other' and custom_document_type is null)
  ),
  constraint applicant_documents_storage_path check (
    storage_path = applicant_id::text || '/' || id::text
  )
);

alter table public.applicant_documents enable row level security;

create index applicant_documents_owner_updated_at_idx
on public.applicant_documents (applicant_id, updated_at desc);

revoke all on public.applicant_documents from anon, authenticated;
grant select on public.applicant_documents to authenticated;
grant insert (
  id,
  applicant_id,
  document_type,
  custom_document_type,
  file_name,
  mime_type,
  file_size,
  storage_path
) on public.applicant_documents to authenticated;
grant update (
  document_type,
  custom_document_type,
  file_name,
  mime_type,
  file_size,
  updated_at
) on public.applicant_documents to authenticated;

create policy "Applicants and document reviewers can view applicant documents"
on public.applicant_documents for select to authenticated
using (
  applicant_id = (select auth.uid())
  or public.is_user_in_role('super_admin'::public.app_user_role)
  or public.is_user_in_role('division_personnel'::public.app_user_role)
  or public.is_user_in_role('evaluation_committee'::public.app_user_role)
);

create policy "Applicants can upload their own documents"
on public.applicant_documents for insert to authenticated
with check (
  applicant_id = (select auth.uid())
  and public.is_user_in_role('applicant'::public.app_user_role)
);

create policy "Applicants can update their own documents"
on public.applicant_documents for update to authenticated
using (
  applicant_id = (select auth.uid())
  and public.is_user_in_role('applicant'::public.app_user_role)
)
with check (
  applicant_id = (select auth.uid())
  and public.is_user_in_role('applicant'::public.app_user_role)
);

create policy "Applicants and document reviewers can view private document files"
on storage.objects for select to authenticated
using (
  bucket_id = 'applicant-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_user_in_role('super_admin'::public.app_user_role)
    or public.is_user_in_role('division_personnel'::public.app_user_role)
    or public.is_user_in_role('evaluation_committee'::public.app_user_role)
  )
);

create policy "Applicants can upload their own private document files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'applicant-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.is_user_in_role('applicant'::public.app_user_role)
);

create policy "Applicants can update their own private document files"
on storage.objects for update to authenticated
using (
  bucket_id = 'applicant-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.is_user_in_role('applicant'::public.app_user_role)
)
with check (
  bucket_id = 'applicant-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.is_user_in_role('applicant'::public.app_user_role)
);

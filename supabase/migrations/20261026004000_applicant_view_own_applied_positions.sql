create policy "Applicants can view positions for their applications"
on public.recruitment_positions for select to authenticated
using (
  exists (
    select 1
    from public.applications a
    where a.position_id = recruitment_positions.id
      and public.is_application_owner(a.id)
  )
);

create or replace function public.get_my_application_rankings()
returns table (application_id uuid, preliminary_rank bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select ranking.application_id, ranking.preliminary_rank
  from public.preliminary_application_rankings as ranking
  join public.application_identities as ai
    on ai.application_id = ranking.application_id
  where ai.applicant_user_id = (select auth.uid());
$$;

revoke all on function public.get_my_application_rankings()
from public, anon, authenticated;
grant execute on function public.get_my_application_rankings()
to authenticated;

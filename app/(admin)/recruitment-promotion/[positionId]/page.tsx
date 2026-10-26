import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileNavigation from "../../mobile-navigation";

const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "Position Applicants | DepEd Southern Leyte",
};

function parsePageNumber(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export default async function PositionApplicantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ positionId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ positionId }, query] = await Promise.all([params, searchParams]);
  const requestedPage = parsePageNumber(query.page);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify your account: ${userError.message}`);
  }
  if (!user) {
    redirect("/");
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    throw new Error(`Unable to load your account roles: ${rolesError.message}`);
  }
  if (
    !roles.some(
      ({ role }) => role === "super_admin" || role === "division_personnel",
    )
  ) {
    redirect("/dashboard");
  }

  const { data: position, error: positionError } = await supabase
    .from("recruitment_positions")
    .select("id, recruitment_cycle_id, title, item_number")
    .eq("id", positionId)
    .maybeSingle();

  if (positionError) {
    throw new Error(`Unable to load the recruitment position: ${positionError.message}`);
  }
  if (!position) {
    notFound();
  }

  const { data: cycle, error: cycleError } = await supabase
    .from("recruitment_cycles")
    .select("name, organization_unit_id")
    .eq("id", position.recruitment_cycle_id)
    .maybeSingle();

  if (cycleError) {
    throw new Error(`Unable to load the recruitment cycle: ${cycleError.message}`);
  }
  if (!cycle) {
    notFound();
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organization_units")
    .select("name")
    .eq("id", cycle.organization_unit_id)
    .maybeSingle();

  if (organizationError) {
    throw new Error(`Unable to load the hiring organization: ${organizationError.message}`);
  }

  const { count, error: countError } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("position_id", position.id);

  if (countError) {
    throw new Error(`Unable to count position applicants: ${countError.message}`);
  }

  const totalApplicants = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalApplicants / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  if (requestedPage !== currentPage) {
    redirect(
      `/recruitment-promotion/${position.id}?page=${currentPage}`,
    );
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const { data: applications, error: applicationsError } =
    totalApplicants > 0
      ? await supabase
          .from("applications")
          .select("id, applicant_code, status, submitted_at")
          .eq("position_id", position.id)
          .order("submitted_at", { ascending: false })
          .range(startIndex, startIndex + PAGE_SIZE - 1)
      : { data: [], error: null };

  if (applicationsError) {
    throw new Error(`Unable to load position applicants: ${applicationsError.message}`);
  }

  const applicationIds = applications.map(({ id }) => id);
  const { data: identities, error: identitiesError } =
    applicationIds.length > 0
      ? await supabase
          .from("application_identities")
          .select("application_id, legal_name, contact_email, contact_number")
          .in("application_id", applicationIds)
      : { data: [], error: null };

  if (identitiesError) {
    throw new Error(`Unable to load applicant details: ${identitiesError.message}`);
  }

  const identitiesByApplicationId = new Map(
    identities.map((identity) => [identity.application_id, identity]),
  );
  const pageHref = (page: number) =>
    `/recruitment-promotion/${position.id}?page=${page}`;

  return (
    <div className="min-h-screen bg-[#f5f7f6] px-5 py-5 text-[#172b24] sm:px-8 sm:py-7 xl:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <MobileNavigation />
          <span className="rounded-full bg-[#edf6f0] px-3 py-1.5 text-[10px] font-bold text-[#397b51]">
            Recruitment administration
          </span>
        </div>

        <Link
          href="/recruitment-promotion"
          className="text-xs font-semibold text-[#397b51] hover:text-[#1e603b]"
        >
          ← Back to recruitment positions
        </Link>

        <header className="mt-5 rounded-2xl border border-[#e7ede8] bg-white p-5 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#528064]">
            {organization?.name ?? "Hiring organization"} · {cycle.name}
          </p>
          <h1 className="mt-2 text-[24px] font-bold tracking-[-0.04em] text-[#1b3025] sm:text-[30px]">
            {position.title}
          </h1>
          {position.item_number && (
            <p className="mt-1 text-sm text-[#7c8a82]">
              Item {position.item_number}
            </p>
          )}
          <p className="mt-4 text-sm text-[#53645a]">
            {totalApplicants} applicant{totalApplicants === 1 ? "" : "s"}
          </p>
        </header>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7ede8] bg-white">
          <div className="border-b border-[#eef1ef] px-5 py-4 sm:px-6">
            <h2 className="text-sm font-bold text-[#24382d]">
              Applicants
            </h2>
            <p className="mt-1 text-[11px] text-[#8a9790]">
              {totalApplicants === 0
                ? "No applicants have applied for this position yet."
                : `Showing ${startIndex + 1}–${Math.min(
                    startIndex + applications.length,
                    totalApplicants,
                  )} of ${totalApplicants}`}
            </p>
          </div>

          {applications.length > 0 && (
            <ul className="divide-y divide-[#eef1ef]">
              {applications.map((application) => {
                const identity = identitiesByApplicationId.get(application.id);

                return (
                  <li key={application.id} className="px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[#304238]">
                          {identity?.legal_name ?? "Identity unavailable"}
                        </h3>
                        <p className="mt-1 text-[11px] text-[#718078]">
                          Application {application.applicant_code}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#f2f4f2] px-3 py-1 text-[10px] font-semibold capitalize text-[#65756b]">
                        {application.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    {identity && (
                      <div className="mt-3 text-xs text-[#53645a]">
                        <p className="break-all">{identity.contact_email}</p>
                        {identity.contact_number && (
                          <p className="mt-1">{identity.contact_number}</p>
                        )}
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-[#859189]">
                      Applied {formatDateTime(application.submitted_at)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="Applicant list pagination"
              className="flex items-center justify-between border-t border-[#eef1ef] px-5 py-4 sm:px-6"
            >
              {currentPage > 1 ? (
                <Link
                  href={pageHref(currentPage - 1)}
                  className="rounded-lg border border-[#dfe8e2] px-3 py-2 text-xs font-semibold text-[#397b51] hover:bg-[#f8faf8]"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-xs text-[#718078]">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={pageHref(currentPage + 1)}
                  className="rounded-lg border border-[#dfe8e2] px-3 py-2 text-xs font-semibold text-[#397b51] hover:bg-[#f8faf8]"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}

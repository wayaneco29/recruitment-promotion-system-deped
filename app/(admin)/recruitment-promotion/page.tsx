import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileNavigation from "../mobile-navigation";
import CreatePositionForm from "./create-position-form";

export const metadata: Metadata = {
  title: "Recruitment & Promotion | DepEd Southern Leyte",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatEndDate(value: string): string {
  return formatDate(new Date(new Date(value).getTime() - 1).toISOString());
}

function getCurrentTimestamp() {
  return Date.now();
}

export default async function RecruitmentPromotionPage() {
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
    .select("role, organization_unit_id")
    .eq("user_id", user.id);

  if (rolesError) {
    throw new Error(`Unable to load your account roles: ${rolesError.message}`);
  }

  const isSuperAdmin = roles.some(({ role }) => role === "super_admin");
  const isDivisionPersonnel = roles.some(
    ({ role }) => role === "division_personnel",
  );

  if (!isSuperAdmin && !isDivisionPersonnel) {
    redirect("/dashboard");
  }

  let organizationUnits: { id: string; code: string; name: string }[] = [];
  if (isSuperAdmin) {
    const { data, error } = await supabase
      .from("organization_units")
      .select("id, code, name")
      .eq("is_active", true)
      .order("name");
    if (error) {
      throw new Error(`Unable to load hiring organizations: ${error.message}`);
    }
    organizationUnits = data;
  } else {
    const assignedUnitIds = [
      ...new Set(
        roles
          .filter(({ role }) => role === "division_personnel")
          .map(({ organization_unit_id }) => organization_unit_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (assignedUnitIds.length > 0) {
      const { data, error } = await supabase
        .from("organization_units")
        .select("id, code, name")
        .eq("is_active", true)
        .in("id", assignedUnitIds)
        .order("name");
      if (error) {
        throw new Error(
          `Unable to load hiring organizations: ${error.message}`,
        );
      }
      organizationUnits = data;
    }
  }

  const { data: cycles, error: cyclesError } = await supabase
    .from("recruitment_cycles")
    .select("id, name, starts_at, ends_at, is_open, organization_unit_id")
    .order("created_at", { ascending: false });
  if (cyclesError) {
    throw new Error(`Unable to load recruitment cycles: ${cyclesError.message}`);
  }

  const cycleIds = cycles.map(({ id }) => id);
  const { data: positions, error: positionsError } =
    cycleIds.length > 0
      ? await supabase
          .from("recruitment_positions")
          .select(
            "id, recruitment_cycle_id, title, item_number, description, is_open",
          )
          .in("recruitment_cycle_id", cycleIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (positionsError) {
    throw new Error(
      `Unable to load recruitment positions: ${positionsError.message}`,
    );
  }

  const applicantCounts = await Promise.all(
    positions.map(async (position) => {
      const { count, error } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("position_id", position.id);

      if (error) {
        throw new Error(
          `Unable to load applicant count for ${position.title}: ${error.message}`,
        );
      }

      return [position.id, count ?? 0] as const;
    }),
  );

  const cyclesById = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  const unitsById = new Map(
    organizationUnits.map((unit) => [unit.id, unit]),
  );
  const applicantCountByPositionId = new Map(applicantCounts);

  const now = getCurrentTimestamp();

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-[#172b24]">
      <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 sm:py-7 xl:px-10">
        <div className="mb-5 flex items-center justify-between">
          <MobileNavigation />
          <span className="rounded-full bg-[#edf6f0] px-3 py-1.5 text-[10px] font-bold text-[#397b51]">
            Recruitment administration
          </span>
        </div>

        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#528064]">
            Division workspace
          </p>
          <h1 className="mt-2 text-[26px] font-bold tracking-[-0.04em] text-[#1b3025] sm:text-[30px]">
            Recruitment &amp; promotion
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#7c8a82]">
            Publish hiring positions with their organization, item number,
            approved policy reference, and application period.
          </p>
        </header>

        <section className="mt-7 rounded-2xl border border-[#e7ede8] bg-white p-5 sm:p-7">
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#24372c]">
              Create a hiring position
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#859189]">
              A recruitment cycle will be created for this position. Publishing
              makes it visible to applicants during the dates you choose.
            </p>
          </div>
          <CreatePositionForm
            organizationUnits={organizationUnits.map((unit) => ({
              id: unit.id,
              code: unit.code,
              name: unit.name,
            }))}
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7ede8] bg-white">
          <div className="px-5 py-5 sm:px-6">
            <h2 className="text-sm font-bold text-[#24382d]">
              Hiring positions
            </h2>
            <p className="mt-1 text-[11px] text-[#8a9790]">
              Published positions and saved drafts in your organization scope.
            </p>
          </div>
          {positions.length === 0 ? (
            <p className="border-t border-[#eef1ef] px-5 py-8 text-center text-sm text-[#7c8a82]">
              No hiring positions have been created yet.
            </p>
          ) : (
            <ul className="divide-y divide-[#eef1ef]">
              {positions.map((position) => {
                const cycle = cyclesById.get(position.recruitment_cycle_id);
                if (!cycle) return null;
                const startsAt = new Date(cycle.starts_at).getTime();
                const endsAt = new Date(cycle.ends_at).getTime();
                const status =
                  !cycle.is_open || !position.is_open
                    ? "Draft"
                    : now < startsAt
                      ? "Scheduled"
                      : now < endsAt
                        ? "Open"
                        : "Closed";
                const unit = unitsById.get(cycle.organization_unit_id);
                const applicantCount =
                  applicantCountByPositionId.get(position.id) ?? 0;

                return (
                  <li
                    key={position.id}
                    className="px-5 py-4 sm:px-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#304238]">
                          <Link
                            href={`/recruitment-promotion/${position.id}`}
                            className="rounded-sm hover:text-[#26734a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#26734a]"
                          >
                            {position.title}
                          </Link>
                        </h3>
                        <p className="mt-1 text-xs text-[#859189]">
                          {position.item_number
                            ? `Item ${position.item_number} · `
                            : ""}
                          {unit?.name ?? "Organization"} · {cycle.name}
                        </p>
                        <p className="mt-1 text-[11px] text-[#859189]">
                          Applications: {formatDate(cycle.starts_at)} –{" "}
                          {formatEndDate(cycle.ends_at)}
                        </p>
                      </div>
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold ${
                          status === "Open"
                            ? "bg-[#edf6f0] text-[#26734a]"
                            : "bg-[#f2f4f2] text-[#78867e]"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="mt-3 border-t border-[#eef1ef] pt-3 text-xs text-[#718078]">
                      Applicants:{" "}
                      <span className="font-bold text-[#304238]">
                        {applicantCount}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

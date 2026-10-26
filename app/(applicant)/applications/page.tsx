import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireApplicant } from "../../(admin)/access";
import { getApplicantApplications } from "../../(admin)/applicant-applications";
import ApplicantWorkspaceHeader from "../../(admin)/applicant-workspace-header";
import MobileNavigation from "../../(admin)/mobile-navigation";
import ApplicationOpportunities, {
  type ApplicationOpportunity,
} from "./application-opportunities";

export const metadata: Metadata = {
  title: "Applications | DepEd Southern Leyte",
};

function getCurrentTimestamp() {
  return Date.now();
}

export default async function ApplicationsPage() {
  await requireApplicant();
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to load your account: ${userError.message}`);
  }
  if (!user) {
    throw new Error(
      "Unable to load application opportunities without an authenticated user.",
    );
  }

  const [
    { data: profile, error: profileError },
    { data: positions, error: positionsError },
    applicantApplications,
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("first_name, middle_name, last_name, name_suffix, phone_number")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("recruitment_positions")
      .select(
        "id, recruitment_cycle_id, title, item_number, description, is_open",
      )
      .eq("is_open", true)
      .order("created_at", { ascending: false }),
    getApplicantApplications(supabase, user.id),
  ]);

  if (profileError) {
    throw new Error(`Unable to load your profile: ${profileError.message}`);
  }
  if (positionsError) {
    throw new Error(
      `Unable to load open hiring positions: ${positionsError.message}`,
    );
  }

  const cycleIds = [
    ...new Set(
      positions.map(({ recruitment_cycle_id }) => recruitment_cycle_id),
    ),
  ];
  const { data: cycles, error: cyclesError } =
    cycleIds.length > 0
      ? await supabase
          .from("recruitment_cycles")
          .select(
            "id, name, organization_unit_id, policy_reference, starts_at, ends_at, is_open",
          )
          .in("id", cycleIds)
      : { data: [], error: null };

  if (cyclesError) {
    throw new Error(
      `Unable to load recruitment cycle details: ${cyclesError.message}`,
    );
  }

  const cyclesById = new Map(cycles.map((cycle) => [cycle.id, cycle]));

  const now = getCurrentTimestamp();
  const activePositions = positions.filter((position) => {
    const cycle = cyclesById.get(position.recruitment_cycle_id);
    if (!cycle) return false;
    return (
      cycle.is_open &&
      new Date(cycle.starts_at).getTime() <= now &&
      now < new Date(cycle.ends_at).getTime()
    );
  });
  console.log(activePositions);
  const activePositionIds = activePositions.map(({ id }) => id);
  const activeCycleIds = [
    ...new Set(
      activePositions.map(({ recruitment_cycle_id }) => recruitment_cycle_id),
    ),
  ];
  const activeUnitIds = [
    ...new Set(
      activeCycleIds
        .map((id) => cyclesById.get(id)?.organization_unit_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [
    { data: rules, error: rulesError },
    { data: organizationUnits, error: unitsError },
  ] =
    activePositionIds.length > 0
      ? await Promise.all([
          supabase
            .from("position_eligibility_rules")
            .select(
              "id, position_id, criterion_key, rule_type, numeric_threshold, text_threshold, description",
            )
            .in("position_id", activePositionIds)
            .order("criterion_key"),
          supabase
            .from("organization_units")
            .select("id, name")
            .in("id", activeUnitIds),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
        ];

  if (rulesError) {
    throw new Error(
      `Unable to load position eligibility information: ${rulesError.message}`,
    );
  }
  if (unitsError) {
    throw new Error(
      `Unable to load hiring organizations: ${unitsError.message}`,
    );
  }

  const rulesByPositionId = new Map<string, ApplicationOpportunity["rules"]>();
  for (const rule of rules) {
    const positionRules = rulesByPositionId.get(rule.position_id) ?? [];
    positionRules.push({
      id: rule.id,
      criterionKey: rule.criterion_key,
      ruleType: rule.rule_type,
      description: rule.description,
      numericThreshold: rule.numeric_threshold,
      textThreshold: rule.text_threshold,
    });
    rulesByPositionId.set(rule.position_id, positionRules);
  }

  const unitsById = new Map(
    organizationUnits.map((unit) => [unit.id, unit.name]),
  );
  const opportunities: ApplicationOpportunity[] = activePositions.map(
    (position) => {
      const cycle = cyclesById.get(position.recruitment_cycle_id);
      if (!cycle) {
        throw new Error(
          `Unable to load the recruitment cycle for position ${position.id}.`,
        );
      }

      return {
        id: position.id,
        title: position.title,
        itemNumber: position.item_number,
        description: position.description,
        cycleName: cycle.name,
        organizationName:
          unitsById.get(cycle.organization_unit_id) ?? "Hiring organization",
        policyReference: cycle.policy_reference,
        startsAt: cycle.starts_at,
        endsAt: cycle.ends_at,
        rules: rulesByPositionId.get(position.id) ?? [],
      };
    },
  );

  const applicantName = [
    profile?.first_name,
    profile?.middle_name,
    profile?.last_name,
    profile?.name_suffix,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ");
  const nameFromMetadata = [
    user.user_metadata.first_name,
    user.user_metadata.last_name,
  ]
    .filter((part): part is string => typeof part === "string" && Boolean(part))
    .join(" ");

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-[#172b24]">
      <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 sm:py-7 xl:px-10">
        <div className="mb-5 flex items-center justify-between">
          <MobileNavigation />
          <span className="rounded-full bg-[#edf6f0] px-3 py-1.5 text-[10px] font-bold text-[#397b51]">
            Applicant workspace
          </span>
        </div>

        <ApplicantWorkspaceHeader
          title="Applications"
          description="Browse open DepEd Southern Leyte hiring positions and submit an application during the posted application period."
          applications={applicantApplications}
        />

        <div className="mt-7">
          <h2 className="text-base font-bold text-[#24372c]">
            Open hiring positions
          </h2>
          <p className="mt-1 text-xs text-[#859189]">
            Review the position and application details before applying.
          </p>
        </div>
        <ApplicationOpportunities
          opportunities={opportunities}
          appliedPositionIds={applicantApplications.map(
            ({ positionId }) => positionId,
          )}
          applicantName={applicantName || nameFromMetadata}
          contactNumber={profile?.phone_number ?? ""}
        />
      </div>
    </main>
  );
}

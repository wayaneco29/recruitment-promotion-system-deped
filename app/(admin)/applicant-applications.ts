import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ApplicantApplication = {
  id: string;
  positionId: string;
  positionTitle: string;
  itemNumber: string | null;
  submittedAt: string;
  score: number | null;
  rank: number | null;
};

type ApplicantRankingRow = {
  application_id: string;
  preliminary_rank: number;
};

function isApplicantRankingRow(value: unknown): value is ApplicantRankingRow {
  return (
    typeof value === "object" &&
    value !== null &&
    "application_id" in value &&
    typeof value.application_id === "string" &&
    "preliminary_rank" in value &&
    typeof value.preliminary_rank === "number" &&
    Number.isFinite(value.preliminary_rank)
  );
}

export async function getApplicantApplications(
  supabase: SupabaseClient,
  applicantId: string,
): Promise<ApplicantApplication[]> {
  const { data: identities, error: identitiesError } = await supabase
    .from("application_identities")
    .select("application_id")
    .eq("applicant_user_id", applicantId);

  if (identitiesError) {
    throw new Error(
      `Unable to load your applications: ${identitiesError.message}`,
    );
  }

  if (identities.length === 0) {
    return [];
  }

  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("id, position_id, submitted_at")
    .in(
      "id",
      identities.map(({ application_id }) => application_id),
    )
    .order("submitted_at", { ascending: false });

  if (applicationsError) {
    throw new Error(
      `Unable to load your applications: ${applicationsError.message}`,
    );
  }

  if (applications.length === 0) {
    return [];
  }

  const applicationIds = applications.map(({ id }) => id);
  const positionIds = [
    ...new Set(applications.map(({ position_id }) => position_id)),
  ];
  const [
    { data: positions, error: positionsError },
    { data: screeningResults, error: screeningError },
    { data: rankings, error: rankingsError },
  ] = await Promise.all([
    supabase
      .from("recruitment_positions")
      .select("id, title, item_number")
      .in("id", positionIds),
    supabase
      .from("application_screening_results")
      .select("application_id, preliminary_score, completed_score_count")
      .in("application_id", applicationIds),
    supabase.rpc("get_my_application_rankings"),
  ]);

  if (positionsError) {
    throw new Error(
      `Unable to load your applied positions: ${positionsError.message}`,
    );
  }

  if (screeningError) {
    throw new Error(
      `Unable to load your application scores: ${screeningError.message}`,
    );
  }

  if (rankingsError) {
    throw new Error(
      `Unable to load your application rankings: ${rankingsError.message}`,
    );
  }

  if (!Array.isArray(rankings)) {
    throw new Error("Unable to load your application rankings: invalid response.");
  }

  const rankingRows: unknown[] = rankings;
  if (!rankingRows.every(isApplicantRankingRow)) {
    throw new Error("Unable to load your application rankings: invalid response.");
  }

  const positionsById = new Map(
    positions.map((position) => [position.id, position]),
  );
  const screeningByApplicationId = new Map(
    screeningResults.map((result) => [result.application_id, result]),
  );
  const rankingsByApplicationId = new Map<string, number>(
    rankingRows.map((result) => [
      result.application_id,
      result.preliminary_rank,
    ]),
  );

  return applications.map((application) => {
    const position = positionsById.get(application.position_id);

    if (!position) {
      throw new Error(
        `Unable to load the position for application ${application.id}.`,
      );
    }

    const screening = screeningByApplicationId.get(application.id);
    const score =
      screening &&
      screening.completed_score_count > 0 &&
      typeof screening.preliminary_score === "number" &&
      Number.isFinite(screening.preliminary_score)
        ? screening.preliminary_score
        : null;
    const rank = rankingsByApplicationId.get(application.id) ?? null;

    return {
      id: application.id,
      positionId: application.position_id,
      positionTitle: position.title,
      itemNumber: position.item_number,
      submittedAt: application.submitted_at,
      score,
      rank,
    };
  });
}

import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ApplicantRanking = {
  score: number | null;
  rank: number | null;
};

export async function getApplicantRanking(
  supabase: SupabaseClient,
  applicantId: string,
): Promise<ApplicantRanking> {
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
    return { score: null, rank: null };
  }

  const { data: latestApplication, error: applicationError } = await supabase
    .from("applications")
    .select("id")
    .in(
      "id",
      identities.map(({ application_id }) => application_id),
    )
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (applicationError) {
    throw new Error(
      `Unable to load your latest application: ${applicationError.message}`,
    );
  }

  if (!latestApplication) {
    return { score: null, rank: null };
  }

  const [
    { data: screeningResult, error: scoreError },
    { data: ranking, error: rankingError },
  ] = await Promise.all([
    supabase
      .from("application_screening_results")
      .select("preliminary_score, completed_score_count")
      .eq("application_id", latestApplication.id)
      .maybeSingle(),
    supabase
      .from("preliminary_application_rankings")
      .select("preliminary_rank")
      .eq("application_id", latestApplication.id)
      .maybeSingle(),
  ]);

  if (scoreError) {
    throw new Error(`Unable to load your applicant score: ${scoreError.message}`);
  }

  if (rankingError) {
    throw new Error(`Unable to load your applicant rank: ${rankingError.message}`);
  }

  const score =
    screeningResult &&
    screeningResult.completed_score_count > 0 &&
    typeof screeningResult.preliminary_score === "number" &&
    Number.isFinite(screeningResult.preliminary_score)
      ? screeningResult.preliminary_score
      : null;
  const rank =
    ranking &&
    typeof ranking.preliminary_rank === "number" &&
    Number.isFinite(ranking.preliminary_rank)
      ? ranking.preliminary_rank
      : null;

  if (
    !screeningResult ||
    score === null
  ) {
    return { score: null, rank };
  }

  return { score, rank };
}

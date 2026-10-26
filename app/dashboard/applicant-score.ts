import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getApplicantScore(
  supabase: SupabaseClient,
  applicantId: string,
): Promise<number | null> {
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
    return null;
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
    return null;
  }

  const { data: screeningResult, error: scoreError } = await supabase
    .from("application_screening_results")
    .select("preliminary_score, completed_score_count")
    .eq("application_id", latestApplication.id)
    .maybeSingle();

  if (scoreError) {
    throw new Error(`Unable to load your applicant score: ${scoreError.message}`);
  }

  if (
    !screeningResult ||
    screeningResult.completed_score_count === 0 ||
    typeof screeningResult.preliminary_score !== "number" ||
    !Number.isFinite(screeningResult.preliminary_score)
  ) {
    return null;
  }

  return screeningResult.preliminary_score;
}

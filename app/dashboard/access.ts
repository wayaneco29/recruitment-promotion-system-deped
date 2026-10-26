import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function hasApplicantRole() {
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

  const { data: applicantRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "applicant")
    .limit(1);

  if (rolesError) {
    throw new Error(
      `Unable to verify your account role: ${rolesError.message}`,
    );
  }

  return applicantRoles.length > 0;
}

export async function requireNonApplicant() {
  if (await hasApplicantRole()) {
    redirect("/dashboard/profile");
  }
}

export async function requireApplicant() {
  if (!(await hasApplicantRole())) {
    redirect("/dashboard");
  }
}

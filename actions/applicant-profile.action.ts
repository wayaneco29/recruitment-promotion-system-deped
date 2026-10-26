"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ApplicantProfileUpdate } from "@/app/dashboard/profile/types";

type UpdateProfileResult =
  | { success: true }
  | { success: false; message: string };

const fieldLimits: Record<keyof ApplicantProfileUpdate, number> = {
  first_name: 100,
  middle_name: 100,
  last_name: 100,
  name_suffix: 20,
  phone_number: 50,
  alternate_phone: 50,
  residential_address: 1000,
  date_of_birth: 10,
  sex: 40,
  current_position: 150,
  current_school_division: 200,
  employee_number: 50,
};

export async function updateApplicantProfile(
  input: ApplicantProfileUpdate,
): Promise<UpdateProfileResult> {
  if (!input || typeof input !== "object") {
    return { success: false, message: "Enter valid profile information." };
  }

  const values = {} as ApplicantProfileUpdate;
  for (const [field, limit] of Object.entries(fieldLimits) as [
    keyof ApplicantProfileUpdate,
    number,
  ][]) {
    const value = input[field];
    if (typeof value !== "string") {
      return { success: false, message: "Enter valid profile information." };
    }
    const normalized = value.trim();
    if (normalized.length > limit) {
      return {
        success: false,
        message: `${field.replaceAll("_", " ")} must be ${limit} characters or fewer.`,
      };
    }
    values[field] = normalized;
  }

  if (!values.first_name || !values.last_name) {
    return {
      success: false,
      message: "First name and last name are required.",
    };
  }

  if (
    values.date_of_birth &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(values.date_of_birth) ||
      Number.isNaN(Date.parse(`${values.date_of_birth}T00:00:00.000Z`)) ||
      new Date(`${values.date_of_birth}T00:00:00.000Z`)
        .toISOString()
        .slice(0, 10) !== values.date_of_birth ||
      values.date_of_birth > new Date().toISOString().slice(0, 10))
  ) {
    return {
      success: false,
      message: "Enter a valid date of birth that is not in the future.",
    };
  }

  if (
    values.sex &&
    !["Female", "Male", "Prefer not to say"].includes(values.sex)
  ) {
    return { success: false, message: "Choose a valid sex option." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      success: false,
      message: `Unable to verify your account: ${userError.message}`,
    };
  }

  if (!user) {
    return {
      success: false,
      message: "Your session has expired. Sign in again to update your profile.",
    };
  }

  const { data: applicantRole, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "applicant")
    .limit(1)
    .maybeSingle();

  if (roleError) {
    return {
      success: false,
      message: `Unable to verify your account role: ${roleError.message}`,
    };
  }

  if (!applicantRole) {
    return {
      success: false,
      message: "Only applicant accounts can update this profile.",
    };
  }

  const { error: updateError } = await supabase.rpc(
    "update_applicant_profile",
    {
      p_first_name: values.first_name,
      p_middle_name: values.middle_name || null,
      p_last_name: values.last_name,
      p_name_suffix: values.name_suffix || null,
      p_phone_number: values.phone_number || null,
      p_alternate_phone: values.alternate_phone || null,
      p_residential_address: values.residential_address || null,
      p_date_of_birth: values.date_of_birth || null,
      p_sex: values.sex || null,
      p_current_position: values.current_position || null,
      p_current_school_division: values.current_school_division || null,
      p_employee_number: values.employee_number || null,
    },
  );

  if (updateError) {
    return {
      success: false,
      message: `Unable to save your profile: ${updateError.message}`,
    };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

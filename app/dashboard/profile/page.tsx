import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireApplicant } from "../access";
import ProfileForm from "./profile-form";
import type { ApplicantProfile } from "./types";

export const metadata: Metadata = {
  title: "Profile | DepEd Southern Leyte",
};

export default async function ProfilePage() {
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
    throw new Error("Unable to load your profile without an authenticated user.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select(
      "email, first_name, middle_name, last_name, name_suffix, phone_number, alternate_phone, residential_address, date_of_birth, sex, current_position, current_school_division, employee_number",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Unable to load your profile: ${profileError.message}`);
  }

  const metadataFirstName =
    typeof user.user_metadata.first_name === "string"
      ? user.user_metadata.first_name
      : "";
  const metadataLastName =
    typeof user.user_metadata.last_name === "string"
      ? user.user_metadata.last_name
      : "";

  const initialProfile: ApplicantProfile = {
    email: profile?.email ?? user.email ?? "",
    first_name: profile?.first_name ?? metadataFirstName,
    middle_name: profile?.middle_name ?? "",
    last_name: profile?.last_name ?? metadataLastName,
    name_suffix: profile?.name_suffix ?? "",
    phone_number: profile?.phone_number ?? "",
    alternate_phone: profile?.alternate_phone ?? "",
    residential_address: profile?.residential_address ?? "",
    date_of_birth: profile?.date_of_birth ?? "",
    sex: profile?.sex ?? "",
    current_position: profile?.current_position ?? "",
    current_school_division: profile?.current_school_division ?? "",
    employee_number: profile?.employee_number ?? "",
  };

  return <ProfileForm initialProfile={initialProfile} />;
}

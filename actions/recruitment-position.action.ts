"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateRecruitmentPositionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export async function createRecruitmentPosition(
  _previousState: CreateRecruitmentPositionState,
  formData: FormData,
): Promise<CreateRecruitmentPositionState> {
  const organizationUnitId = field(formData, "organization_unit_id");
  const cycleName = field(formData, "cycle_name");
  const policyReference = field(formData, "policy_reference");
  const startsOn = field(formData, "starts_on");
  const endsOn = field(formData, "ends_on");
  const title = field(formData, "title");
  const itemNumber = field(formData, "item_number");
  const description = field(formData, "description");
  const isOpen = formData.get("is_open") === "on";

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      organizationUnitId,
    )
  ) {
    return { status: "error", message: "Choose an organization." };
  }
  if (!cycleName || cycleName.length > 150) {
    return {
      status: "error",
      message: "Enter a recruitment cycle name of 150 characters or fewer.",
    };
  }
  if (!policyReference || policyReference.length > 200) {
    return {
      status: "error",
      message: "Enter a policy reference of 200 characters or fewer.",
    };
  }
  if (!title || title.length > 200) {
    return {
      status: "error",
      message: "Enter a position title of 200 characters or fewer.",
    };
  }
  if (itemNumber.length > 100) {
    return {
      status: "error",
      message: "The item number must be 100 characters or fewer.",
    };
  }
  if (description.length > 4000) {
    return {
      status: "error",
      message: "The position description must be 4,000 characters or fewer.",
    };
  }
  if (!isValidDate(startsOn) || !isValidDate(endsOn) || endsOn < startsOn) {
    return {
      status: "error",
      message:
        "Enter a valid application period with an end date on or after the start date.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      status: "error",
      message: `Unable to verify your account: ${userError.message}`,
    };
  }
  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again to create a position.",
    };
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    return {
      status: "error",
      message: `Unable to verify your account role: ${rolesError.message}`,
    };
  }
  if (
    !roles.some(
      ({ role }) => role === "super_admin" || role === "division_personnel",
    )
  ) {
    return {
      status: "error",
      message: "You are not authorized to create recruitment positions.",
    };
  }

  const { error: createError } = await supabase.rpc(
    "create_recruitment_position",
    {
      p_organization_unit_id: organizationUnitId,
      p_cycle_name: cycleName,
      p_policy_reference: policyReference,
      p_starts_on: startsOn,
      p_ends_on: endsOn,
      p_title: title,
      p_item_number: itemNumber || null,
      p_description: description,
      p_is_open: isOpen,
    },
  );

  if (createError) {
    return {
      status: "error",
      message: `Unable to create the recruitment position: ${createError.message}`,
    };
  }

  revalidatePath("/recruitment-promotion");
  revalidatePath("/applications");
  return {
    status: "success",
    message: isOpen
      ? "The position is now open for applications."
      : "The position was saved as a draft.",
  };
}

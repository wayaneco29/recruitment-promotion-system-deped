"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateOrganizationUnitState = {
  status: "idle" | "success" | "error";
  message: string;
};

const unitTypes = ["division", "district", "school"] as const;

function isOrganizationUnitType(
  value: string,
): value is (typeof unitTypes)[number] {
  return unitTypes.some((unitType) => unitType === value);
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function createOrganizationUnit(
  _previousState: CreateOrganizationUnitState,
  formData: FormData,
): Promise<CreateOrganizationUnitState> {
  const name = field(formData, "name");
  const code = field(formData, "code").toUpperCase();
  const unitType = field(formData, "unit_type");
  const parentId = field(formData, "parent_id");

  if (!name || name.length > 150) {
    return {
      status: "error",
      message: "Enter an organization name of 150 characters or fewer.",
    };
  }
  if (!/^[A-Z0-9][A-Z0-9_-]{0,49}$/.test(code)) {
    return {
      status: "error",
      message:
        "Use a unique code of up to 50 letters, numbers, hyphens, or underscores.",
    };
  }
  if (!isOrganizationUnitType(unitType)) {
    return { status: "error", message: "Choose a valid organization type." };
  }
  if (
    parentId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      parentId,
    )
  ) {
    return { status: "error", message: "Choose a valid parent organization." };
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
      message: "Your session has expired. Sign in again to add an organization.",
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
  if (!roles.some(({ role }) => role === "super_admin")) {
    return {
      status: "error",
      message: "Only super admins can add organizations.",
    };
  }

  const { error: insertError } = await supabase
    .from("organization_units")
    .insert({
      name,
      code,
      unit_type: unitType,
      parent_id: parentId || null,
    });

  if (insertError) {
    const message = insertError.code === "23505"
      ? "That organization code is already in use. Enter a unique code."
      : `Unable to add the organization: ${insertError.message}`;
    return { status: "error", message };
  }

  revalidatePath("/organizations");
  revalidatePath("/recruitment-promotion");
  return {
    status: "success",
    message: `${name} was added as an organization.`,
  };
}

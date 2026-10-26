"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SubmitApplicationState = {
  status: "idle" | "success" | "error";
  message: string;
};

function value(formData: FormData, key: string): string {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

export async function submitApplication(
  positionId: string,
  _previousState: SubmitApplicationState,
  formData: FormData,
): Promise<SubmitApplicationState> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      positionId,
    )
  ) {
    return { status: "error", message: "Choose a valid hiring position." };
  }

  const legalName = value(formData, "legal_name");
  const contactNumber = value(formData, "contact_number");
  if (!legalName || legalName.length > 200) {
    return {
      status: "error",
      message: "Enter your legal name (200 characters or fewer).",
    };
  }
  if (contactNumber.length > 50) {
    return {
      status: "error",
      message: "Your contact number must be 50 characters or fewer.",
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
      message: "Your session has expired. Sign in again to apply.",
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
      status: "error",
      message: `Unable to verify your account role: ${roleError.message}`,
    };
  }
  if (!applicantRole) {
    return {
      status: "error",
      message: "Only applicant accounts can submit applications.",
    };
  }

  const { data: rules, error: rulesError } = await supabase
    .from("position_eligibility_rules")
    .select("id, criterion_key, rule_type")
    .eq("position_id", positionId)
    .order("criterion_key");

  if (rulesError) {
    return {
      status: "error",
      message: `Unable to load the position requirements: ${rulesError.message}`,
    };
  }

  const qualifications: {
    criterion_key: string;
    numeric_value: number | null;
    boolean_value: boolean | null;
    text_value: string | null;
  }[] = [];

  for (const rule of rules) {
    const rawValue = value(formData, `qualification_${rule.id}`);
    if (!rawValue) {
      return {
        status: "error",
        message: `Complete the "${rule.criterion_key}" requirement before submitting.`,
      };
    }

    if (rule.rule_type === "minimum") {
      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) {
        return {
          status: "error",
          message: `Enter a valid number for "${rule.criterion_key}".`,
        };
      }
      qualifications.push({
        criterion_key: rule.criterion_key,
        numeric_value: numericValue,
        boolean_value: null,
        text_value: null,
      });
    } else if (rule.rule_type === "must_have") {
      if (rawValue !== "true" && rawValue !== "false") {
        return {
          status: "error",
          message: `Choose an answer for "${rule.criterion_key}".`,
        };
      }
      qualifications.push({
        criterion_key: rule.criterion_key,
        numeric_value: null,
        boolean_value: rawValue === "true",
        text_value: null,
      });
    } else if (rule.rule_type === "equals") {
      if (rawValue.length > 500) {
        return {
          status: "error",
          message: `The answer for "${rule.criterion_key}" is too long.`,
        };
      }
      qualifications.push({
        criterion_key: rule.criterion_key,
        numeric_value: null,
        boolean_value: null,
        text_value: rawValue,
      });
    } else {
      return {
        status: "error",
        message: "This position has an unsupported eligibility requirement.",
      };
    }
  }

  const { error: submitError } = await supabase.rpc("create_application", {
    p_position_id: positionId,
    p_legal_name: legalName,
    p_contact_number: contactNumber || null,
    p_qualifications: qualifications,
  });

  if (submitError) {
    return {
      status: "error",
      message: `Unable to submit your application: ${submitError.message}`,
    };
  }

  revalidatePath("/applications");
  revalidatePath("/profile");
  return {
    status: "success",
    message: "Your application was submitted successfully.",
  };
}

"use server";

import { createClient } from "@/lib/supabase/server";

type SignupParams = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type SignupResult =
  | { success: true; requiresEmailConfirmation: boolean }
  | { success: false; message: string };

export async function handleSignup(
  input: SignupParams,
): Promise<SignupResult> {
  if (
    !input ||
    typeof input.firstName !== "string" ||
    typeof input.lastName !== "string" ||
    typeof input.email !== "string" ||
    typeof input.password !== "string"
  ) {
    return { success: false, message: "Enter valid sign-up information." };
  }

  const { firstName, lastName, email, password } = input;
  const normalizedFirstName = firstName.trim();
  const normalizedLastName = lastName.trim();
  const normalizedEmail = email.trim();

  if (!normalizedFirstName || !normalizedLastName) {
    return { success: false, message: "Enter your first and last name." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, message: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return {
      success: false,
      message: "Your password must be at least 8 characters long.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          full_name: `${normalizedFirstName} ${normalizedLastName}`,
        },
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      requiresEmailConfirmation: !data.session,
    };
  } catch {
    return {
      success: false,
      message: "We could not create your account. Please try again.",
    };
  }
}

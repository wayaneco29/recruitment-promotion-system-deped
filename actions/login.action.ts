"use server";

import { createClient } from "@/lib/supabase/server";

type LoginParams = {
  email: string;
  password: string;
};

type LoginResult =
  | { success: true }
  | { success: false; message: string };

export async function handleLogin(input: LoginParams): Promise<LoginResult> {
  if (
    !input ||
    typeof input.email !== "string" ||
    typeof input.password !== "string"
  ) {
    return { success: false, message: "Enter your email and password." };
  }

  const email = input.email.trim();
  const password = input.password;

  if (!email || !password) {
    return { success: false, message: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      success: false,
      message: "The email or password you entered is incorrect.",
    };
  }

  return { success: true };
}

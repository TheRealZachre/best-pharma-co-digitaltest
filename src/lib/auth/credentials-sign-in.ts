"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";

export type CredentialsSignInState = {
  error?: string;
};

export async function signInWithCredentials(
  _prevState: CredentialsSignInState | null,
  formData: FormData
): Promise<CredentialsSignInState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/") || "/";

  if (!login || !password) {
    return { error: "Invalid username, email, or password." };
  }

  await signOut({ redirect: false });

  try {
    const result = await signIn("credentials", {
      login,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Invalid username, email, or password." };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid username, email, or password." };
    }

    throw error;
  }

  redirect(callbackUrl);
}

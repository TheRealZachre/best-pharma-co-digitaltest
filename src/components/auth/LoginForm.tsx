"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  signInWithCredentials,
  type CredentialsSignInState,
} from "@/lib/auth/credentials-sign-in";

const inputClassName =
  "mt-1.5 w-full rounded-lg border border-brand-ink/10 bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const reset = searchParams.get("reset") === "1";
  const [state, formAction, pending] = useActionState<
    CredentialsSignInState | null,
    FormData
  >(signInWithCredentials, null);

  return (
    <div className="space-y-6">
      {reset && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Password updated. Sign in with your new password.
        </p>
      )}

      {googleEnabled && (
        <>
          <GoogleSignInButton callbackUrl={callbackUrl} disabled={pending} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-ink/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-brand-paper px-2 text-brand-muted">or</span>
            </div>
          </div>
        </>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <label className="block text-sm font-medium text-brand-ink">
          Email or username
          <input
            name="login"
            type="text"
            autoComplete="username"
            className={inputClassName}
            required
          />
        </label>

        <label className="block text-sm font-medium text-brand-ink">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className={inputClassName}
            required
          />
        </label>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-brand-indigo hover:text-brand-indigo-bright"
          >
            Forgot password?
          </Link>
        </div>

        {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-indigo-bright disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

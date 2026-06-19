"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const inputClassName =
  "mt-1.5 w-full rounded-lg border border-brand-ink/10 bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20";

export function ForgotPasswordForm() {
  const [login, setLogin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setDevResetUrl(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        devResetUrl?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not process request.");
        return;
      }

      setMessage(
        data.message ??
          "If an account exists, reset instructions have been sent."
      );
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-brand-ink">
          Email or username
          <input
            type="text"
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            className={inputClassName}
            required
          />
        </label>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {message && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </p>
        )}
        {devResetUrl && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Development mode:{" "}
            <Link href={devResetUrl} className="font-medium underline">
              use this reset link
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-indigo-bright disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-center text-sm text-brand-muted">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-indigo hover:text-brand-indigo-bright"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

const inputClassName =
  "mt-1.5 w-full rounded-lg border border-brand-ink/10 bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20";

interface AccountProfile {
  name: string;
  email: string;
  username: string;
  hasPassword: boolean;
}

export function AccountSettingsForm() {
  const router = useRouter();
  const { update } = useSession();

  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/account");
        const data = (await response.json()) as AccountProfile & {
          error?: string;
        };
        if (!response.ok) {
          setProfileError(data.error ?? "Could not load account.");
          return;
        }
        setProfile({
          name: data.name,
          email: data.email,
          username: data.username ?? "",
          hasPassword: data.hasPassword,
        });
      } catch {
        setProfileError("Could not load account.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          username: profile.username || undefined,
        }),
      });

      const data = (await response.json()) as AccountProfile & { error?: string };
      if (!response.ok) {
        setProfileError(data.error ?? "Could not update profile.");
        return;
      }

      setProfile({
        name: data.name,
        email: data.email,
        username: data.username ?? "",
        hasPassword: data.hasPassword,
      });
      await update({ name: data.name, email: data.email });
      setProfileSuccess("Profile updated.");
      router.refresh();
    } catch {
      setProfileError("Something went wrong. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: profile?.hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setPasswordError(data.error ?? "Could not update password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfile((prev) => (prev ? { ...prev, hasPassword: true } : prev));
      setPasswordSuccess(
        profile?.hasPassword
          ? "Password updated."
          : "Password set. You can now sign in with email or username."
      );
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-brand-muted">Loading account…</p>;
  }

  if (!profile) {
    return (
      <p className="text-sm text-rose-600">
        {profileError ?? "Could not load your account."}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-ink">Profile</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Update your name, email, and username.
        </p>

        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-brand-ink/80">
            Full name
            <input
              value={profile.name}
              onChange={(event) =>
                setProfile({ ...profile, name: event.target.value })
              }
              className={inputClassName}
              required
            />
          </label>

          <label className="block text-sm font-medium text-brand-ink/80">
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(event) =>
                setProfile({ ...profile, email: event.target.value })
              }
              className={inputClassName}
              required
            />
          </label>

          <label className="block text-sm font-medium text-brand-ink/80">
            Username
            <input
              value={profile.username}
              onChange={(event) =>
                setProfile({ ...profile, username: event.target.value })
              }
              autoComplete="username"
              placeholder="jane.doe"
              className={inputClassName}
            />
            <span className="mt-1 block text-xs text-brand-muted">
              Used to sign in instead of your email address.
            </span>
          </label>

          {profileError && <p className="text-sm text-rose-600">{profileError}</p>}
          {profileSuccess && (
            <p className="text-sm text-emerald-700">{profileSuccess}</p>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-indigo-bright disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-ink">Password</h2>
        <p className="mt-1 text-sm text-brand-muted">
          {profile.hasPassword
            ? "Change your password."
            : "Set a password to sign in with email or username in addition to Google."}
        </p>

        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
          {profile.hasPassword && (
            <label className="block text-sm font-medium text-brand-ink/80">
              Current password
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={inputClassName}
                required
              />
            </label>
          )}

          <label className="block text-sm font-medium text-brand-ink/80">
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={inputClassName}
              minLength={8}
              required
            />
          </label>

          <label className="block text-sm font-medium text-brand-ink/80">
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={inputClassName}
              minLength={8}
              required
            />
          </label>

          {passwordError && <p className="text-sm text-rose-600">{passwordError}</p>}
          {passwordSuccess && (
            <p className="text-sm text-emerald-700">{passwordSuccess}</p>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-indigo-bright disabled:opacity-60"
          >
            {savingPassword
              ? "Updating…"
              : profile.hasPassword
                ? "Update password"
                : "Set password"}
          </button>
        </form>
      </section>

      <p className="text-sm text-brand-muted">
        <Link href="/" className="font-medium text-brand-indigo hover:text-brand-indigo-bright">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}

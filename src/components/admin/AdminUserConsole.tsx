"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Shield, Trash2, UserPlus, Users } from "lucide-react";
import type { PublicUser, UserRole } from "@/lib/auth/types";

const inputClassName =
  "mt-1.5 w-full rounded-lg border border-brand-ink/10 bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20";

export function AdminUserConsole({
  initialUsers,
  currentUserId,
  scope = "platform",
}: {
  initialUsers: PublicUser[];
  currentUserId?: string;
  scope?: "platform" | "analytics";
}) {
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const createTitle =
    scope === "analytics"
      ? "Create analytics user account"
      : "Create user account";
  const createDescription =
    scope === "analytics"
      ? "Grant access to Best Pharma Co. Analytics reports and data sync. These credentials are separate from the main platform."
      : "Set a username and password so someone can sign in immediately.";
  const usersTitle =
    scope === "analytics" ? "Analytics users" : "Existing users";
  const usersDescription =
    scope === "analytics"
      ? `${users.length} analytics account${users.length === 1 ? "" : "s"} — independent from platform logins.`
      : `${users.length} account${users.length === 1 ? "" : "s"} in the system.`;

  const refreshUsers = useCallback(async () => {
    const response = await fetch("/api/admin/users");
    if (!response.ok) return;
    const data = (await response.json()) as { users: PublicUser[] };
    setUsers(data.users);
  }, []);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, username, password, role }),
      });

      const data = (await response.json()) as {
        error?: string;
        username?: string;
        emailed?: boolean;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not create user.");
        setLoading(false);
        return;
      }

      const emailNote = data.emailed
        ? "Welcome email sent."
        : "Welcome email was not sent — configure RESEND_API_KEY and AUTH_EMAIL_FROM.";
      setSuccess(
        `Created account for @${data.username ?? username}. ${emailNote}`
      );
      setName("");
      setEmail("");
      setUsername("");
      setPassword("");
      setRole("user");
      await refreshUsers();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(user: PublicUser) {
    const label = user.username ? `@${user.username}` : user.email;
    const confirmed = window.confirm(
      `Delete ${user.name} (${label})? This cannot be undone.`
    );
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    setDeletingUserId(user.id);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not delete user.");
        return;
      }

      setSuccess(`Deleted account for ${label}.`);
      await refreshUsers();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-indigo/10 text-brand-indigo">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">
              {createTitle}
            </h2>
            <p className="mt-1 text-sm text-brand-muted">{createDescription}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-brand-ink/80">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
              required
            />
          </label>

          <label className="block text-sm font-medium text-brand-ink/80">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="off"
              placeholder="jane.doe"
              className={inputClassName}
              required
            />
          </label>

          <label className="block text-sm font-medium text-brand-ink/80">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
              required
            />
          </label>

          <label className="block text-sm font-medium text-brand-ink/80">
            Temporary password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              className={inputClassName}
              required
            />
          </label>

          <label className="block text-sm font-medium text-brand-ink/80 md:col-span-2">
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className={inputClassName}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {error && (
            <p className="md:col-span-2 text-sm text-rose-600">{error}</p>
          )}
          {success && (
            <p className="md:col-span-2 text-sm text-emerald-700">{success}</p>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-indigo-bright disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-off-white text-brand-ink/80">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">
              {usersTitle}
            </h2>
            <p className="mt-1 text-sm text-brand-muted">{usersDescription}</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-ink/10 text-brand-muted">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Username</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Sign-in</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-brand-ink/8">
                  <td className="px-3 py-3 font-medium text-brand-ink">
                    {user.name}
                  </td>
                  <td className="px-3 py-3 text-brand-ink/80">
                    {user.username ? `@${user.username}` : "—"}
                  </td>
                  <td className="px-3 py-3 text-brand-ink/80">{user.email}</td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        user.role === "admin"
                          ? "inline-flex items-center gap-1 rounded-full bg-brand-indigo/10 px-2.5 py-1 text-xs font-medium text-brand-indigo"
                          : "rounded-full bg-brand-off-white px-2.5 py-1 text-xs font-medium text-brand-muted"
                      }
                    >
                      {user.role === "admin" && <Shield className="h-3 w-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-brand-muted">
                    {user.hasPassword ? "Password" : "Google only"}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => void handleDelete(user)}
                      disabled={
                        deletingUserId === user.id ||
                        user.id === currentUserId
                      }
                      title={
                        user.id === currentUserId
                          ? "You cannot delete your own account"
                          : "Delete user"
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingUserId === user.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

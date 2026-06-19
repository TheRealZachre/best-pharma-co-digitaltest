import type { UserRole } from "./types";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getAdminEmails(): string[] {
  return (process.env.AUTH_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function resolveRoleForEmail(
  email: string,
  options?: { isFirstUser?: boolean }
): UserRole {
  if (options?.isFirstUser) return "admin";
  if (getAdminEmails().includes(normalizeEmail(email))) return "admin";
  return "user";
}

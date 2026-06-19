import type { Session } from "next-auth";

export type SessionUserDisplay = {
  name?: string | null;
  email?: string | null;
};

export function sessionUserDisplay(
  session: Session | null | undefined
): SessionUserDisplay | null {
  if (!session?.user?.email) return null;

  return {
    name: session.user.name,
    email: session.user.email,
  };
}

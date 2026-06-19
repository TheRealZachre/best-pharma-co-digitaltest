import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminUser, isUserAdminById } from "@/lib/auth/users";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!(await isUserAdminById(session.user.id))) {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { session, response: null };
}

export function userIsAdmin(
  user: { role?: string } | null | undefined
): boolean {
  return isAdminUser(user ? { role: user.role as "admin" | "user" } : undefined);
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { sendWelcomeEmail } from "@/lib/auth/welcome-email";
import { createUserWithPassword, listUsers } from "@/lib/auth/users";
import { getAuthUrl } from "@/lib/env";
import type { UserRole } from "@/lib/auth/types";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      username?: string;
      password?: string;
      role?: UserRole;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    const role = body.role === "admin" ? "admin" : "user";

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const user = await createUserWithPassword({
      name,
      email,
      username,
      password,
      role,
    });

    const loginUrl =
      (await getAuthUrl()) ??
      new URL(request.url).origin;
    const emailed = await sendWelcomeEmail({
      email: user.email,
      name: user.name,
      username: user.username ?? username,
      password,
      loginUrl,
    });

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        hasPassword: true,
        emailed,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create user.";

    if (
      message.includes("already exists") ||
      message.includes("already taken") ||
      message.includes("Username must")
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

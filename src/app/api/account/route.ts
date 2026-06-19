import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  findUserById,
  updateUserPassword,
  updateUserProfile,
} from "@/lib/auth/users";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await findUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    hasPassword: Boolean(user.passwordHash),
    role: user.role,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      username?: string;
    };

    const user = await updateUserProfile(session.user.id, body);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      hasPassword: Boolean(user.passwordHash),
      role: user.role,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update profile.";
    const status = message.includes("already") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
      setPassword?: boolean;
    };

    const newPassword = body.newPassword ?? "";
    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required." },
        { status: 400 }
      );
    }

    const user = await findUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.passwordHash) {
      const currentPassword = body.currentPassword ?? "";
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required." },
          { status: 400 }
        );
      }
      await updateUserPassword(session.user.id, currentPassword, newPassword);
    } else {
      const { setUserPassword } = await import("@/lib/auth/users");
      await setUserPassword(session.user.id, newPassword);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update password.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/users";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { login?: string };
    const login = body.login?.trim() ?? "";

    if (!login) {
      return NextResponse.json(
        { error: "Email or username is required." },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;
    const result = await requestPasswordReset(login, origin);

    return NextResponse.json({
      ok: true,
      message:
        "If an account with a password exists for that email or username, reset instructions have been sent.",
      emailed: result.sent,
      devResetUrl: result.devResetUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not process request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

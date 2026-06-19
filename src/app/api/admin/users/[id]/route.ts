import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { deleteUser } from "@/lib/auth/users";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response || !session?.user.id) return response!;

  const { id } = await params;

  try {
    await deleteUser(id, { actingUserId: session.user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete user.";

    if (message === "User not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (
      message.includes("cannot delete") ||
      message.includes("Cannot delete")
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { auth } from "@/lib/auth";
import { sessionUserDisplay } from "@/lib/auth/session-user";
import { isUserAdminById } from "@/lib/auth/users";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const isAdmin = await isUserAdminById(session.user.id);

  return (
    <AppShell isAdmin={isAdmin} user={sessionUserDisplay(session)}>
      {children}
    </AppShell>
  );
}

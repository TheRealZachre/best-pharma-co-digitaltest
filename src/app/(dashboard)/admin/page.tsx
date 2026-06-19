import { redirect } from "next/navigation";
import { AdminUserConsole } from "@/components/admin/AdminUserConsole";
import { auth } from "@/lib/auth";
import { isUserAdminById, listUsers } from "@/lib/auth/users";

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
  const session = await auth();

  if (!session?.user?.id || !(await isUserAdminById(session.user.id))) {
    redirect("/");
  }

  const users = await listUsers();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-indigo">
          Platform Admin
        </p>
        <h1 className="mt-2 font-serif text-3xl text-brand-ink">
          Platform Admin Console
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-muted">
          Create username and password accounts for this platform.
        </p>
      </div>

      <AdminUserConsole
        initialUsers={users}
        currentUserId={session.user.id}
        scope="platform"
      />
    </div>
  );
}

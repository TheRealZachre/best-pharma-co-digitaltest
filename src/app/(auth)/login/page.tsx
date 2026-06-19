import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { auth } from "@/lib/auth";
import { googleEnabled } from "@/lib/auth/constants";

export default async function LoginPage() {
  const session = await auth();

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access your dashboard"
      vcfHref={session?.user ? "/" : "/login"}
    >
      <Suspense fallback={<p className="text-sm text-brand-muted">Loading…</p>}>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}

import type { ReactNode } from "react";
import { UserWelcomeBar } from "@/components/auth/UserWelcomeBar";
import type { SessionUserDisplay } from "@/lib/auth/session-user";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
  isAdmin?: boolean;
  user?: SessionUserDisplay | null;
}

export function AppShell({ children, isAdmin = false, user }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-brand-paper">
      <Sidebar isAdmin={isAdmin} user={user} />
      <main className="flex flex-1 flex-col overflow-auto">
        <UserWelcomeBar user={user} />
        {children}
      </main>
    </div>
  );
}

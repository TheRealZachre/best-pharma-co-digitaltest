"use client";

import { SignOutButton } from "./SignOutButton";
import { useSafeSession } from "./useSafeSession";
import type { SessionUserDisplay } from "@/lib/auth/session-user";

export function UserMenu({ user }: { user?: SessionUserDisplay | null }) {
  const session = useSafeSession();
  const email = user?.email ?? session?.user?.email;
  const name = user?.name ?? session?.user?.name;

  if (!email) return null;

  return (
    <div className="space-y-2">
      <div className="min-w-0">
        {name && (
          <p className="truncate text-sm font-medium text-brand-off-white">
            {name}
          </p>
        )}
        <p className="truncate text-xs text-brand-muted">{email}</p>
      </div>
      <SignOutButton />
    </div>
  );
}

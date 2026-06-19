"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <Link
      href="/signout"
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-brand-muted transition-colors hover:bg-white/5 hover:text-brand-off-white"
    >
      <LogOut className="h-3.5 w-3.5 shrink-0" />
      Sign out
    </Link>
  );
}

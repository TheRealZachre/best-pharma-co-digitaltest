"use client";

import { useContext } from "react";
import { SessionContext } from "next-auth/react";
import type { Session } from "next-auth";

export function useSafeSession(): Session | null {
  const context = useContext(SessionContext);
  return context?.data ?? null;
}

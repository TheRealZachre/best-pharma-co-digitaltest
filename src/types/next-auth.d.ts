import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/auth/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    role?: UserRole;
    name?: string;
    email?: string;
  }
}

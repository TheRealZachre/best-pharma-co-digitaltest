import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "@/lib/env";

export const authConfig = {
  secret: getAuthSecret(),
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isAuthRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/signout") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password");
      const isAuthApi = pathname.startsWith("/api/auth");
      const isPublicApi =
        isAuthApi || pathname.startsWith("/api/health");
      const isAdminRoute =
        pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
      const isStaticAsset =
        pathname.startsWith("/brand") ||
        /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname);

      if (isPublicApi || isStaticAsset) return true;

      if (isAuthRoute) {
        return true;
      }

      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        if (auth?.user?.role !== "admin") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user, trigger, session }) {
      if (user?.id) {
        return {
          sub: user.id,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          role: user.role ?? "user",
          picture: user.image ?? undefined,
        };
      }

      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name;
        if (typeof session.email === "string") token.email = session.email;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role =
          token.role === "admin" || token.role === "user"
            ? token.role
            : "user";
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.email === "string") session.user.email = token.email;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

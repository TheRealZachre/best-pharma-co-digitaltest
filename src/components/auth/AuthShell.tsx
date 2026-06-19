import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PLATFORM_NAME } from "@/lib/company";

export function AuthShell({
  title,
  subtitle,
  children,
  vcfHref = "/login",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  vcfHref?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-stage px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandLogo variant="full" showTagline vcfHref={vcfHref} />
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-paper p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl text-brand-ink">{title}</h1>
            <p className="mt-2 text-sm text-brand-muted">{subtitle}</p>
          </div>

          {children}
        </div>

        <p className="mt-6 text-center text-xs text-brand-muted">
          {PLATFORM_NAME} — secure access to your dashboard
        </p>
      </div>
    </div>
  );
}

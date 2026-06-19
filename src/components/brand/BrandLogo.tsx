import Link from "next/link";
import { BRAND_ASSETS } from "@/lib/brand";
import { CLIENT_NAME } from "@/lib/client";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "@/lib/company";

interface BrandLogoProps {
  variant?: "sidebar" | "compact" | "full";
  showTagline?: boolean;
  vcfHref?: string;
}

function BrandAsset({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return <img src={src} alt={alt} className={className} />;
}

function ClientLogoMark({
  variant,
}: {
  variant: BrandLogoProps["variant"];
}) {
  return (
    <div
      className={
        variant === "full"
          ? "mx-auto inline-flex rounded-lg bg-white px-3 py-2"
          : "inline-flex rounded-lg bg-white px-3 py-2"
      }
    >
      <BrandAsset
        src={BRAND_ASSETS.clientLogo}
        alt={CLIENT_NAME}
        className={
          variant === "full"
            ? "h-9 w-auto max-w-[10.5rem]"
            : "h-8 w-auto max-w-[9.5rem]"
        }
      />
    </div>
  );
}

export function BrandLogo({
  variant = "sidebar",
  showTagline = true,
  vcfHref,
}: BrandLogoProps) {
  const vibeCodeFlowWordmark = (
    <BrandAsset
      src={BRAND_ASSETS.wordmarkWhite}
      alt="Vibe. Code. Flow."
      className={
        variant === "full"
          ? "mx-auto mt-3 h-7 w-auto max-w-[12rem]"
          : "mt-2.5 h-7 w-auto max-w-[12rem]"
      }
    />
  );

  const vibeCodeFlowMark = vcfHref ? (
    <Link
      href={vcfHref}
      className="inline-block rounded-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-indigo-bright"
      aria-label="Vibe. Code. Flow."
    >
      {vibeCodeFlowWordmark}
    </Link>
  ) : (
    vibeCodeFlowWordmark
  );

  if (variant === "compact") {
    return (
      <BrandAsset
        src={BRAND_ASSETS.iconDark}
        alt={PLATFORM_NAME}
        className="h-9 w-9 shrink-0"
      />
    );
  }

  if (variant === "full") {
    return (
      <div className="text-center">
        <ClientLogoMark variant="full" />
        {showTagline && (
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-muted">
            {PLATFORM_TAGLINE}
          </p>
        )}
        {vibeCodeFlowMark}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <ClientLogoMark variant="sidebar" />
      {showTagline && (
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-muted">
          {PLATFORM_TAGLINE}
        </p>
      )}
      {vibeCodeFlowMark}
    </div>
  );
}

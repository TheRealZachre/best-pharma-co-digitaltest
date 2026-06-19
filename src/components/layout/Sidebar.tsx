"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AtSign,
  BookOpen,
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  FileBarChart,
  Globe,
  Image as ImageIcon,
  Info,
  Layers,
  Play,
  Share2,
  Shield,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { UserMenu } from "@/components/auth/UserMenu";
import { BRAND_ASSETS } from "@/lib/brand";
import { POWERED_BY_NAME } from "@/lib/company";
import type { SessionUserDisplay } from "@/lib/auth/session-user";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  links: NavLink[];
}

const wikipediaSection: NavSection = {
  id: "wikipedia",
  label: "Wikipedia Analytics",
  icon: Globe,
  links: [
    {
      href: "/wikipedia/corporate",
      label: "Corporate",
      icon: FileBarChart,
      exact: true,
    },
    {
      href: "/wikipedia/founder-ceo",
      label: "Founder & CEO",
      icon: User,
      exact: true,
    },
  ],
};

const founderSection: NavSection = {
  id: "founder",
  label: "Founder / CEO",
  icon: User,
  links: [
    {
      href: "/founder/reports/channels",
      label: "All Channels",
      icon: Layers,
      exact: true,
    },
    {
      href: "/founder/reports/channels/linkedin",
      label: "LinkedIn",
      icon: Share2,
    },
    {
      href: "/founder/reports/channels/x",
      label: "X",
      icon: AtSign,
    },
    {
      href: "/founder/reports/weekly",
      label: "Weekly Report",
      icon: Calendar,
    },
    {
      href: "/founder/reports/monthly",
      label: "Monthly Report",
      icon: CalendarDays,
    },
    {
      href: "/founder/reports/quarterly",
      label: "Quarterly Report",
      icon: CalendarRange,
    },
    {
      href: "/founder/methodology",
      label: "Scoring Methodology",
      icon: BookOpen,
    },
  ],
};

const analyticsSection: NavSection = {
  id: "analytics",
  label: "Corporate",
  icon: FileBarChart,
  links: [
    {
      href: "/reports/channels",
      label: "All Channels",
      icon: Layers,
      exact: true,
    },
    { href: "/reports/channels/linkedin", label: "LinkedIn", icon: Share2 },
    { href: "/reports/channels/instagram", label: "Instagram", icon: ImageIcon },
    { href: "/reports/channels/facebook", label: "Facebook", icon: Users },
    { href: "/reports/channels/x", label: "X", icon: AtSign },
    { href: "/reports/channels/youtube", label: "YouTube", icon: Play },
    { href: "/reports/weekly", label: "Weekly Report", icon: Calendar },
    { href: "/reports/monthly", label: "Monthly Report", icon: CalendarDays },
    {
      href: "/reports/quarterly",
      label: "Quarterly One-Pager",
      icon: CalendarRange,
    },
    { href: "/methodology", label: "Scoring Methodology", icon: BookOpen },
  ],
};

export function Sidebar({
  isAdmin = false,
  user,
}: {
  isAdmin?: boolean;
  user?: SessionUserDisplay | null;
}) {
  const pathname = usePathname();
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [founderOpen, setFounderOpen] = useState(false);
  const [wikipediaOpen, setWikipediaOpen] = useState(false);
  const adminActive = pathname.startsWith("/admin");
  const introActive = pathname === "/";

  useEffect(() => {
    if (adminActive) {
      setAnalyticsOpen(false);
      setFounderOpen(false);
      setWikipediaOpen(false);
    }
    if (pathname.startsWith("/founder")) {
      setFounderOpen(true);
    }
    if (pathname.startsWith("/wikipedia")) {
      setWikipediaOpen(true);
    }
  }, [adminActive, pathname]);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-brand-border bg-brand-stage text-brand-off-white">
      <div className="border-b border-brand-border px-5 py-5">
        <BrandLogo vcfHref="/" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {isAdmin && (
          <Link
            href="/admin"
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              adminActive
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/8 hover:text-white"
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            Platform Admin
          </Link>
        )}

        <Link
          href="/"
          className={clsx(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            introActive
              ? "bg-white/15 text-white"
              : "text-white/70 hover:bg-white/8 hover:text-white"
          )}
        >
          <Info className="h-4 w-4 shrink-0" />
          Introduction
        </Link>

        <CollapsibleSection
          section={analyticsSection}
          open={analyticsOpen}
          onToggle={() => setAnalyticsOpen((o) => !o)}
          pathname={pathname}
        />

        <CollapsibleSection
          section={founderSection}
          open={founderOpen}
          onToggle={() => setFounderOpen((o) => !o)}
          pathname={pathname}
        />

        <CollapsibleSection
          section={wikipediaSection}
          open={wikipediaOpen}
          onToggle={() => setWikipediaOpen((o) => !o)}
          pathname={pathname}
        />
      </nav>

      <div className="border-t border-brand-border p-4 space-y-4">
        <UserMenu user={user} />
        <div>
          <p className="text-xs text-brand-muted">Powered by</p>
          <img
            src={BRAND_ASSETS.wordmarkWhite}
            alt={POWERED_BY_NAME}
            className="mt-1.5 h-5 w-auto max-w-[9.5rem]"
          />
        </div>
      </div>
    </aside>
  );
}

function CollapsibleSection({
  section,
  open,
  onToggle,
  pathname,
}: {
  section: NavSection;
  open: boolean;
  onToggle: () => void;
  pathname: string;
}) {
  const Icon = section.icon;
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white"
        aria-expanded={open}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left leading-snug">{section.label}</span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 shrink-0 transition-transform",
            open ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="ml-5 mt-1 space-y-0.5 border-l border-brand-border pl-3">
          {section.links.map(({ href, label, icon: LinkIcon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                )}
              >
                <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowRight, Building2, BarChart2, Users, Zap, Globe } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CEO, CLIENT_NAME, WIKIPEDIA } from "@/lib/client";

const KEY_CAPABILITIES = [
  {
    icon: BarChart2,
    title: "Channel-by-channel breakdown",
    body: "See exactly how LinkedIn, X, Instagram, Facebook, YouTube, and TikTok are performing — followers, reach, engagement rate, and CTR all in one place.",
  },
  {
    icon: Zap,
    title: "Why posts land (and why they don't)",
    body: "Every post gets scored and explained. Green = working. Red = needs improvement. The analysis tells you which story beats to double down on and which to retire.",
  },
  {
    icon: Users,
    title: "Narrative arc tracking",
    body: "Posts are mapped over time by engagement score so you can see momentum — are you building a consistent story, or publishing in isolation?",
  },
];

export default function IntroductionPage() {
  return (
    <>
      <Header
        title={`${CLIENT_NAME} Digital Analytics`}
        subtitle="Demonstration environment — sample social performance reporting"
      />

      <div className="mx-auto w-full max-w-3xl px-8 py-10 space-y-10">

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-800">Demo environment</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-700">
                This is a demonstration only. Data shown here is for illustration
                purposes and should not be used for business decisions.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">
            One dashboard. Every channel. All the insight you need.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-brand-muted">
            This tool pulls live social data from {CLIENT_NAME}&apos;s corporate channels
            and the CEO&apos;s personal profiles, then turns it into clear, actionable reports —
            weekly, monthly, and quarterly. No spreadsheets. No manual pulls.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {KEY_CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-brand-ink/10 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-indigo/12">
                <Icon className="h-4.5 w-4.5 text-brand-indigo" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-brand-ink">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-brand-muted">{body}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-base font-bold text-brand-ink">Important limitations</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-muted">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-muted/40" />
              <span>
                <strong className="text-brand-ink">Paid social is not included</strong> in this dashboard.
                Paid performance data will be added once a contract is signed and API access is provided by {CLIENT_NAME}.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-muted/40" />
              Figures are for illustration only and may not reflect live accuracy.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-muted/40" />
              This is a demo site. A production license is required for day-to-day use.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-brand-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-ink">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-ink">Corporate Social Analytics</h2>
              <p className="text-xs text-brand-muted">LinkedIn · X · Instagram · Facebook · YouTube · TikTok</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            Full performance view across all <strong className="text-brand-ink">{CLIENT_NAME}</strong> corporate
            social channels. See what content themes are driving engagement, which platforms are growing,
            and where to focus next quarter.
          </p>
          <div className="mt-5">
            <Link
              href="/reports/channels"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-indigo-bright"
            >
              View Corporate
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-brand-ink/10 bg-brand-off-white">
              <Image
                src={CEO.photoUrl}
                alt={CEO.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-ink">Founder / CEO Social Analytics</h2>
              <p className="text-xs text-brand-muted">{CEO.name} · LinkedIn · X</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-brand-muted">
            Tracks the personal social media presence of{" "}
            <strong className="text-brand-ink">{CEO.name}</strong>, {CEO.title} of {CLIENT_NAME}.
            Uses the same scoring engine as the corporate section — engagement rates, story beats,
            narrative arc, and weekly / monthly / quarterly reports — but sourced entirely from{" "}
            {CEO.name.split(" ")[0]}&apos;s personal{" "}
            <a
              href={CEO.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-indigo hover:underline"
            >
              LinkedIn
            </a>{" "}
            and{" "}
            <a
              href={`https://x.com/${CEO.xHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-indigo hover:underline"
            >
              X (@{CEO.xHandle})
            </a>{" "}
            profiles.
          </p>
          <div className="mt-5">
            <Link
              href="/founder/reports/channels"
              className="inline-flex items-center gap-2 rounded-lg border border-brand-indigo/20 bg-brand-indigo/8 px-5 py-2.5 text-sm font-semibold text-brand-indigo transition-colors hover:bg-brand-indigo/12"
            >
              View Founder / CEO
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-off-white border border-brand-ink/10">
              <Globe className="h-5 w-5 text-brand-ink" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-ink">Wikipedia Analytics</h2>
              <p className="text-xs text-brand-muted">Corporate page · Founder / CEO page</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            Monitors the health and visibility of <strong className="text-brand-ink">{CLIENT_NAME}</strong>&apos; Wikipedia
            presence — including article quality grades, open maintenance flags, pageview trends, and an
            AI-powered editorial review with specific recommendations for improvement. Covers both the{" "}
            <a
              href={WIKIPEDIA.corporateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-indigo hover:underline"
            >
              corporate article
            </a>{" "}
            and the{" "}
            <a
              href={CEO.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-indigo hover:underline"
            >
              Founder / CEO article
            </a>.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/wikipedia/corporate"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-indigo-bright"
            >
              Corporate Wikipedia
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/wikipedia/founder-ceo"
              className="inline-flex items-center gap-2 rounded-lg border border-brand-indigo/20 bg-brand-indigo/8 px-5 py-2.5 text-sm font-semibold text-brand-indigo transition-colors hover:bg-brand-indigo/12"
            >
              Founder / CEO Wikipedia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}

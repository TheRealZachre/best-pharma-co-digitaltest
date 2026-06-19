import { Header } from "@/components/layout/Header";
import { WikipediaAudit } from "@/components/wikipedia/WikipediaAudit";
import { CEO } from "@/lib/client";

export default function WikipediaFounderPage() {
  return (
    <>
      <Header
        title="Wikipedia Analytics · Founder & CEO"
        subtitle={`${CEO.name} — traffic, maintenance flags & editorial review`}
      />
      <WikipediaAudit articleUrl={CEO.wikipediaUrl} />
    </>
  );
}

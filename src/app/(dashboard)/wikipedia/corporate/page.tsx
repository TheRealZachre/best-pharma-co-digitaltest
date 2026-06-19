import { Header } from "@/components/layout/Header";
import { WikipediaAudit } from "@/components/wikipedia/WikipediaAudit";
import { WIKIPEDIA } from "@/lib/client";

export default function WikipediaCorporatePage() {
  return (
    <>
      <Header
        title="Wikipedia Analytics · Corporate"
        subtitle={`${WIKIPEDIA.corporateTitle} — traffic, maintenance flags & editorial review`}
      />
      <WikipediaAudit articleUrl={WIKIPEDIA.corporateUrl} />
    </>
  );
}

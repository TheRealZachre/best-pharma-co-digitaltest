import { Header } from "@/components/layout/Header";
import { ScoringMethodology } from "@/components/methodology/ScoringMethodology";

export default function FounderMethodologyPage() {
  return (
    <>
      <Header
        title="Scoring Methodology"
        subtitle="How narrative engagement scores, story beats, and arc positioning are calculated — applied to founder content"
      />
      <ScoringMethodology />
    </>
  );
}

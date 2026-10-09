import type { Metadata } from "next";
import { FeatureGate } from "@/components/layout/feature-gate";
import { MarketingView } from "@/features/marketing/marketing-view";

export const metadata: Metadata = { title: "Marketing | VendeYaOnline" };

export default function MarketingPage() {
  return (
    <FeatureGate feature="marketing">
      <MarketingView />
    </FeatureGate>
  );
}

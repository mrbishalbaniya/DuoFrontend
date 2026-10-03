import type { Metadata } from "next";
import { FeatureGrid, MarketingPage, SectionTitle } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Smart matching",
  description: "How Duo suggests compatible people using your preferences, values, lifestyle and location.",
};

export default function SmartMatchingPage() {
  return (
    <MarketingPage
      eyebrow="Smart matching"
      title="Matches that actually make sense"
      intro="Duo looks beyond photos. We combine what you're looking for with what you share, so the people you see are worth your time."
    >
      <SectionTitle>What we look at</SectionTitle>
      <FeatureGrid
        items={[
          {
            icon: "tune",
            title: "Your preferences",
            body: "Age range, distance, gender and relationship goal decide who can appear for you.",
          },
          {
            icon: "temple_hindu",
            title: "Background",
            body: "Preferred religion, caste and rashi, including whether you're open to inter-caste or inter-religion matches.",
          },
          {
            icon: "favorite",
            title: "Values and lifestyle",
            body: "Shared values, lifestyle, career and hobbies add up to a compatibility score.",
          },
          {
            icon: "near_me",
            title: "Distance",
            body: "People nearby come first. When you run out, Duo can widen the search if you allow it.",
          },
          {
            icon: "verified",
            title: "Verified first",
            body: "Turn on verified-only to see just people who passed a selfie check.",
          },
          {
            icon: "auto_awesome",
            title: "Learns over time",
            body: "Your likes and skips help Duo understand your taste and improve suggestions.",
          },
        ]}
      />

      <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-primary/10 bg-secondary/30 p-6 sm:p-8">
        <h3 className="font-[var(--font-headline)] text-xl font-bold text-on-surface">You stay in control</h3>
        <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
          {[
            "Change your match preferences anytime from Match → Filters → More preferences.",
            "Only people who fit your filters appear. Nobody sees your profile until they match your preferences too.",
            "Skip freely. Nobody is told when you pass on them.",
          ].map((line) => (
            <li key={line} className="flex gap-2.5">
              <span className="material-symbols-outlined text-lg text-primary">check_circle</span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </MarketingPage>
  );
}

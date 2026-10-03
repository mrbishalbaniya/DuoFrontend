import type { Metadata } from "next";
import { FeatureGrid, MarketingPage, SectionTitle } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "How it works",
  description: "Create a profile, verify with a quick selfie, get thoughtful matches and start chatting on Duo.",
};

const STEPS = [
  {
    title: "Create your profile",
    body: "Add up to 3 photos, a short bio, and your background. Every photo is checked instantly for face, quality and safety.",
  },
  {
    title: "Get verified",
    body: "Take a quick selfie with a few random moves. You get a verified badge so people know you're real.",
  },
  {
    title: "Set your preferences",
    body: "Choose age, distance, religion, caste, rashi and more. Duo only shows people who fit what you want.",
  },
  {
    title: "Match and chat",
    body: "Like someone. When they like you back, it's a match and you can start chatting right away.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingPage
      eyebrow="How it works"
      title="From hello to a real connection"
      intro="Duo keeps dating simple and safe: real people, clear preferences, and matches that make sense."
    >
      <ol className="mx-auto grid max-w-3xl gap-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4 rounded-2xl border border-primary/10 bg-secondary/30 p-5 sm:p-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-brand font-bold text-white">
              {index + 1}
            </span>
            <div>
              <h3 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16">
        <SectionTitle>Built for trust</SectionTitle>
        <FeatureGrid
          items={[
            { icon: "verified_user", title: "Verified profiles", body: "Selfie checks confirm people match their photos." },
            { icon: "shield", title: "Photo safety checks", body: "Explicit, fake and duplicate photos are blocked automatically." },
            { icon: "block", title: "Block and report", body: "Remove anyone from your experience in one tap." },
          ]}
        />
      </div>
    </MarketingPage>
  );
}

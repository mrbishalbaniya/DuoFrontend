import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Safety tips",
  description: "Practical tips for staying safe while dating online and meeting in person with Duo.",
};

const SECTIONS = [
  {
    icon: "chat",
    title: "While chatting",
    tips: [
      "Keep conversations on Duo until you feel comfortable.",
      "Never send money, gift cards or bank details to someone you met online.",
      "Don't share your home address, workplace or daily routine early on.",
      "Be careful with anyone who avoids video calls or has excuses not to meet.",
    ],
  },
  {
    icon: "place",
    title: "Meeting in person",
    tips: [
      "Meet in a busy public place like a café or restaurant.",
      "Tell a friend or family member where you're going and who you're meeting.",
      "Arrange your own transport so you can leave whenever you want.",
      "Stay in control of your drinks and belongings.",
    ],
  },
  {
    icon: "verified_user",
    title: "Trust the signals",
    tips: [
      "Look for the verified badge. It means the person passed a live selfie check.",
      "Watch for stories that change, pressure to move fast, or requests for secrecy.",
      "If something feels off, it's okay to stop replying.",
    ],
  },
  {
    icon: "flag",
    title: "Block and report",
    tips: [
      "Use Block to stop someone from contacting you or seeing your profile.",
      "Report anyone who is abusive, asks for money, or seems fake. Reports are private.",
      "In an emergency, contact local police (Nepal: 100) right away.",
    ],
  },
];

export default function SafetyTipsPage() {
  return (
    <MarketingPage
      eyebrow="Safety tips"
      title="Date with confidence"
      intro="Most people are here for the right reasons. These simple habits help you stay safe online and when you meet."
      cta={null}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-2xl border border-primary/10 bg-secondary/30 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <span className="material-symbols-outlined">{section.icon}</span>
              </span>
              <h2 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">{section.title}</h2>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-on-surface-variant">
              {section.tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-on-surface-variant">
        Need help with something specific?{" "}
        <Link href="/help" className="font-semibold text-primary hover:underline">
          Visit the Help Center
        </Link>
      </p>
    </MarketingPage>
  );
}

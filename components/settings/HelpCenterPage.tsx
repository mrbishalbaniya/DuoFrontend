"use client";

import Link from "next/link";
import { SecurityPageShell } from "@/components/security/SecurityPageShell";

function HelpRow({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-container-high/60 md:px-5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-on-surface">{title}</p>
        <p className="mt-0.5 text-sm text-on-surface-variant">{description}</p>
      </div>
      <span className="material-symbols-outlined shrink-0 text-on-surface-variant">chevron_right</span>
    </Link>
  );
}

const GUIDES = [
  {
    icon: "favorite",
    title: "Getting started with matching",
    description: "How Discovery, likes, and matches work",
  },
  {
    icon: "shield",
    title: "Staying safe while dating",
    description: "Tips for meeting people you match with",
  },
  {
    icon: "account_balance_wallet",
    title: "Coins, Premium & payments",
    description: "How billing and eSewa top-ups work",
  },
];

export function HelpCenterPage() {
  return (
    <SecurityPageShell title="Help center" backHref="/settings">
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Get help
          </h2>
          <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
            <HelpRow icon="quiz" title="FAQ" description="Answers to common questions" href="/help/faq" />
            <div className="border-t border-outline-variant/20" />
            <HelpRow
              icon="support_agent"
              title="Contact support"
              description="Get help from the Duo team"
              href="/help/contact"
            />
            <div className="border-t border-outline-variant/20" />
            <HelpRow
              icon="bug_report"
              title="Report a bug"
              description="Tell us what went wrong"
              href="/help/report-bug"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Guides
          </h2>
          <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
            {GUIDES.map((g, idx) => (
              <div key={g.title}>
                {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
                <HelpRow icon={g.icon} title={g.title} description={g.description} href="/help/faq" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </SecurityPageShell>
  );
}

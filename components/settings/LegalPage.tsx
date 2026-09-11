"use client";

import { SecurityPageShell } from "@/components/security/SecurityPageShell";

export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalPage({
  title,
  updatedLabel,
  intro,
  sections,
}: {
  title: string;
  updatedLabel: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <SecurityPageShell title={title} backHref="/settings">
      <div className="space-y-6">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          {updatedLabel}
        </p>
        <p className="px-1 text-sm leading-relaxed text-on-surface-variant">{intro}</p>

        <div className="space-y-5">
          {sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-2xl border border-primary/10 bg-secondary/30 p-5"
            >
              <h2 className="font-[var(--font-headline)] text-base font-bold text-on-surface">
                {section.heading}
              </h2>
              <div className="mt-2 space-y-2">
                {section.body.map((paragraph, idx) => (
                  <p key={idx} className="text-sm leading-relaxed text-on-surface-variant">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </SecurityPageShell>
  );
}

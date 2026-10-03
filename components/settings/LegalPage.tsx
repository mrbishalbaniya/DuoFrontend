import { MarketingPage } from "@/components/marketing/MarketingPage";

export interface LegalSection {
  heading: string;
  body: string[];
}

/** Terms / Privacy: public page with the site navbar and footer (no app sidebar). */
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
    <MarketingPage eyebrow={updatedLabel} title={title} intro={intro} cta={null}>
      <div className="mx-auto max-w-3xl space-y-4">
        {sections.map((section, index) => (
          <section
            key={section.heading}
            className="rounded-2xl border border-primary/10 bg-secondary/30 p-5 sm:p-6"
          >
            <h2 className="flex items-baseline gap-3 font-[var(--font-headline)] text-lg font-bold text-on-surface">
              <span className="text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span>
              {section.heading}
            </h2>
            <div className="mt-3 space-y-2.5">
              {section.body.map((paragraph, idx) => (
                <p key={idx} className="text-sm leading-relaxed text-on-surface-variant sm:text-[15px]">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </MarketingPage>
  );
}

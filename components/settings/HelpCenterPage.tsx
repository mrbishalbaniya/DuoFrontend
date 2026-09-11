"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
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

type GuideData = { icon: string; title: string; description: string };

export function HelpCenterPage() {
  const t = useTranslations("settingsExtra.help");
  const guides = t.raw("guides") as GuideData[];

  return (
    <SecurityPageShell title={t("pageTitle")} backHref="/settings">
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {t("getHelpSection")}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
            <HelpRow icon="quiz" title={t("faqTitle")} description={t("faqDescription")} href="/help/faq" />
            <div className="border-t border-outline-variant/20" />
            <HelpRow
              icon="support_agent"
              title={t("contactTitle")}
              description={t("contactDescription")}
              href="/help/contact"
            />
            <div className="border-t border-outline-variant/20" />
            <HelpRow
              icon="bug_report"
              title={t("reportBugTitle")}
              description={t("reportBugDescription")}
              href="/help/report-bug"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {t("guidesSection")}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
            {guides.map((g, idx) => (
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

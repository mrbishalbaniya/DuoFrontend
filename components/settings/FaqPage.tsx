"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SecurityPageShell } from "@/components/security/SecurityPageShell";

type FaqItemData = { q: string; a: string };

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left md:px-5"
      >
        <span className="font-semibold text-on-surface">{q}</span>
        <span className="material-symbols-outlined shrink-0 text-on-surface-variant">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open ? (
        <p className="px-4 pb-4 text-sm leading-relaxed text-on-surface-variant md:px-5">{a}</p>
      ) : null}
    </div>
  );
}

export function FaqPage() {
  const t = useTranslations("settingsExtra.faq");
  const items = t.raw("items") as FaqItemData[];

  return (
    <SecurityPageShell title={t("pageTitle")} backHref="/help">
      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
        {items.map((item, idx) => (
          <div key={item.q}>
            {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
            <FaqItem q={item.q} a={item.a} />
          </div>
        ))}
      </div>
    </SecurityPageShell>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

/** Shared layout for public info pages linked from the homepage footer. */
export function MarketingPage({
  eyebrow,
  title,
  intro,
  children,
  cta = { label: "Create your free profile", href: "/register" },
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  cta?: { label: string; href: string } | null;
}) {
  return (
    <div className="relative min-h-screen bg-surface">
      <Navbar inFlow homeStyle />
      <main className="mx-auto w-full max-w-5xl overflow-x-clip px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <h1 className="mt-3 font-[var(--font-headline)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-on-surface-variant sm:text-lg">{intro}</p>
        </header>

        <div className="mt-12 sm:mt-16">{children}</div>

        {cta ? (
          <section className="mt-16 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-secondary/40 to-accent/10 p-8 text-center sm:p-12">
            <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface sm:text-3xl">
              Ready to meet someone real?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant sm:text-base">
              Join free in a few minutes. Verified profiles, thoughtful matches, no pressure.
            </p>
            <Link
              href={cta.href}
              className="mt-6 inline-flex rounded-full gradient-brand px-7 py-3 font-bold text-white shadow-lg shadow-primary/25"
            >
              {cta.label}
            </Link>
          </section>
        ) : null}

      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}

export function FeatureGrid({ items }: { items: { icon: string; title: string; body: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl border border-primary/10 bg-secondary/30 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <span className="material-symbols-outlined">{item.icon}</span>
          </span>
          <h3 className="mt-4 font-[var(--font-headline)] text-lg font-bold text-on-surface">{item.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-6 text-center font-[var(--font-headline)] text-2xl font-bold text-on-surface sm:text-3xl">
      {children}
    </h2>
  );
}

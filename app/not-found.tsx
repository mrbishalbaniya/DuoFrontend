import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found | Duo",
  description: "This page wandered off. Head back to Duo and keep finding meaningful connections.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="not-found-page relative flex min-h-screen flex-col overflow-hidden bg-background text-on-surface">
      <div className="not-found-glow not-found-glow--primary" aria-hidden />
      <div className="not-found-glow not-found-glow--accent" aria-hidden />
      <div className="not-found-grid" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-6 pb-2 pt-8 sm:px-10">
        <Link
          href="/"
          className="font-[var(--font-headline)] text-2xl font-black tracking-tight text-gradient-brand transition-opacity hover:opacity-90"
        >
          Duo
        </Link>
        <Link
          href="/login"
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
        >
          Sign in
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 text-center sm:px-10">
        <div className="not-found-orbit mb-8 flex h-28 w-28 items-center justify-center sm:mb-10 sm:h-32 sm:w-32">
          <span
            className="material-symbols-outlined text-[3.25rem] text-primary sm:text-[3.75rem]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
        </div>

        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">
          Error 404
        </p>

        <div className="not-found-code relative mb-5 select-none sm:mb-6">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 translate-x-[3px] translate-y-[2px] font-[var(--font-headline)] text-[7.5rem] font-black leading-none tracking-tighter text-primary/20 sm:text-[9.5rem]"
          >
            404
          </span>
          <h1 className="relative font-[var(--font-headline)] text-[7.5rem] font-black leading-none tracking-tighter text-gradient-brand sm:text-[9.5rem]">
            404
          </h1>
        </div>

        <h2 className="max-w-lg font-[var(--font-headline)] text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          This match got away
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-on-surface-variant sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist or moved. Your next connection is
          still waiting — let&apos;s get you back on track.
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:mt-12 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="gradient-brand inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[1.15rem]">home</span>
            Back home
          </Link>
          <Link
            href="/match"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-surface-container px-8 py-3.5 text-sm font-bold text-on-surface transition-all hover:border-primary/30 hover:bg-surface-bright active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[1.15rem]">favorite</span>
            Find matches
          </Link>
        </div>

        <nav
          className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-on-surface-variant sm:mt-12"
          aria-label="Helpful links"
        >
          <Link href="/discover" className="transition-colors hover:text-primary">
            Discover
          </Link>
          <span className="text-outline/40" aria-hidden>
            ·
          </span>
          <Link href="/chat" className="transition-colors hover:text-primary">
            Messages
          </Link>
          <span className="text-outline/40" aria-hidden>
            ·
          </span>
          <Link href="/register" className="transition-colors hover:text-primary">
            Join Duo
          </Link>
        </nav>
      </main>

      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-on-surface-variant/70 sm:px-10">
        Duo — Find your life partner, intuitively.
      </footer>
    </div>
  );
}

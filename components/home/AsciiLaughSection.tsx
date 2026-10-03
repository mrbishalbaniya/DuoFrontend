import { AsciiArt } from "@/components/ui/lol";

/** Full-width animated ASCII band (two hands reaching out), below the profile stream on the home page. */
export function AsciiLaughSection() {
  return (
    <section aria-labelledby="ascii-laugh-title" className="relative w-full overflow-hidden bg-surface"
      // Heights inline so a stale cached stylesheet can't collapse the band.
      style={{ height: "90svh", minHeight: 560 }}
    >
      {/* The hands sit low in the video; anchor near the bottom so the band isn't mostly empty sky. */}
      <AsciiArt className="absolute inset-0 h-full w-full" objectPosition="50% 80%" />
      {/* Fade into the neighbouring sections and keep the caption readable */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-surface) 0%, transparent 8%, transparent 82%, var(--color-surface) 100%)",
        }}
      />
      <div className="relative z-10 flex h-full items-end justify-center px-6 pb-12 text-center sm:pb-16">
        <div>
          <h2
            id="ascii-laugh-title"
            className="font-[var(--font-headline)] text-2xl font-extrabold tracking-tight text-on-surface sm:text-4xl"
          >
            Every great story starts with reaching out.
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant sm:text-base">
            Say hello. The right person might be reaching back.
          </p>
        </div>
      </div>
    </section>
  );
}

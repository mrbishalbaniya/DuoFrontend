"use client";

import Link from "next/link";
import { ImageStreamHero, type StreamImage } from "@/components/ui/image-stream-hero";

/** Portrait photos (Unsplash, free licence) shown as profile cards in the corridor. */
const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=600&h=800&fit=crop&q=80`;

const PROFILE_IMAGES: StreamImage[] = [
  "photo-1500648767791-00dcc994a43e",
  "photo-1517841905240-472988babdf9",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1534528741775-53994a69daeb",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1438761681033-6461ffad8d80",
  "photo-1539571696357-5a69c17a67c6",
  "photo-1544005313-94ddf0286df2",
  "photo-1519085360753-af0119f7cbe7",
  "photo-1494790108377-be9c29b29330",
  "photo-1531746020798-e6953c6e8e04",
  "photo-1524504388940-b1c1722653e1",
].map((id) => ({ src: unsplash(id), alt: "Duo member profile photo" }));

/** Below the hero: profile cards streaming out of the centre, with the invite on top. */
export function ProfileStreamSection() {
  return (
    <section aria-labelledby="profile-stream-title" className="bg-surface">
      <ImageStreamHero
        images={PROFILE_IMAGES}
        path={{ cardRadius: 1.2 }}
        // Slower than the 18s default: a calmer drift for the profile cards.
        speed={30}
        className="w-full"
        style={{ height: "clamp(560px, 80svh, 760px)" }}
      >
        {/* Soft vignette so the copy stays readable over the cards */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% 50%, color-mix(in srgb, var(--color-surface) 70%, transparent) 0%, transparent 70%), linear-gradient(to bottom, var(--color-surface) 0%, transparent 18%, transparent 82%, var(--color-surface) 100%)",
          }}
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-between px-6 py-12 text-center sm:py-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Real people near you</p>
            <h2
              id="profile-stream-title"
              className="mt-3 text-balance font-[var(--font-headline)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-5xl"
            >
              Thousands of verified profiles,
              <br />
              one of them is yours.
            </h2>
          </div>
          <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-balance text-sm text-on-surface-variant sm:text-base">
              Swipe through people who share your values, goals and way of life. Every match starts
              with a real face.
            </p>
            <Link
              href="/register"
              className="rounded-full px-7 py-3 font-bold text-white shadow-lg shadow-primary/25 gradient-brand transition-transform hover:-translate-y-0.5"
            >
              Start matching
            </Link>
          </div>
        </div>
      </ImageStreamHero>
    </section>
  );
}

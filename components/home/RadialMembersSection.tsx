"use client";

import RadialSpreadHero, { type RadialSpreadImage } from "@/components/ui/radial-spread-hero";

/** Portrait photos (Unsplash, free licence) that fan out into an orbit on scroll. */
const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=600&h=800&fit=crop&crop=faces&q=80`;

const MEMBER_PHOTOS: RadialSpreadImage[] = [
  "photo-1534528741775-53994a69daeb",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1438761681033-6461ffad8d80",
  "photo-1500648767791-00dcc994a43e",
  "photo-1544005313-94ddf0286df2",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1494790108377-be9c29b29330",
  "photo-1519085360753-af0119f7cbe7",
].map((id) => ({ src: unsplash(id), alt: "Duo member portrait" }));

/** Below the hero: a stack of member cards spreads into a circle around the pitch. */
export function RadialMembersSection() {
  return (
    <RadialSpreadHero
      images={MEMBER_PHOTOS}
      title={
        <>
          Your circle is <span className="text-primary">waiting.</span>
        </>
      }
      description="Scroll to meet people who share your values, goals and way of life. Every one of them is looking for someone like you."
    />
  );
}

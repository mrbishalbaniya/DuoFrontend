import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import BottomNav from "@/components/BottomNav";
import { HomePageShell } from "@/components/home/HomePageShell";
import { DuoGlyphHero } from "@/components/home/DuoGlyphHero";
import { AsciiLaughSection } from "@/components/home/AsciiLaughSection";
import { RadialMembersSection } from "@/components/home/RadialMembersSection";
import { StoriesSection } from "@/components/home/StoriesSection";
import Link from "next/link";
import { ANDROID_APK_DOWNLOAD_URL } from "@/lib/mobileApp";

export default function LandingPage() {
  return (
    <HomePageShell>
      <>
      <Navbar sticky={false} />
      <main className="overflow-x-clip mobile-bottom-nav-offset">
        <DuoGlyphHero />
        <RadialMembersSection />
        <AsciiLaughSection />
        <StoriesSection />
      </main>

      <SiteFooter />

      <BottomNav />
      </>
    </HomePageShell>
  );
}

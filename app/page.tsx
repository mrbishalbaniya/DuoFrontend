import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { BorderRotate } from "@/components/ui/animated-gradient-border";
import { DuoTestimonialsSection } from "@/components/ui/testimonial-slider";
import { HeroSection03 } from "@/components/ui/hero-03";
import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden mobile-bottom-nav-offset">
        <HeroSection03 />

        {/* Features */}
        <section className="pt-10 pb-14 sm:pb-16 md:pt-12 md:pb-24 px-4 sm:px-6 border-y border-white/[0.04]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-12 md:mb-16 space-y-3 sm:space-y-4">
              <p className="premium-section-label">The Duo Experience</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-[var(--font-headline)] font-extrabold text-on-surface">
                Designed for Real Connection
              </h2>
              <div className="premium-divider" />
              <p className="text-on-surface-variant max-w-2xl mx-auto">
                Our features prioritize your privacy, time, and emotional well-being above all else.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              <div className="premium-card p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2rem] group transition-all hover:-translate-y-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 transition-colors group-hover:bg-primary group-hover:text-white">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    swipe
                  </span>
                </div>
                <h3 className="text-xl font-[var(--font-headline)] font-bold text-on-surface mb-4">
                  Swipe discovery
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Experience a fluid, intentional browsing experience that makes finding matches
                  engaging yet respectful.
                </p>
              </div>

              <div className="premium-card-featured p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2rem] text-white transition-all hover:-translate-y-2">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                </div>
                <h3 className="text-xl font-[var(--font-headline)] font-bold mb-4">Smart matching</h3>
                <p className="opacity-90 leading-relaxed font-medium">
                  Our proprietary algorithm considers 150+ cultural, professional, and personal
                  data points for higher compatibility.
                </p>
              </div>

              <div className="premium-card p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2rem] group transition-all hover:-translate-y-2">
                <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mb-8 transition-colors group-hover:bg-accent group-hover:text-white">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    forum
                  </span>
                </div>
                <h3 className="text-xl font-[var(--font-headline)] font-bold text-on-surface mb-4">
                  Secure chat
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  End-to-end encrypted messaging with built-in boundaries and safety controls for
                  your peace of mind.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-14 sm:py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 sm:gap-10 md:gap-12">
            <div className="flex-1 space-y-8 sm:space-y-10 md:space-y-12 text-center md:text-left w-full">
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-[var(--font-headline)] font-extrabold text-on-surface text-balance">
                  The digital heirlooms we build together.
                </h2>
                <p className="text-on-surface-variant text-base sm:text-lg">
                  We don&apos;t just count matches; we count long-term unions that enrich families
                  and futures.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 max-w-sm mx-auto md:mx-0">
                <div className="premium-stat">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-[var(--font-headline)] font-black text-gradient-brand">
                    10k+
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mt-2">
                    Verified Profiles
                  </p>
                </div>
                <div className="premium-stat">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-[var(--font-headline)] font-black text-accent">
                    85%
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mt-2">
                    Success Rate
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full relative max-w-lg md:max-w-none mx-auto">
              <div className="premium-frame rounded-2xl sm:rounded-[2rem] aspect-[4/3] sm:aspect-video overflow-hidden">
                <img
                  alt="Luxury event"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7I4p4r0b9H2LHGqONfFLG0aUlqlCGhRjuquU4C-e1qx0tcEzbsZmuja7bXv50UgyW3xNJn4WbvaB8D7aSoQbpI9zIcJootiPwzaKmygf4aMFHUb-q4Akosp1mOTtjeohZH-dGiYA6d9ux2N_K2xAX8QqLk5szniZhO4zNOm9_2y7IlLrwr_USOHerELTabLpXa_p15RBFirCA79izzYPTyTNzZ9ZI8yr4-UYmDw2ZMPU9A2Et7UtS7-5freoXvFI4pHzG-SS913o"
                />
              </div>
              <div className="absolute top-3 right-3 sm:-top-4 sm:-right-2 md:-top-6 md:-right-6 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white premium-card-featured shadow-xl">
                <span
                  className="material-symbols-outlined text-2xl sm:text-3xl md:text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
              </div>
            </div>
          </div>
        </section>

        <DuoTestimonialsSection />

        {/* CTA */}
        <section className="py-14 sm:py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <BorderRotate
              className="w-full"
              borderRadius={24}
              borderWidth={2}
              animationSpeed={6}
              animationMode="auto-rotate"
              gradientColors={{
                primary: "#8a2445",
                secondary: "#e84a7a",
                accent: "#d4a574",
              }}
            >
              <div className="premium-card w-full border-0 p-6 sm:p-10 md:p-16 lg:p-20 text-center relative overflow-hidden shadow-none">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                <div className="relative z-10 space-y-5 sm:space-y-6 md:space-y-8">
                  <p className="premium-section-label">Begin Your Journey</p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-[var(--font-headline)] font-extrabold text-on-surface text-balance">
                    Your story begins
                    <br className="hidden min-[400px]:inline" />
                    <span className="min-[400px]:hidden"> </span>
                    with a single hello.
                  </h2>
                  <p className="text-on-surface-variant max-w-xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed px-1">
                    Join the most trusted community for meaningful connections today. Registration
                    is free and takes less than 2 minutes.
                  </p>
                  <div className="flex justify-center px-1">
                    <Link
                      href="/registration"
                      className="btn-premium w-full max-w-sm sm:w-auto text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5"
                    >
                      Create Your Free Profile
                    </Link>
                  </div>
                </div>
              </div>
            </BorderRotate>
          </div>
        </section>
      </main>

      <footer className="bg-secondary/50 py-12 sm:py-16 md:py-20 px-4 sm:px-6 border-t border-primary/10 mobile-bottom-nav-offset md:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-10 sm:mb-12 md:mb-16">
            <div className="space-y-5 sm:space-y-6 sm:col-span-2 md:col-span-1">
              <span className="text-2xl font-black text-gradient-brand font-[var(--font-headline)] tracking-tight">
                Duo
              </span>
              <p className="text-on-surface-variant leading-relaxed text-sm sm:text-base">
                Redefining modern relationships through intuitive matching and cultural respect.
              </p>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-primary/10 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white hover:border-transparent transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-lg">public</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-primary/10 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white hover:border-transparent transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-lg">share</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-[var(--font-headline)] font-bold text-on-surface mb-4 sm:mb-6 uppercase text-xs tracking-widest">
                Platform
              </h4>
              <ul className="space-y-3 sm:space-y-4 text-on-surface-variant text-sm font-medium">
                <li><Link className="hover:text-primary transition-colors" href="#">How it Works</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Smart Matching</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Mobile App</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-[var(--font-headline)] font-bold text-on-surface mb-4 sm:mb-6 uppercase text-xs tracking-widest">
                Support
              </h4>
              <ul className="space-y-3 sm:space-y-4 text-on-surface-variant text-sm font-medium">
                <li><Link className="hover:text-primary transition-colors" href="#">Help Center</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Safety Tips</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Terms of Service</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Privacy Policy</Link></li>
              </ul>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <h4 className="font-[var(--font-headline)] font-bold text-on-surface mb-4 sm:mb-6 uppercase text-xs tracking-widest">
                Newsletter
              </h4>
              <p className="text-sm text-on-surface-variant mb-4">
                Get relationship insights delivered monthly.
              </p>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-high border border-primary/10 rounded-full px-6 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/25 outline-none"
                  placeholder="Email address"
                  type="email"
                />
                <button className="absolute right-1 top-1 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary/90">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-xs text-on-surface-variant font-medium">
              © 2024 Duo Inc. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <Link className="hover:text-primary" href="#">English</Link>
              <Link className="hover:text-primary" href="#">Nepali</Link>
              <Link className="hover:text-primary" href="#">Hindi</Link>
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
    </>
  );
}

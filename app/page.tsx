import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 pb-40 md:pb-0 overflow-hidden bg-surface">
        {/* Hero Section */}
        <section className="relative min-h-[calc(100dvh-4rem)] md:min-h-[795px] flex items-center px-5 sm:px-6 md:px-12 lg:px-24">
          <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] -z-10" />
          <div className="absolute bottom-20 left-[-5%] w-[400px] h-[400px] bg-accent/12 rounded-full blur-[80px] -z-10" />
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-8 md:py-0">
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest font-[var(--font-label)]">
                Premium Matchmaking
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-[var(--font-headline)] font-extrabold text-on-surface leading-[1.1] tracking-tight">
                Find your life partner,{" "}
                <span className="text-gradient-brand">intuitively.</span>
              </h1>
              <p className="text-lg sm:text-xl text-on-surface-variant max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Duo blends deep-rooted tradition with advanced algorithmic
                matching to guide you toward a connection that feels like home.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 pt-2 md:pt-4">
                <Link
                  href="/onboarding"
                  className="gradient-brand-br text-white px-8 py-4 rounded-full font-[var(--font-headline)] font-extrabold text-lg shadow-xl shadow-primary/25 active:scale-95 transition-all text-center"
                >
                  Get Started
                </Link>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 rounded-full text-on-surface-variant font-[var(--font-headline)] font-bold text-lg bg-secondary/80 border border-primary/10 hover:bg-secondary transition-colors text-center"
                >
                  Explore Stories
                </Link>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative mt-4 lg:mt-0">
              <div className="relative w-full max-w-md mx-auto lg:max-w-none aspect-[4/5] rounded-[2rem] overflow-hidden shadow-[0_24px_48px] shadow-primary/20 z-20 border border-primary/10">
                <img
                  alt="South Asian couple"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2Xs-BpWlNA5C48md9PoK6K_FrwzfsuYE6k_vsg_VZT4DAkGLM_iPqcE6jV39BC2NXHAOe6AZopCHCOOrSelZm5FnGWB0zb8vA5o3YNxrQpBo3K8CrddBdYXN1hVZlL0h9HgpOfUkIXSqBn2ZEbMT1IOiOTlsu7fkfzR5GKgSIc2tpMVzm-45b5bU2JrORNDAkvQW8DO0uvryeUdhmj0UCQYnnpmQTbBLw4Wz_y5YsfITt9Rsk9VIBLfgUZNilY6D9FwrNQtvlfZs"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-6 left-4 sm:-bottom-10 sm:-left-6 md:-left-16 bg-background/90 backdrop-blur-xl p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2rem] shadow-[0_16px_40px] shadow-primary/15 z-30 max-w-[260px] sm:max-w-xs border border-primary/15">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-md shrink-0">
                    <img
                      alt="Profile portrait"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD78Y9AV_cFd8Au7pMtL4lmCBn__b9aJADXX6egbQXIOI5G9er0QKfam5QlFV05_6mjmba9BnmxB9WN4y7UUPxwdBU75QaXkKgQAkzRP0XiEZB-ImuAkoSdZk-9V-bYDqzOjMhvyT3anGm2-h63qyW7jsk4zXU04srN0wNsJ65nYgllvp3laDOGjSg9RQyx1FZ0KjHUZRVwzxKWRlrIWoyhnDrn_ZVSECMo3JONFlX69g4tWI7KaQfA4jEFB4ZS4SFuWCfOplrpPCU"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-[var(--font-headline)] font-bold text-on-surface truncate">
                      Priya Sharma
                    </h4>
                    <p className="text-xs text-accent font-semibold">Matched 98%</p>
                  </div>
                </div>
                <p className="text-sm italic text-on-surface-variant leading-snug">
                  &ldquo;The platform understood exactly what I was looking for in a partner.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 px-5 sm:px-6 bg-secondary/35">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-[var(--font-headline)] font-extrabold text-on-surface">
                Designed for Real Connection
              </h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">
                Our features prioritize your privacy, time, and emotional well-being above all else.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-background p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_50px] shadow-primary/8 border border-primary/10 group transition-all hover:-translate-y-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 transition-colors group-hover:gradient-brand-br group-hover:text-white">
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

              <div className="gradient-brand-br p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-primary/25 text-white transition-all hover:-translate-y-2">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-8">
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

              <div className="bg-background p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_50px] shadow-primary/8 border border-primary/10 group transition-all hover:-translate-y-2">
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
        <section className="py-16 md:py-24 px-5 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-12">
            <div className="flex-1 space-y-10 md:space-y-12 text-center md:text-left">
              <div className="space-y-4 md:space-y-6">
                <h2 className="text-3xl sm:text-4xl font-[var(--font-headline)] font-extrabold text-on-surface">
                  The digital heirlooms we build together.
                </h2>
                <p className="text-on-surface-variant text-lg">
                  We don&apos;t just count matches; we count long-term unions that enrich families
                  and futures.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:gap-8 max-w-sm mx-auto md:mx-0">
                <div>
                  <span className="text-3xl sm:text-4xl font-[var(--font-headline)] font-black text-primary">
                    10k+
                  </span>
                  <p className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mt-2">
                    Verified Profiles
                  </p>
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-[var(--font-headline)] font-black text-accent">
                    85%
                  </span>
                  <p className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mt-2">
                    Success Rate
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <div className="bg-surface-variant rounded-[2rem] aspect-video overflow-hidden border border-primary/10 shadow-[0_12px_32px] shadow-primary/10">
                <img
                  alt="Luxury event"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7I4p4r0b9H2LHGqONfFLG0aUlqlCGhRjuquU4C-e1qx0tcEzbsZmuja7bXv50UgyW3xNJn4WbvaB8D7aSoQbpI9zIcJootiPwzaKmygf4aMFHUb-q4Akosp1mOTtjeohZH-dGiYA6d9ux2N_K2xAX8QqLk5szniZhO4zNOm9_2y7IlLrwr_USOHerELTabLpXa_p15RBFirCA79izzYPTyTNzZ9ZI8yr4-UYmDw2ZMPU9A2Et7UtS7-5freoXvFI4pHzG-SS913o"
                />
              </div>
              <div className="absolute -top-4 -right-2 sm:-top-6 sm:-right-6 w-20 h-20 sm:w-24 sm:h-24 gradient-brand-br rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30">
                <span
                  className="material-symbols-outlined text-3xl sm:text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 px-5 sm:px-6">
          <div className="max-w-5xl mx-auto bg-background rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center shadow-[0_24px_60px] shadow-primary/12 border border-primary/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/8 via-secondary/40 to-accent/10" />
            <div className="relative z-10 space-y-6 md:space-y-8">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-[var(--font-headline)] font-extrabold text-on-surface">
                Your story begins with a single hello.
              </h2>
              <p className="text-on-surface-variant max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
                Join the most trusted community for meaningful connections today. Registration is
                free and takes less than 2 minutes.
              </p>
              <div className="flex justify-center">
                <Link
                  href="/onboarding"
                  className="gradient-brand-br text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-[var(--font-headline)] font-extrabold text-base sm:text-lg shadow-2xl shadow-primary/30 active:scale-95 transition-all"
                >
                  Create Your Free Profile
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-secondary/50 py-16 md:py-20 px-5 sm:px-6 border-t border-primary/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
            <div className="space-y-5 sm:space-y-6 sm:col-span-2 md:col-span-1">
              <span className="text-2xl font-black text-gradient-brand font-[var(--font-headline)] tracking-tight">
                Duo
              </span>
              <p className="text-on-surface-variant leading-relaxed text-sm sm:text-base">
                Redefining modern relationships through intuitive matching and cultural respect.
              </p>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-background border border-primary/10 flex items-center justify-center text-on-surface-variant hover:gradient-brand-br hover:text-white hover:border-transparent transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-lg">public</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-background border border-primary/10 flex items-center justify-center text-on-surface-variant hover:gradient-brand-br hover:text-white hover:border-transparent transition-all cursor-pointer">
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
                  className="w-full bg-background border border-primary/10 rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-primary/25 outline-none"
                  placeholder="Email address"
                  type="email"
                />
                <button className="absolute right-1 top-1 gradient-brand-br text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-on-surface-variant font-medium">
              © 2024 Duo Inc. All rights reserved.
            </p>
            <div className="flex gap-6 sm:gap-8 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
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

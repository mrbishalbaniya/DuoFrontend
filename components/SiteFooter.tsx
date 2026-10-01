import Link from "next/link";
import { ANDROID_APK_DOWNLOAD_URL } from "@/lib/mobileApp";

/**
 * Duo's social accounts. Replace each href with the real profile URL once the
 * accounts exist (they point to each network's homepage until then).
 * Icons are simple-icons paths (CC0), since lucide no longer ships brand logos.
 */
const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/",
    path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z",
  },
  {
    name: "X",
    href: "https://x.com/",
    path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z",
  },
] as const;

/** Site footer shared by the homepage and public info pages. */
export function SiteFooter() {
  return (
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
              <li><Link className="hover:text-primary transition-colors" href="/how-it-works">How it Works</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/smart-matching">Smart Matching</Link></li>
              <li>
                <a
                  className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                  href={ANDROID_APK_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <span className="material-symbols-outlined text-base">android</span>
                  Download Android APK
                </a>
              </li>
              <li><Link className="hover:text-primary transition-colors" href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-[var(--font-headline)] font-bold text-on-surface mb-4 sm:mb-6 uppercase text-xs tracking-widest">
              Support
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-on-surface-variant text-sm font-medium">
              <li><Link className="hover:text-primary transition-colors" href="/help">Help Center</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/safety">Safety Tips</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/legal/terms">Terms of Service</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/legal/privacy">Privacy Policy</Link></li>
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
          <ul className="flex items-center gap-2" aria-label="Duo on social media">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Duo on ${social.name}`}
                  title={social.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/10 bg-surface-container-high text-on-surface-variant transition-all hover:border-transparent hover:bg-primary hover:text-white"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                    <path d={social.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

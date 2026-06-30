import type { ReactNode } from "react";
import type { Viewport } from "next";
import Script from "next/script";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GoogleOAuthProviderWrapper } from "@/components/auth/google-oauth-provider";
import { LenisProvider } from "@/components/lenis-provider";
import "./globals.css";

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("duo_theme");
    var mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
    var resolved =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolved);
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`;

export const metadata = {
  title: "Duo - Find Your Life Partner, Intuitively",
  description:
    "Duo blends deep-rooted tradition with advanced algorithmic matching to guide you toward a connection that feels like home.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased text-on-surface">
        <Script id="duo-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <LenisProvider>
          <div className="app-background" aria-hidden="true" />
          <GoogleOAuthProviderWrapper>
            <ThemeProvider>
              <AuthProvider>{children}</AuthProvider>
            </ThemeProvider>
          </GoogleOAuthProviderWrapper>
        </LenisProvider>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import type { Viewport } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleOAuthProviderWrapper } from "@/components/auth/google-oauth-provider";
import { LenisProvider } from "@/components/lenis-provider";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased text-on-surface">
        <LenisProvider>
          <div className="app-background" aria-hidden="true" />
          <GoogleOAuthProviderWrapper>
            <AuthProvider>{children}</AuthProvider>
          </GoogleOAuthProviderWrapper>
        </LenisProvider>
      </body>
    </html>
  );
}

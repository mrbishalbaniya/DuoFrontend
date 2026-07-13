import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://duo.app";

export const siteConfig = {
  name: "Duo",
  title: "Duo — Find Your Life Partner, Intuitively",
  description:
    "Duo blends deep-rooted tradition with advanced algorithmic matching to guide you toward a connection that feels like home.",
  url: siteUrl,
  ogImage: "/logo.png",
  twitterHandle: "@duoapp",
} as const;

type PageMetadataInput = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description = siteConfig.description,
  path = "",
  noIndex = false,
}: PageMetadataInput): Metadata {
  const url = `${siteConfig.url}${path}`;
  const fullTitle = title === siteConfig.name ? siteConfig.title : `${title} | ${siteConfig.name}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [{ url: siteConfig.ogImage, width: 512, height: 512, alt: siteConfig.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [siteConfig.ogImage],
      creator: siteConfig.twitterHandle,
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
    shortcut: ["/logo.png"],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [{ url: siteConfig.ogImage, width: 512, height: 512, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export function jsonLdWebApplication() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web, iOS, Android",
  };
}

import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login/google/", "/verify/device"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

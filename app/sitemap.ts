import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/login",
    "/register",
    "/match",
    "/discover",
    "/chat",
    "/map",
    "/profile",
    "/settings",
    "/insights",
    "/wallet",
    "/verify",
  ];

  const now = new Date();
  return routes.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "daily",
    priority: path === "" ? 1 : path === "/match" || path === "/discover" ? 0.9 : 0.7,
  }));
}

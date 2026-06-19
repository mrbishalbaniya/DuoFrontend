/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      // Turbopack on Windows can't resolve country-flag-icons/unicode re-exports.
      "country-flag-icons/unicode": "./lib/shims/country-flag-icons-unicode.ts",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;

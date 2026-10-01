import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */

// Map/tile providers used by MapLibre (basemaps, terrain, satellite, labels).
const MAP_TILE_HOSTS = [
  "https://*.cartocdn.com",
  "https://tile.openstreetmap.org",
  "https://server.arcgisonline.com",
  "https://*.tile.opentopomap.org",
  "https://tile.opentopomap.org",
  "https://s3.amazonaws.com",
  "https://nominatim.openstreetmap.org",
  "https://openweathermap.org",
];

function buildContentSecurityPolicy() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ?? "";
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "") ?? "";
  const connectSrc = [
    "'self'",
    apiUrl,
    wsUrl,
    apiUrl.replace(/^http/, "ws"),
    wsUrl.replace(/^https/, "wss"),
    "https://*.googleapis.com",
    "https://*.google.com",
    "https://*.gstatic.com",
    "https://res.cloudinary.com",
    "https://*.sentry.io",
    "https://*.firebaseio.com",
    "https://*.googleusercontent.com",
    "wss://*.onrender.com",
    "https://*.onrender.com",
    ...MAP_TILE_HOSTS,
  ]
    .filter(Boolean)
    .join(" ");

  const imgSrc = [
    "'self'",
    (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ?? ""),
    "data:",
    "blob:",
    "https://res.cloudinary.com",
    "https://lh3.googleusercontent.com",
    "https://images.unsplash.com",
    "https://cdn.esewa.com.np",
    "https://picsum.photos",
    "https://assets.21st.dev",
    ...MAP_TILE_HOSTS,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://esewa.com.np https://rc.esewa.com.np https://epay.esewa.com.np https://rc-epay.esewa.com.np",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "media-src 'self' blob: https://res.cloudinary.com https://assets.21st.dev",
    "frame-src 'self' https://accounts.google.com https://*.readyplayer.me",
  ].join("; ");
}

const nextConfig = {  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      "country-flag-icons/unicode": "./lib/shims/country-flag-icons-unicode.ts",
    },
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-slot",
      "@radix-ui/react-separator",
      "@headlessui/react",
      "motion",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.esewa.com.np" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              'camera=(self "https://*.readyplayer.me"), microphone=(self "https://*.readyplayer.me"), geolocation=(self), identity-credentials-get=(self)',
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy(),
          },
        ],      },
      // Long-lived caching only for production builds, whose chunk names are
      // content-hashed. In dev, Turbopack reuses chunk names when their
      // contents change, so "immutable" left browsers stuck on stale code.
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/_next/static/(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);

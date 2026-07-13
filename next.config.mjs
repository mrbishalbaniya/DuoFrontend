/** @type {import('next').NextConfig} */

// Map/tile providers used by MapLibre (basemaps, terrain, satellite, labels) and 3D avatars.
const MAP_TILE_HOSTS = [
  "https://*.cartocdn.com",
  "https://server.arcgisonline.com",
  "https://*.tile.opentopomap.org",
  "https://tile.opentopomap.org",
  "https://s3.amazonaws.com",
  "https://nominatim.openstreetmap.org",
  "https://*.readyplayer.me",
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
    "data:",
    "blob:",
    "https://res.cloudinary.com",
    "https://lh3.googleusercontent.com",
    "https://images.unsplash.com",
    "https://cdn.esewa.com.np",
    "https://picsum.photos",
    ...MAP_TILE_HOSTS,
  ].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://esewa.com.np https://rc.esewa.com.np",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "media-src 'self' blob: https://res.cloudinary.com",
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
              'camera=(self "https://*.readyplayer.me"), microphone=(self "https://*.readyplayer.me"), geolocation=(self)',
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
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

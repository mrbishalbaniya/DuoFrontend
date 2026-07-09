import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "models.readyplayer.me",
  "api.readyplayer.me",
  "readyplayer.me",
]);

function isAllowedAvatarUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (ALLOWED_HOSTS.has(host)) return true;
    return host.endsWith(".readyplayer.me");
  } catch {
    return false;
  }
}

/**
 * Proxy Ready Player Me GLBs so the browser can load them even when
 * direct CDN access fails (CORS) — still requires server-side DNS.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw || !isAllowedAvatarUrl(raw)) {
    return NextResponse.json({ detail: "Invalid avatar model URL" }, { status: 400 });
  }

  try {
    const upstream = await fetch(raw, {
      headers: { Accept: "model/gltf-binary,*/*" },
      next: { revalidate: 86400 },
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { detail: `Upstream model fetch failed (${upstream.status})` },
        { status: 502 }
      );
    }

    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "model/gltf-binary",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "Ready Player Me CDN is unreachable from this server. Use the local avatar or try again on another network.",
      },
      { status: 502 }
    );
  }
}

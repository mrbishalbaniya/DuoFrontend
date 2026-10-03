import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/apiProxy";
import { proxyToChatService } from "@/lib/server/chatServiceProxy";
import { getChatBackendConfig } from "@/lib/chatConfig";

type RouteContext = { params: Promise<{ path: string[] }> };

// Which of these two actually handles the request is decided live from
// Django admin (site_config.SiteSettings.chat_backend) — see lib/chatConfig.ts.
// Same path either way: chat-service mounts its REST API at /api/chat/... too,
// so no path rewriting is needed switching between the two.
async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const config = await getChatBackendConfig();
  if (config.backend === "microservice") {
    return proxyToChatService(request, path, config.service_url);
  }
  return proxyToBackend(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

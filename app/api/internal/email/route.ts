import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendRelayEmail } from "@/lib/server/nodemailerMailer";

export const runtime = "nodejs";

const relayPayloadSchema = z.object({
  smtp: z.object({
    host: z.string().min(1),
    port: z.number().int().positive(),
    secure: z.boolean().optional().default(false),
    requireTLS: z.boolean().optional().default(false),
    auth: z.object({
      user: z.string().min(1),
      pass: z.string().min(1),
    }),
  }),
  from: z.string().min(1),
  to: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  text: z.string(),
  html: z.string().optional().default(""),
});

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.EMAIL_RELAY_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 && token === secret;
}

export async function POST(request: NextRequest) {
  if (!process.env.EMAIL_RELAY_SECRET?.trim()) {
    return NextResponse.json(
      { error: "EMAIL_RELAY_SECRET is not configured on the frontend." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = relayPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const info = await sendRelayEmail(parsed.data);
    return NextResponse.json({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

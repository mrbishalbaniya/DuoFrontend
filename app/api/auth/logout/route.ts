import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/server/apiProxy";

export async function POST() {
  const response = NextResponse.json({ detail: "Logged out." });
  await clearAuthCookies(response);
  return response;
}

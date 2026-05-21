import { handlers, auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.pathname === "/api/auth/session" || url.pathname.endsWith("/api/auth/session")) {
    const session = await auth();
    if (session) {
      return NextResponse.json(session);
    }
  }
  return handlers.GET(req);
}

export const POST = handlers.POST;


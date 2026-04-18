import { withAuth } from "next-auth/middleware";
import type { NextFetchEvent, NextRequest } from "next/server";

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  return withAuth(req, event);
}

export const config = {
  matcher: ["/trip/:path*"],
};

import { NextRequest, NextResponse } from "next/server";
import { isProtectedPagePath, isProtectedApiPath } from "@/lib/auth/routes";
import { hasSession } from "@/lib/auth/server/middleware";
import { mapLegacyViewPath } from "@/lib/views/legacy-redirect";
import { viewSegments } from "@/lib/views/view-registry";

/**
 * Next.js Proxy for authentication checks (better-auth stateless pattern).
 * Optimistic cookie-existence checks only — validation happens server-side.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Legacy /view/* → new schema (path + query only; hash handled client-side).
  if (pathname.startsWith("/view/")) {
    const mapped = mapLegacyViewPath(pathname, search.startsWith("?") ? search.slice(1) : search);
    if (mapped) {
      const url = new URL(mapped.pathname, request.url);
      url.search = mapped.search;
      return NextResponse.redirect(url, 308);
    }
  }

  // 2. Internal ?view= → ?tab= on (views) routes.
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (firstSegment && viewSegments.includes(firstSegment)) {
    const viewValue = request.nextUrl.searchParams.get("view");
    if (viewValue !== null) {
      const url = new URL(request.url);
      url.searchParams.delete("view");
      url.searchParams.set("tab", viewValue);
      return NextResponse.redirect(url, 308);
    }
  }

  if (isProtectedApiPath(pathname)) {
    if (!hasSession(request)) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (isProtectedPagePath(pathname)) {
    if (!hasSession(request)) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

// NOTE: the view segment paths below mirror `viewSegments` in view-registry.ts.
// Next.js requires a statically analyzable matcher literal — it cannot be computed
// from viewSegments at runtime, so the list is intentionally duplicated here.
export const config = {
  matcher: [
    "/api/protected/:path*",
    "/services/:path*",
    "/workspace/:path*",
    "/jobs/:path*",
    "/settings/:path*",
    "/viewer/:path*",
    "/view/:path*",
    "/taxonomy/:path*",
    "/genome/:path*",
    "/feature/:path*",
    "/epitope/:path*",
    "/surveillance/:path*",
    "/serology/:path*",
    "/strain/:path*",
    "/domains-and-motifs/:path*",
    "/protein-structure/:path*",
    "/experiment/:path*",
  ],
};

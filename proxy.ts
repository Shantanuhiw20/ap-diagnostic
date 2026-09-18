import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Note: this is `proxy.ts`, not `middleware.ts`. Next.js 16 deprecated and
// renamed the middleware.js file convention to proxy.js, same behaviour,
// new file/export name (confirmed against this project's own installed
// Next.js docs, not assumed).
//
// Gates the whole app behind HTTP Basic Auth checked against SITE_PASSWORD.
// If SITE_PASSWORD isn't set, the site stays fully open, this must never be
// able to lock a developer out of their own laptop by accident.
export function proxy(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    // "username:password" — the browser always sends some username, only
    // the password half is actually checked.
    const separatorIndex = decoded.indexOf(":");
    const password = separatorIndex === -1 ? decoded : decoded.slice(separatorIndex + 1);

    if (password === sitePassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="EY Fin OS", charset="UTF-8"',
    },
  });
}

// No matcher: this runs on every request, including API routes, exactly as
// asked ("apply it to every route, including the API routes, not just the
// pages"). Without a matcher, Next.js runs proxy on literally everything by
// default, which is the point here.

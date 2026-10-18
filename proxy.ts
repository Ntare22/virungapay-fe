import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function comingSoon() {
  return (
    process.env.VERCEL_GIT_COMMIT_REF === "main" ||
    process.env.RAILWAY_GIT_BRANCH === "main" ||
    process.env.RAILWAY_ENVIRONMENT_NAME === "main"
  );
}

export function proxy(request: NextRequest) {
  if (!comingSoon()) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname === "/") return NextResponse.next();
  if (request.method === "POST" && pathname === "/v1/waitlist") return NextResponse.next();
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|svg|ico|jpg|jpeg|webp)$).*)"],
};

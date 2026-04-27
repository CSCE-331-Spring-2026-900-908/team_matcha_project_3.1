import { NextResponse } from "next/server";

// This app now uses local JWTs stored in localStorage, not NextAuth.
// Middleware cannot read those client-side tokens, so route protection
// happens in client guards and API auth helpers instead.
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/manager/:path*", "/employee/:path*"],
};

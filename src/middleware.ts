import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { user, response, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Public routes
  if (path === "/" || path.startsWith("/auth/") || path === "/login") {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "planner") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (profile?.role === "client") {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
    }
    return response;
  }

  // Protected routes
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (path.startsWith("/dashboard") && profile?.role !== "planner") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (path.startsWith("/portal") && profile?.role !== "client") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

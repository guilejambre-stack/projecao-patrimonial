import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { user, response, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Public routes — no DB query needed
  if (path === "/" || path.startsWith("/auth/") || path === "/login") {
    if (user) {
      // Check cookie first, then DB
      const role = request.cookies.get("user_role")?.value;
      if (role === "planner") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (role === "client") {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      // Cookie missing — fetch from DB once
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        const redirectUrl = profile.role === "planner" ? "/dashboard" : "/portal";
        const res = NextResponse.redirect(new URL(redirectUrl, request.url));
        res.cookies.set("user_role", profile.role, { path: "/", maxAge: 3600 });
        return res;
      }
    }
    return response;
  }

  // Protected routes — must be logged in
  if (!user) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("user_role");
    return res;
  }

  // Check role from cookie first (avoids DB query on every navigation)
  let role = request.cookies.get("user_role")?.value;

  if (!role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role;
    if (role) {
      response.cookies.set("user_role", role, { path: "/", maxAge: 3600 });
    }
  }

  if (path.startsWith("/dashboard") && role !== "planner") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (path.startsWith("/portal") && role !== "client") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Static/public assets — skip entirely
  if (path === "/login" || path.startsWith("/auth/")) {
    const { response } = await updateSession(request);
    return response;
  }

  // Root redirect
  if (path === "/") {
    const role = request.cookies.get("user_role")?.value;
    if (role === "planner") return NextResponse.redirect(new URL("/dashboard", request.url));
    if (role === "client") return NextResponse.redirect(new URL("/portal", request.url));

    const { user, response, supabase } = await updateSession(request);
    if (!user) return NextResponse.redirect(new URL("/login", request.url));

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) {
      const res = NextResponse.redirect(new URL(profile.role === "planner" ? "/dashboard" : "/portal", request.url));
      res.cookies.set("user_role", profile.role, { path: "/", maxAge: 3600 });
      return res;
    }
    return response;
  }

  // Protected routes — check cookie first (avoids DB + auth on every nav)
  const role = request.cookies.get("user_role")?.value;

  if (role) {
    // Cookie exists — just refresh the session and enforce role
    const { user, response } = await updateSession(request);
    if (!user) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete("user_role");
      return res;
    }
    if (path.startsWith("/dashboard") && role !== "planner") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    if (path.startsWith("/portal") && role !== "client") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // No cookie — full auth check
  const { user, response, supabase } = await updateSession(request);
  if (!user) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("user_role");
    return res;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role;
  if (userRole) {
    response.cookies.set("user_role", userRole, { path: "/", maxAge: 3600 });
  }

  if (path.startsWith("/dashboard") && userRole !== "planner") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }
  if (path.startsWith("/portal") && userRole !== "client") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

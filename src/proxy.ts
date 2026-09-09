import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  // el cron tiene su propia autenticación (CRON_SECRET como Bearer token,
  // comprobada dentro de la propia ruta) — no la de sesión de usuario
  const isCron = req.nextUrl.pathname.startsWith("/api/cron");

  if (!req.auth && !isPublic && !isApiAuth && !isCron) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

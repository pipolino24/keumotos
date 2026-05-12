import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

const ADMIN_ROUTES = [
  "/dashboard/administracao",
  "/dashboard/aquisicoes",
  "/dashboard/usuarios",
  "/dashboard/afiliados",
  "/dashboard/proprietarios",
  "/dashboard/pessoas",
];

const AFFILIATE_ROUTES = ["/afiliado"];

const AUTH_REQUIRED = ["/dashboard", "/perfil"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { response, user } = await updateSupabaseSession(req);

  const requiresAuth =
    AUTH_REQUIRED.some((r) => pathname.startsWith(r)) ||
    AFFILIATE_ROUTES.some((r) => pathname.startsWith(r));

  if (requiresAuth && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const role = (user.user_metadata?.role as string) || "cliente";

    const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
    if (isAdminRoute && role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("forbidden", "1");
      return NextResponse.redirect(url);
    }

    const isAffiliateRoute = AFFILIATE_ROUTES.some((r) =>
      pathname.startsWith(r)
    );
    if (isAffiliateRoute && role !== "afiliado" && role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("forbidden", "1");
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/afiliado/:path*", "/perfil/:path*"],
};

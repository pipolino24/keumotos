import { NextResponse, type NextRequest } from "next/server";

/**
 * Rotas que exigem privilégio de admin.
 * Vendedores que tentarem acessar via URL direta são redirecionados.
 *
 * Quando integrar auth real (NextAuth/Clerk), ler do JWT/sessão.
 * Por enquanto lê do cookie "keu_role" que é seteado no login.
 */
const ADMIN_ROUTES = [
  "/dashboard/administracao",
  "/dashboard/aquisicoes",
  "/dashboard/usuarios",
  "/dashboard/afiliados",
  "/dashboard/proprietarios",
];

const AFFILIATE_ROUTES = ["/afiliado"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get("keu_role")?.value ?? "vendedor";

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  if (isAdminRoute && role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("forbidden", "1");
    return NextResponse.redirect(url);
  }

  const isAffiliateRoute = AFFILIATE_ROUTES.some((r) => pathname.startsWith(r));
  if (isAffiliateRoute && role !== "afiliado" && role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/afiliado/:path*",
  ],
};

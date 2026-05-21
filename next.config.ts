import type { NextConfig } from "next";

/**
 * CSP — política permissiva mas defensiva. Mantém 'unsafe-inline' + 'unsafe-eval'
 * porque Next.js injeta scripts/styles inline em runtime; sem isso a app não
 * carrega. Mesmo assim bloqueia o que importa:
 *   - frame-ancestors 'none': zero clickjacking
 *   - form-action 'self': forms não podem postar pra outros domínios
 *   - base-uri 'self': impede <base> injection
 *   - connect-src whitelisted: fetch só pra Supabase, FIPE Parallelum, Resend
 *   - default-src 'self': qualquer outro tipo de recurso de origem externa nega
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://parallelum.com.br https://viacep.com.br https://*.vercel-storage.com https://*.resend.com",
  "frame-src 'self' https://vercel.live",
  "frame-ancestors 'none'",
  "form-action 'self' https://wa.me",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  // HSTS — força HTTPS por 6 meses incluindo subdomínios
  {
    key: "Strict-Transport-Security",
    value: "max-age=15552000; includeSubDomains",
  },
  // Anti-clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Evita sniffing de MIME (anti-XSS em endpoints que servem arquivo)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vaza paths internos pra terceiros
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Bloqueia acesso a APIs sensíveis do browser por default
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
  },
  // CSP — bloqueia scripts/iframes externos não-whitelisted
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;

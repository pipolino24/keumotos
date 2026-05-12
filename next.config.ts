import type { NextConfig } from "next";

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

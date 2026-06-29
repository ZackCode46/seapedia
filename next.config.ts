import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Allows accessing the dev server via the machine's network IP
  // (e.g. http://192.168.x.x:3000) instead of only localhost.
  // Without this, Next.js silently blocks cross-origin requests in dev mode,
  // including client-side fetch() calls like /api/auth/me — which is why the
  // navbar account section could get stuck loading forever.
  allowedDevOrigins: ["192.168.56.1", "localhost", "127.0.0.1"],

  // Baseline security headers (Level 7 hardening). These are defense-in-depth
  // on top of input validation/sanitization and don't replace it.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

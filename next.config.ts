import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.56.1", "localhost", "127.0.0.1"],

  // Prevent jsdom and related packages from being bundled into serverless
  // functions. These packages have ESM/CJS interop issues with Turbopack on
  // Vercel (ERR_REQUIRE_ESM from html-encoding-sniffer). Since we replaced
  // isomorphic-dompurify with a regex sanitizer, none of these should be
  // needed at runtime — this just ensures they can never accidentally get
  // pulled in by a transitive dependency.
  serverExternalPackages: [
    "jsdom",
    "isomorphic-dompurify",
    "html-encoding-sniffer",
    "whatwg-encoding",
    "@exodus/bytes",
  ],

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

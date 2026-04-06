import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "sharp"],
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/sharp/**/*",
      "node_modules/@img/**/*",
      "node_modules/better-sqlite3/**/*",
    ],
  },
};

export default nextConfig;

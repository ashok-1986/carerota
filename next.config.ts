import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['rota.alchemetryx.com'],
    },
  },
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;

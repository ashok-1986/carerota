import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ['panel.alchemetryx.com'],
    },
  },
  reactCompiler: true,
};

export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimized for Hostinger Node.js deployment
  // React compiler and experimental serverActions removed to prevent memory exhaustion and build timeouts
};

export default nextConfig;
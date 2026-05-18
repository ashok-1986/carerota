/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['panel.alchemetryx.com'],
    },
  },
  reactCompiler: true,
};

module.exports = nextConfig;
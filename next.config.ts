import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;

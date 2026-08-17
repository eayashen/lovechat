import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use standalone if not running on Vercel
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["preview-chat-0884801b-2eee-45b0-a9e6-63d3df0e5071.space-z.ai"],
};

export default nextConfig;

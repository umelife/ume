import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Verify a new build without taking the running local preview offline.
  distDir: process.env.UME_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Remotion: transpile @remotion packages so Next.js handles their ESM correctly
  transpilePackages: ['@remotion/player', 'remotion'],
};

export default nextConfig;

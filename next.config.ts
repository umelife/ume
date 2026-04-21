import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

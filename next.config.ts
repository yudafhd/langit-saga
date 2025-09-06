import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "foto.kontan.co.id",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

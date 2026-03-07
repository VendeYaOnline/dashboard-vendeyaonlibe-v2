import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "muebles-electrodomesticos-del-meta-tvy0g5xm53zbkhw.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.s3.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;

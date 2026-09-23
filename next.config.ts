import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next sirve miniaturas redimensionadas y en AVIF/WebP desde su caché,
    // sin cambiar el bucket S3 que conserva los originales.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname:
          "muebles-electrodomesticos-del-meta-tvy0g5xm53zbkhw.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "vendeyaonline-rjoacu5zfypj5g6p.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.s3.amazonaws.com",
      },
      {
        // Permite buckets S3 nuevos en otra región sin tener que volver a
        // desplegar sólo para autorizar su hostname.
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;

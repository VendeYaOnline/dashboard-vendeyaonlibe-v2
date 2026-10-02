import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel responde 402 en /_next/image cuando se agota la cuota de Image
    // Optimization del plan, y las imágenes nuevas dejan de verse. Mientras
    // tanto se sirven directo desde S3. Quitar esta línea al ampliar el plan.
    unoptimized: true,
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

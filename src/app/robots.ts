import type { MetadataRoute } from "next";

// Permit crawling so crawlers can read noindex and social preview metadata.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" } };
}

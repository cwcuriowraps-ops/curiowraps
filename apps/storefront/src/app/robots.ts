import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/checkout", "/checkout/success", "/checkout/failure", "/account/"],
    },
    sitemap: `${process.env.STOREFRONT_URL || "https://curiowrap.com"}/sitemap.xml`,
  };
}

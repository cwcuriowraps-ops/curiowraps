/**
 * Resolves and validates CMS link URLs to ensure all CTA buttons ('Shop Now', hero banners, etc.)
 * navigate to valid storefront destinations instead of 404 pages.
 */
export function resolveCmsLink(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "/products";

  const cleanUrl = url.trim();
  if (!cleanUrl) return "/products";

  // External URLs (e.g. https://...)
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://") || cleanUrl.startsWith("//")) {
    return cleanUrl;
  }

  // Legacy/CMS all products paths
  if (
    cleanUrl === "/collections/all" ||
    cleanUrl === "/products/all" ||
    cleanUrl === "/collection/all" ||
    cleanUrl === "/shop"
  ) {
    return "/products";
  }

  // Map /collections/:slug -> /products?brand=:slug
  const collectionMatch = cleanUrl.match(/^\/collections\/([^/]+)$/);
  if (collectionMatch && collectionMatch[1]) {
    const slug = collectionMatch[1];
    if (slug === "all") return "/products";
    return `/products?brand=${encodeURIComponent(slug)}`;
  }

  // Map /categories/:slug -> /products?category=:slug
  const categoryMatch = cleanUrl.match(/^\/categories\/([^/]+)$/);
  if (categoryMatch && categoryMatch[1]) {
    const slug = categoryMatch[1];
    return `/products?category=${encodeURIComponent(slug)}`;
  }

  return cleanUrl;
}

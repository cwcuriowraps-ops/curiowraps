export const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop";

export function optimizeCloudinaryUrl(url: string, options: { width?: number } = {}): string {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }

  // Avoid double transformation
  if (url.includes("/image/upload/f_auto") || url.includes("/image/upload/q_auto")) {
    return url;
  }

  const transforms = ["f_auto", "q_auto"];
  if (options.width) {
    transforms.push(`w_${options.width}`);
  }

  return url.replace("/image/upload/", `/image/upload/${transforms.join(",")}/`);
}

export function getImageUrl(url?: string | null, options?: { width?: number }): string {
  if (!url || typeof url !== "string") return DEFAULT_FALLBACK_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_FALLBACK_IMAGE;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return optimizeCloudinaryUrl(trimmed, options);
  }

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  let baseUrl = rawApiUrl;
  if (baseUrl.startsWith("NEXT_PUBLIC_API_URL=")) {
    baseUrl = baseUrl.substring("NEXT_PUBLIC_API_URL=".length);
  }
  baseUrl = baseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
}

import type { Request, Response, NextFunction } from "express";

/**
 * Cache-Control middleware for public read-only catalog routes.
 * @param maxAgeSeconds Client cache max-age in seconds
 * @param sMaxAgeSeconds Shared CDN/proxy cache s-maxage in seconds
 * @param staleWhileRevalidate Stale-while-revalidate duration in seconds
 */
export function cacheControl(maxAgeSeconds = 60, sMaxAgeSeconds = 300, staleWhileRevalidate = 600) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only apply cache control to GET and HEAD requests
    if (req.method === "GET" || req.method === "HEAD") {
      res.setHeader(
        "Cache-Control",
        `public, max-age=${maxAgeSeconds}, s-maxage=${sMaxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidate}`
      );
    }
    next();
  };
}

"use client";

import Link from "next/link";

import { usePublicSettings } from "@/api/settings";
import { resolveCmsLink } from "@/lib/link-resolver";

export function AnnouncementBar() {
  const { data: settings } = usePublicSettings();

  const announcement = settings?.announcement;
  const isEnabled = announcement?.active ?? true;
  const text = announcement?.text || "Free shipping on all Curio Wrap orders over ₹1,000!";
  const rawLink = announcement?.link || "/products";
  const link = resolveCmsLink(rawLink);

  if (!isEnabled || !text) return null;

  return (
    <div className="w-full bg-accent text-white text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 text-center font-medium shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 tracking-tight sm:tracking-normal">
      <span className="truncate max-w-[240px] sm:max-w-none">{text}</span>
      {link && (
        <Link href={link} className="underline font-semibold hover:opacity-80 transition-opacity shrink-0">
          Shop Now →
        </Link>
      )}
    </div>
  );
}

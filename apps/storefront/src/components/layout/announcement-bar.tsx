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
    <div className="w-full bg-accent text-white text-xs py-2 px-4 text-center font-medium shadow-sm flex items-center justify-center gap-2">
      <span>{text}</span>
      {link && (
        <Link href={link} className="underline font-semibold hover:opacity-80 transition-opacity">
          Shop Now →
        </Link>
      )}
    </div>
  );
}

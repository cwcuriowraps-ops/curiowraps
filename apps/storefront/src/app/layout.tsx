import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import type { ReactNode } from "react";

import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";

import "@dashboard/ui/styles.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  style: ["normal", "italic"]
});

export const metadata: Metadata = {
  title: {
    default: "Curio Wrap — Handmade with Love",
    template: "%s | Curio Wrap",
  },
  description:
    "Handcrafted pipe cleaner creations that bring smiles to everyday life. Cute, elegant, and minimal gifts.",
  openGraph: {
    title: "Curio Wrap — Handmade with Love",
    description: "Handcrafted pipe cleaner creations that bring smiles to everyday life.",
    url: "https://curiowrap.com",
    siteName: "Curio Wrap",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curio Wrap — Handmade with Love",
    description: "Handcrafted pipe cleaner creations that bring smiles to everyday life.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  metadataBase: new URL(process.env.STOREFRONT_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased selection:bg-accent/30`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <AnnouncementBar />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

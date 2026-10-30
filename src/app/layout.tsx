import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SITE, getRequestUrl } from "@/lib/site";
import { OnlineStatus } from "@/components/online-status";
import { PWAInit } from "@/components/pwa-init";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getRequestUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: SITE.title,
      template: `%s · ${SITE.name}`,
    },
    description: SITE.description,
    keywords: [...SITE.keywords],
    applicationName: SITE.name,
    authors: [{ name: SITE.name }],
    alternates: {
      canonical: "/",
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      url: siteUrl,
      siteName: SITE.name,
      title: SITE.title,
      description: SITE.description,
      locale: "en_MW",
      images: [
        {
          url: "/images/og-cover.jpg",
          width: 1200,
          height: 630,
          alt: "MalawiGuide — MSCE Career Guidance",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE.title,
      description: SITE.description,
      images: ["/images/og-cover.jpg"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1a3c6e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <PWAInit />
        {children}
        <OnlineStatus />
      </body>
    </html>
  );
}

import type { MetadataRoute } from "next";
import { getRequestUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getRequestUrl();
  const lastModified = new Date();

  return [
    { url: `${siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/quiz`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/papers`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/leaderboard`, lastModified, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/share`, lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];
}

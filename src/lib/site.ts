/**
 * Central place for the public URL of the site.
 *
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL  (set this to your custom domain when you have one)
 *  2. VERCEL_URL / preview host provided by the platform
 *  3. localhost fallback for development
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return stripTrailingSlash(explicit);

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${stripTrailingSlash(vercel)}`;

  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

/**
 * Resolves the URL the visitor actually used (works on preview domains,
 * custom domains and localhost). Falls back to getSiteUrl() when the
 * request headers are not available (e.g. during static generation).
 */
export async function getRequestUrl(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
    if (!host) return getSiteUrl();
    const proto =
      headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return getSiteUrl();
  }
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "").replace(/^https?:\/\//, (match) => match);
}

export const SITE = {
  name: "Tsogolo Langa",
  shortName: "Tsogolo Langa",
  title: "Tsogolo Langa — MSCE Career Guidance for Malawi Students",
  description:
    "Free career guidance for Malawian secondary school students. Take a 30-question MSCE-aligned quiz across three phases and find out whether you are stronger in Sciences or Humanities, then explore careers at KUHeS, MUBAS, MUST, LUANAR, UNIMA and MZUNI.",
  keywords: [
    "MSCE",
    "Malawi",
    "career guidance",
    "MANEB",
    "secondary school Malawi",
    "sciences or humanities",
    "KUHeS",
    "MUBAS",
    "MUST",
    "LUANAR",
    "UNIMA",
    "MZUNI",
    "computer science Malawi",
    "cybersecurity Malawi",
  ],
} as const;

import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.title,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#1a3c6e",
    theme_color: "#1a3c6e",
    icons: [
      {
        src: "/images/og-cover.jpg",
        sizes: "1200x630",
        type: "image/jpeg",
      },
    ],
  };
}

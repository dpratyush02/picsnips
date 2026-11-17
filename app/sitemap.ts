import type { MetadataRoute } from "next";
import { hasVoiceRuntime } from "@/lib/voice/availability";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    ...(hasVoiceRuntime() ? [{ url: `${siteUrl}/tools/voice-enhancer`, lastModified, changeFrequency: "monthly" as const, priority: 0.8 }] : []),
    { url: `${siteUrl}/tools`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/tools/scroll-animation`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/sponsors`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/split`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/library`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

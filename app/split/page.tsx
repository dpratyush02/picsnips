import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { SiteFrame } from "@/components/site-frame";
import { ImageSplitter } from "@/components/splitter/image-splitter";
import { SplitInstructions } from "@/components/split-instructions";

export const metadata: Metadata = {
  title: "Free Image Splitter for X",
  description:
    "Free in-browser image splitter for X (Twitter). Cut any photo or panorama into 20 seamless vertical tiles with zero server uploads.",
  alternates: {
    canonical: `${siteUrl}/split`,
  },
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PicSnips",
  url: `${siteUrl}/split`,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern browser with HTML canvas",
  description:
    "Free in-browser image splitter for X (Twitter). Cut any photo or panorama into 20 seamless vertical tiles without server uploads.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function SplitPage() {
  return (
    <SiteFrame>
      <main className="min-h-[85vh]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
        />
        <ImageSplitter />
        <SplitInstructions />
      </main>
    </SiteFrame>
  );
}


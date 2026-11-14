import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { SiteFrame } from "@/components/site-frame";
import { ImageLibrary } from "@/components/image-library";

export const metadata: Metadata = {
  title: "Stock & Preset Images",
  description:
    "Explore 15+ curated high-resolution 4K wallpapers and panoramas. Interstellar, Gargantua, Cyberpunk, Mars orbit, and more. Split them into 20 slices with one click.",
  alternates: {
    canonical: `${siteUrl}/library`,
  },
};

export default function LibraryPage() {
  return (
    <SiteFrame>
      <main className="min-h-[80vh]">
        <ImageLibrary />
      </main>
    </SiteFrame>
  );
}


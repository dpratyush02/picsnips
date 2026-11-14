import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { ImageSplitter } from "@/components/splitter/image-splitter";

export const metadata: Metadata = {
  title: "Split an Image into 20 Slices for X (Twitter) — PicSnips",
  description:
    "Cut any photo or panorama into 20 seamless slices for X's multi-image post format. Free, 100% client-side, zero server uploads, instant ZIP download.",
  alternates: { canonical: "/split" },
};

export default function SplitPage() {
  return (
    <SiteFrame>
      <main className="min-h-[85vh]">
        <ImageSplitter />
      </main>
    </SiteFrame>
  );
}

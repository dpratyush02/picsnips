import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import { ScrollLoader } from "@/components/scroll/scroll-loader";
import { ToolErrorBoundary } from "@/components/tool-error-boundary";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Scroll Animation Maker — Video & GIF to Frames",
  description:
    "Turn videos, animated GIFs and image sequences into ordered frames for a swipeable flipbook post. Extract video to images privately in your browser.",
  keywords: [
    "video to frames",
    "video to images",
    "scroll animation maker",
    "flipbook post maker",
    "X swipe animation",
    "GIF to image sequence",
  ],
  alternates: {
    canonical: `${siteUrl}/tools/scroll-animation`,
  },
};

export default function ScrollPage() {
  return (
    <SiteFrame>
      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
        <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground">
          ← All tools
        </Link>
        <p className="mt-6 text-sm font-medium text-primary">
          Scroll Animation Maker{" "}
          <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-[10px]">NEW</span>
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Turn Videos Into Swipeable Animations.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
          Transform a video or GIF into a frame-by-frame experience for X. Upload, extract, and share.
        </p>
        <ToolErrorBoundary>
          <ScrollLoader />
        </ToolErrorBoundary>
      </main>
    </SiteFrame>
  );
}

import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { ToolPageIntro } from "@/components/tool-page-intro";
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
    <SiteFrame showFaqLink={false}>
      <main className="site-width min-h-[75vh] pb-16 pt-10 sm:pb-24 sm:pt-16">
        <ToolPageIntro
          label="Scroll Animation Maker"
          title="Turn videos into swipeable animations."
          body="Transform a video, GIF, or image sequence into a frame-by-frame experience for X."
        />
        <ToolErrorBoundary>
          <ScrollLoader />
        </ToolErrorBoundary>
      </main>
    </SiteFrame>
  );
}

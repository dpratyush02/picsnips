import type { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
import { SiteFrame } from "@/components/site-frame";
import { ToolkitCards } from "@/components/toolkit-cards";
import { siteUrl } from "@/lib/site";
import { hasVoiceRuntime } from "@/lib/voice/availability";

export const metadata: Metadata = {
  title: "Free Creator Tools",
  description: "Explore PicSnips tools for image grids, video and GIF frame extraction, and browser-based audio enhancement.",
  alternates: { canonical: `${siteUrl}/tools` },
};

export default function ToolsPage() {
  const voiceReady = hasVoiceRuntime();

  return (
    <SiteFrame showFaqLink={false}>
      <main className="site-width min-h-[70vh] pb-20 pt-14 sm:pb-28 sm:pt-24">
        <SectionHeading
          as="h1"
          title="Tools for making things."
          body={voiceReady ? "Split images, pull frames from video, and clean up recordings right in your browser." : "Split images and pull frames from video right in your browser."}
        />
        <div className="mt-9"><ToolkitCards voiceReady={voiceReady} /></div>
      </main>
    </SiteFrame>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Layers, Film, AudioLines, ArrowUpRight } from "lucide-react";
import { SiteFrame } from "@/components/site-frame";
import { SectionHeading } from "@/components/section-heading";
import { hasVoiceRuntime } from "@/lib/voice/availability";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Image & Frame Tools",
  description:
    "Split images and turn videos or GIFs into ordered frame sequences. Private creator tools for X.",
  alternates: {
    canonical: `${siteUrl}/tools`,
  },
};

const tools = [
  {
    href: "/split",
    title: "Image Splitter",
    body: "Split one image into perfectly ordered pieces for X.",
    icon: Layers,
    new: false,
  },
  {
    href: "/tools/scroll-animation",
    title: "Scroll Animation Maker",
    body: "Turn videos, GIFs and image sequences into a swipeable flipbook.",
    icon: Film,
    new: true,
  },
];

const voice = {
  href: "/tools/voice-enhancer",
  title: "PicSnips Auto Enhance",
  body: "Reduce background noise in audio and video with AI that runs on your device.",
  icon: AudioLines,
  new: true,
};

export default function ToolsPage() {
  const ready = hasVoiceRuntime();
  return (
    <SiteFrame>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <SectionHeading
          as="h1"
          eyebrow="PicSnips tools"
          title={ready ? "Create more with PicSnips." : "Make every frame worth sharing."}
          body={ready ? "Split images, extract frames and clean up recordings in your browser." : "Create ordered image posts, right in your browser."}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {(ready ? [...tools, voice] : tools).map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-3xl border border-border bg-card p-8 transition hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <tool.icon className="size-7 text-primary" />
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </div>
              <h2 className="mt-6 text-xl font-semibold">
                {tool.title}
                {tool.new && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 align-middle text-[10px] text-primary">
                    NEW
                  </span>
                )}
              </h2>
              <p className="mt-3 leading-6 text-muted-foreground">{tool.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </SiteFrame>
  );
}

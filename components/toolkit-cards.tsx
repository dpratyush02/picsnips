import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { scenes } from "@/components/scenes";

const tools = [
  {
    kind: "split",
    title: "Image Splitter",
    body: "Turn one image into up to 20 numbered pieces for a panoramic post or a custom grid.",
    href: "/split",
  },
  {
    kind: "scroll",
    title: "Scroll Animation Maker",
    body: "Pull frames from a video, GIF, or image sequence to make a swipeable flipbook.",
    href: "/tools/scroll-animation",
  },
  {
    kind: "voice",
    title: "Auto Enhance",
    body: "Reduce background noise in audio and video. Listen before and after, then export.",
    href: "/tools/voice-enhancer",
  },
  {
    kind: "library",
    title: "Image Library",
    body: "Explore a curated collection of panoramas and wallpapers you can open in the splitter.",
    href: "/library",
  },
] as const;

const sizes = "(max-width: 640px) 92vw, (max-width: 1280px) 46vw, 584px";

export function ToolkitCards({
  voiceReady,
  heading: Heading = "h2",
}: {
  voiceReady: boolean;
  heading?: "h2" | "h3";
}) {
  return (
    <div className="editorial-reveal grid gap-[10px] sm:grid-cols-2">
      {tools.filter((tool) => tool.kind !== "voice" || voiceReady).map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          prefetch={false}
          className="group overflow-hidden rounded-2xl border border-border bg-card p-[10px] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring"
        >
          <ToolPreview kind={tool.kind} />
          <div className="flex min-h-[114px] items-start justify-between gap-4 px-2.5 pb-3 pt-4 sm:px-3">
            <div>
              <Heading className="card-title">{tool.title}</Heading>
              <p className="mt-1.5 max-w-[35ch] text-sm leading-5 text-muted-foreground">{tool.body}</p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// RMS envelopes of the same synthetic recording before and after Auto Enhance.
const waveforms = [
  { label: "Original", levels: [96, 16, 96, 22, 93, 33, 21, 15, 15, 15, 73, 74, 60, 72, 47, 86, 15, 16, 15, 77, 15, 98, 15, 97, 19, 64, 15, 15, 15, 84, 50, 76, 60, 62, 74, 15, 15, 15, 49, 30] },
  { label: "Enhanced", levels: [94, 6, 92, 15, 90, 29, 11, 4, 4, 4, 68, 72, 56, 70, 43, 84, 4, 4, 4, 73, 6, 95, 6, 94, 12, 59, 4, 4, 4, 82, 48, 73, 58, 58, 72, 4, 4, 4, 43, 24] },
];

function ToolPreview({ kind }: { kind: (typeof tools)[number]["kind"] }) {
  if (kind === "split") {
    return (
      <div className="relative aspect-[2.28/1] overflow-hidden rounded-[10px] bg-black" aria-hidden="true">
        <Image src={scenes[2].fullSrc} alt="" fill sizes={sizes} className="object-cover object-[50%_40%] transition-transform duration-300 motion-safe:group-hover:scale-[1.035]" />
        <div className="hero-slice-lines absolute inset-0" />
      </div>
    );
  }

  if (kind === "scroll") {
    return (
      <div className="grid aspect-[2.28/1] place-items-center overflow-hidden rounded-[10px] bg-[#dedede]" aria-hidden="true">
        <div className="grid w-[90%] grid-cols-3 gap-[6px] sm:gap-[10px]">
          {[1, 6, 12].map((frame) => (
            <div key={frame} className="relative aspect-[3/2] overflow-hidden rounded-[6px] bg-black transition-transform duration-300 motion-safe:group-hover:-translate-y-1">
              <Image src={`/tool-previews/scroll-${String(frame).padStart(2, "0")}.webp`} width={192} height={128} alt="" unoptimized className="block h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "voice") {
    return (
      <div className="grid aspect-[2.28/1] place-items-center rounded-[10px] bg-[#dedede]" aria-hidden="true">
        <div className="grid w-[90%] grid-cols-2 gap-[6px] rounded-[10px] bg-[#c5c5c5] p-[6px] text-black sm:gap-[10px] sm:p-[10px]">
          {waveforms.map(({ label, levels }) => (
            <div key={label} className="min-w-0 rounded-[6px] bg-white p-2.5 sm:p-4">
              <span className="text-[11px]">{label}</span>
              <div className="mt-2 flex h-10 items-center gap-px sm:h-14 sm:gap-[2px]">
                {levels.map((level, index) => (
                  <span key={index} style={{ height: `${level}%` }} className="min-w-0 flex-1 rounded-full bg-[#575757]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[2.28/1] overflow-hidden rounded-[10px] bg-black" aria-hidden="true">
      <Image src="/library/preset_04.png" alt="" fill sizes={sizes} className="object-cover object-[50%_39%] transition-transform duration-300 motion-safe:group-hover:scale-[1.035]" />
    </div>
  );
}

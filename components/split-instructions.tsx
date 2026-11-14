import { Download, Share2, SlidersHorizontal, Upload } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const guideSteps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload your image",
    body: "Click 'Browse files' or drop your photo into the splitter. Wide panoramas, wallpapers, and high-res art (PNG, JPG, WebP) work best. Free to use with no signup required—everything stays on your device.",
  },
  {
    icon: SlidersHorizontal,
    step: "02",
    title: "Choose your layout",
    body: "Pick Vertical slicing for swipeable panoramic posts (from 2 up to 20 images), or choose Horizontal or Grid cuts. The live preview updates instantly to show exactly how your tiles will line up.",
  },
  {
    icon: Download,
    step: "03",
    title: "Download all tiles in one click",
    body: "Click 'Download ZIP' to export all slices at once. Every image is numbered sequentially (from 01 to 20) with lossless quality, so your sequence stays perfectly ordered.",
  },
  {
    icon: Share2,
    step: "04",
    title: "Post on X in numerical order",
    body: "Open the X (Twitter) post composer and attach the downloaded tiles in order starting with 01 through 20. Type your caption and post—X displays them as a seamless multi-image carousel.",
  },
];

export function SplitInstructions() {
  return (
    <section className="scroll-mt-24 px-6 pb-20 pt-8 sm:pb-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Quick Guide"
          title="How to split an image for X"
          body="Turn any image into a multi-tile X post in under two minutes without Photoshop or complex cropping tools."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {guideSteps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col rounded-3xl border border-border dark:border-white/10 bg-card p-6 shadow-sm backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl border border-border dark:border-white/10 bg-muted/60 dark:bg-white/5 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-6 text-base font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


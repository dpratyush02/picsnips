import { Download, SlidersHorizontal, Upload } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const steps = [
  {
    icon: Upload,
    title: "Upload your image",
    body: "Drop a PNG, JPG, or WebP. Wide panoramas work best. The original stays on your device.",
  },
  {
    icon: SlidersHorizontal,
    title: "Choose your split count",
    body: "Start at 20 vertical slices, or pick any count from 2 to 20. Horizontal and grid cuts are there when you want them.",
  },
  {
    icon: Download,
    title: "Download and post on X",
    body: "Save a ZIP named in order from 01, then attach those files in the X composer. The caption can go with you.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps. Under a minute."
          body="No account, no canvas to drag by hand, no export preset to remember."
        />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-40px_rgba(0,0,0,0.8)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl border border-border dark:border-white/10 bg-muted/60 dark:bg-white/5">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

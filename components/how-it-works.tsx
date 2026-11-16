import { CircleCheck, Fingerprint, Shapes } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const principles = [
  { icon: Shapes, title: "Simple by design", body: "Preview as you work and download in order. Each tool puts the controls you need up front." },
  { icon: Fingerprint, title: "Your files stay yours", body: "Image splitting, frame extraction, and audio enhancement run on your device. PicSnips does not receive your files." },
  { icon: CircleCheck, title: "Free, no account", body: "Open any available tool and get to work. There’s no signup, subscription, or export watermark." },
];

export function HowItWorks() {
  return (
    <section id="how" className="editorial-section site-width">
      <div className="grid gap-8 border-t border-line pt-9 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
        <SectionHeading title="Less setup. More creating." />
        <div className="grid gap-[10px] sm:grid-cols-3">
          {principles.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <Icon aria-hidden="true" className="size-6 stroke-[1.5]" />
              <h3 className="mt-5 text-base font-medium sm:mt-7">{title}</h3>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

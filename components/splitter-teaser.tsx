import Link from "next/link";
import { ArrowRight, Layers, Lock, Sparkles, Zap } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";

export function SplitterTeaser() {
  return (
    <section className="scroll-mt-24 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The Splitter App"
          title="Drop one image. Take twenty with you."
          body="Cuts happen in your browser with zero server uploads. The pieces stay in the exact numerical order X expects."
        />

        <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-card/40 p-8 sm:p-12 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner">
              <Layers className="size-8 text-primary" />
            </div>

            <h3 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to slice your panorama?
            </h3>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Open the dedicated tool to drop your file, pick 2 to 20 slices, preview how it looks in an X post, and download a ready-to-upload ZIP file in seconds.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full px-8 text-[15px] gap-2 font-medium">
                <Link href="/split">
                  <span>Open Splitter Tool</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 text-[15px] border-white/10 hover:bg-white/5">
                <Link href="/library">Browse 4K Presets</Link>
              </Button>
            </div>

            <div className="mt-12 grid w-full grid-cols-1 gap-4 border-t border-white/5 pt-8 sm:grid-cols-3 text-left">
              <div className="flex items-start gap-3 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="size-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">100% Private</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Slices rendered client-side on canvas. Zero server uploads.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Zap className="size-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Instant ZIP</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Downloads sequentially numbered 01 through 20 ready for X.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Post Preview</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Interactive simulation of X&apos;s composer and multi-image grid.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


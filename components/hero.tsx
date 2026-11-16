import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, AudioLines, Columns3, Film, Images, Layers, Scissors } from "lucide-react";
import { HeroMotion } from "@/components/hero-motion";
import { HeroNavigation } from "@/components/hero-navigation";
import { scenes, sceneSplitterHref } from "@/components/scenes";

const featured = scenes[0];
const shortcuts = [
  { name: "Image Splitter", href: "/split", tile: "split", Icon: Columns3 },
  { name: "Scroll Animation Maker", href: "/tools/scroll-animation", tile: "frames", Icon: Film },
  { name: "Image Library", href: "/library", tile: "library", Icon: Images },
  { name: "Auto Enhance", href: "/tools/voice-enhancer", tile: "audio", Icon: AudioLines },
  { name: "Split preview", href: "#demo", tile: "preview", Icon: Scissors },
  { name: "Made with PicSnips", href: "#examples", tile: "gallery", Icon: Layers },
];

export function Hero({ voiceReady }: { voiceReady: boolean }) {
  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <HeroMotion>
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <a href="#tools" className="hero-badge">
            <span>Free</span>
            Browser-based creator tools
          </a>
          <h1 id="hero-title" className="hero-title">
            Your creative toolkit.<br />
            Without the <span>complexity.</span>
          </h1>
          <p className="hero-description">
            Edit images, video, and audio.<br className="hidden sm:inline" />
            {" "}Free to use. No signup required.
          </p>
        </div>

        <HeroNavigation />

        <nav aria-label="Creative tool shortcuts" className="hero-shortcuts">
          {shortcuts.filter(({ tile }) => tile !== "audio" || voiceReady).map(({ name, href, tile, Icon }) => (
            <Link key={tile} href={href} prefetch={false} className="hero-shortcut" data-tile={tile} aria-label={name}>
              <span className="hero-shortcut-face">
                <span className="hero-shortcut-glyph"><Icon aria-hidden="true" strokeWidth={1.55} /></span>
              </span>
              <span className="hero-shortcut-label" aria-hidden="true">{name}</span>
            </Link>
          ))}
        </nav>

        <figure className="hero-workspace" aria-label="PicSnips Image Splitter preview">
          <div className="hero-window">
            <div className="hero-window-top">
              <div className="flex min-w-0 items-center gap-2 font-medium">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Columns3 aria-hidden="true" className="size-3.5" />
                </span>
                <span>Image Splitter</span>
              </div>
              <Link href={sceneSplitterHref(featured)} prefetch={false} className="hero-window-link">
                Try this image <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
            <div className="hero-window-body">
              <div className="hero-window-sidebar">
                <p className="font-medium">{featured.title}</p>
                <dl className="mt-4 space-y-3 border-t border-border pt-3 text-xs">
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5">
                    <dt className="text-muted-foreground">Layout</dt>
                    <dd>Vertical</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5">
                    <dt className="text-muted-foreground">Slices</dt>
                    <dd>{featured.slices.length}</dd>
                  </div>
                </dl>
                <a href={featured.tweetUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  View on X <ArrowUpRight aria-hidden="true" className="size-3" />
                </a>
              </div>
              <div className="min-w-0">
                <ol className="hero-slice-ruler" aria-label="Order of the 20 slices">
                  {featured.slices.map((slice, index) => (
                    <li key={slice}>{String(index + 1).padStart(2, "0")}</li>
                  ))}
                </ol>
                <div className="hero-window-image">
                  <Image
                    src={featured.fullSrc}
                    alt="Spider-Man overlooking a city, shown as a panorama split into 20 numbered columns"
                    fill
                    preload
                    sizes="(max-width: 767px) 92vw, (max-width: 2020px) 56vw, 1160px"
                    className="object-cover object-[50%_64%]"
                  />
                  <div aria-hidden="true" className="hero-slice-lines absolute inset-0" />
                </div>
              </div>
            </div>
          </div>
        </figure>
      </HeroMotion>
    </section>
  );
}

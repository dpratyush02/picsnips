import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { libraryImages } from "@/lib/library-data";

export function LibraryTeaser() {
  const featured = [
    libraryImages[0], // Spider-Man
    libraryImages[12], // Interstellar Gargantua
    libraryImages[2], // Mars Orbit
    libraryImages[7], // Deep Sea Abyss
  ];

  return (
    <section className="scroll-mt-24 px-6 py-20 sm:py-24 border-y border-border dark:border-white/5 bg-muted/20 dark:bg-white/[0.01]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <SectionHeading
            eyebrow="Preset Library"
            title="Curated 4K Wallpapers & Panoramas"
            body="Don't have an image ready? Choose from our curated library of 15+ cinematic sci-fi wallpapers, space panoramas, and digital art ready to split in one click."
          />
          <div className="shrink-0">
            <Button asChild size="lg" className="rounded-full px-6 gap-2">
              <Link href="/library">
                <span>Explore Full Library</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 4 Featured Preview Cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((item) => (
            <Link
              key={item.id}
              href={`/library`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border dark:border-white/10 bg-card transition hover:border-foreground/25 hover:scale-[1.02] shadow-sm"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/60">
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-mono text-white/90 backdrop-blur-md border border-white/10">
                    {item.width} × {item.height}
                  </span>
                </div>
              </div>
              <div className="p-3.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  {item.category}
                </span>
                <h4 className="mt-1 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>15+ ultra-wide & 4K wallpapers available</span>
          <Link href="/library" className="hover:text-foreground underline underline-offset-4 font-medium">
            View all categories →
          </Link>
        </div>
      </div>
    </section>
  );
}

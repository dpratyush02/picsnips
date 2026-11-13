"use client";

import { useState } from "react";
import { Scissors } from "lucide-react";
import { cn } from "cn";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { libraryCategories, libraryImages, type LibraryItem } from "@/lib/library-data";

export function ImageLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredImages = selectedCategory === "All"
    ? libraryImages
    : libraryImages.filter((img) => img.category === selectedCategory);

  const handleSelectImage = (item: LibraryItem) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("picsnips:load-image", {
          detail: {
            src: item.src,
            name: `${item.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`,
          },
        })
      );
    }
  };

  return (
    <section id="library" className="scroll-mt-24 px-6 py-20 sm:py-28 bg-white/[0.01] border-y border-white/5">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Stock & Preset Library"
          title="Don't have a panorama handy? Try one of ours."
          body="Pick any image from our curated 4K & ultra-wide library. Click 'Split in App' to load it directly into the tool with zero upload needed."
        />

        {/* Category Pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {libraryCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                selectedCategory === cat
                  ? "bg-foreground text-background shadow-md"
                  : "border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {cat}
              <span className="ml-1.5 text-xs opacity-60">
                {cat === "All" ? libraryImages.length : libraryImages.filter((i) => i.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredImages.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/40 transition hover:border-white/20 hover:shadow-[0_20px_50px_-25px_rgba(0,0,0,0.8)]"
            >
              {/* Image Thumbnail */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/60">
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Overlay Badge */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-mono text-white/90 backdrop-blur-md border border-white/10">
                    {item.width} × {item.height}
                  </span>
                  <span className="rounded-full bg-primary/80 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
                    {item.slices} slices
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {item.category}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Ratio {item.aspectRatio}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground line-clamp-1">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                  <Button
                    type="button"
                    onClick={() => handleSelectImage(item)}
                    className="w-full rounded-full gap-2 text-xs font-medium"
                    size="sm"
                  >
                    <Scissors className="size-3.5" />
                    Split this Image
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info note */}
        <div className="mt-12 rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground bg-white/[0.01]">
          <p>
            Have your own 20-image panorama or wallpaper?{" "}
            <a href="#splitter" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              Drop it directly into the splitter above
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

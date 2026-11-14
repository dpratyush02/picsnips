"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors, Search } from "lucide-react";
import { cn } from "cn";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { libraryCategories, libraryImages, type LibraryItem } from "@/lib/library-data";

export function ImageLibrary() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredImages = libraryImages.filter((img) => {
    const matchesCategory = selectedCategory === "All" || img.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectImage = (item: LibraryItem) => {
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/split") {
        window.dispatchEvent(
          new CustomEvent("picsnips:load-image", {
            detail: {
              src: item.src,
              name: `${item.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`,
            },
          })
        );
        document.getElementById("splitter")?.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(
          `/split?image=${encodeURIComponent(item.src)}&name=${encodeURIComponent(item.title)}`
        );
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Curated Collection"
        title="Stock & Preset Images"
        body="Pick any image below. Click 'Split in App' to load it directly into the 20-image splitter with zero upload required."
      />

      {/* Search & Filter Controls */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
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

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Interstellar, Space, Art..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-border bg-card/80 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
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
              
              {/* Overlay Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
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
                <h3 className="mt-1.5 text-base font-semibold tracking-tight text-foreground line-clamp-1">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
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

      {filteredImages.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-base font-medium">No images matched &quot;{searchQuery}&quot;</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
            className="mt-4 rounded-full"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Footer info note */}
      <div className="mt-12 rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground bg-white/[0.01]">
        <p>
          Want to split your own image instead?{" "}
          <Link
            href="/split"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Launch the splitter tool
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

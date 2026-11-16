"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Scissors, Search } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { libraryCategories, libraryImages } from "@/lib/library-data";

export function ImageLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const query = searchQuery.trim().toLowerCase();
  const filteredImages = libraryImages.filter((item) =>
    (selectedCategory === "All" || item.category === selectedCategory) &&
    [item.title, item.description, ...item.tags].some((value) => value.toLowerCase().includes(query)),
  );

  return (
    <div className="site-width pb-20 pt-14 sm:pb-28 sm:pt-24">
      <SectionHeading
        as="h1"
        title="Image Library"
        body="Explore curated panoramas and wallpapers. Open any image in the splitter to make it your own."
      />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        <div role="group" aria-label="Image categories" className="flex flex-wrap gap-1.5">
          {libraryCategories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
              className="min-h-10 rounded-full px-3 text-sm transition-colors hover:bg-card aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {category}
              <span className="ml-1.5 font-mono text-xs opacity-70">
                {category === "All" ? libraryImages.length : libraryImages.filter((item) => item.category === category).length}
              </span>
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-60">
          <span className="sr-only">Search the image library</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search images"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-h-10 w-full rounded-full border border-input bg-card py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-2"
          />
        </label>
      </div>

      <div className="mt-[10px] grid gap-[10px] sm:grid-cols-2 lg:grid-cols-3">
        {filteredImages.map((item) => (
          <article key={item.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card p-[10px]">
            <div className="relative aspect-video w-full overflow-hidden rounded-[10px] bg-neutral-800">
              <Image
                src={item.src}
                alt={item.title}
                fill
                sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 394px"
                className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.035]"
              />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/75 px-2 py-1 font-mono text-[10px] text-white">
                {item.width} × {item.height}
              </span>
            </div>
            <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
              <p className="text-xs text-muted-foreground">{item.category}</p>
              <h2 className="mt-1 text-lg font-medium tracking-tight">{item.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-5 text-muted-foreground">{item.description}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <span className="font-mono text-[11px] text-muted-foreground">{item.aspectRatio}:1 · {item.slices} slices</span>
                <Button asChild variant="outline" className="rounded-full bg-card">
                  <Link href={{ pathname: "/split", query: { image: item.src, name: item.title } }} prefetch={false}>
                    <Scissors aria-hidden="true" className="size-3.5" /> Split this image
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center" role="status">
          <p>No images match your search.</p>
          <Button
            type="button"
            variant="outline"
            className="editorial-button mt-4"
            onClick={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        Have an image of your own? <Link href="/split" className="text-foreground underline underline-offset-4">Open the splitter</Link>.
      </p>
    </div>
  );
}

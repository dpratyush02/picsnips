"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Scissors } from "lucide-react";
import { EditorialCarousel } from "@/components/editorial-carousel";
import { sceneSplitterHref, type Scene } from "@/components/scenes";
import { PostPreview } from "@/components/x-post-preview";

const actionClass = "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm transition-colors hover:bg-muted focus-visible:outline-2";

function postSlide(url: string) {
  const [, handle, , id] = new URL(url).pathname.split("/");
  return { id, label: `@${handle}`, url, kind: "post" as const };
}

export function GalleryCarousel({ scenes, posts }: { scenes: readonly Scene[]; posts: readonly string[] }) {
  const slides = [
    ...scenes.map((scene) => ({ id: scene.tweetId, label: scene.title, kind: "image" as const, scene })),
    ...posts.map(postSlide),
  ];

  return (
    <EditorialCarousel
      label="Made with PicSnips"
      variant="images"
      slides={slides}
      initialIndex={1}
      renderSlide={(slide, preload) => slide.kind === "post" ? (
        <XPostCard slide={slide} preload={preload} />
      ) : (
        <a
          href={slide.scene.tweetUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${slide.label} on X`}
          className="relative block h-full w-full bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
        >
          <Image
            src={slide.scene.fullSrc}
            alt={slide.label}
            fill
            draggable={false}
            sizes="(max-width: 639px) 84vw, (max-width: 1023px) 59vw, (max-width: 1818px) 44vw, 800px"
            className="pointer-events-none select-none object-cover"
          />
        </a>
      )}
      renderCaption={(slide) => (
        <>
          <p className="card-title">{slide.label}</p>
          {slide.kind === "image" && <p className="mt-1 text-xs text-muted-foreground">@{slide.scene.authorHandle}</p>}
          <div className="mt-3.5 flex flex-wrap justify-center gap-2">
            <a href={slide.kind === "image" ? slide.scene.tweetUrl : slide.url} target="_blank" rel="noreferrer" className={actionClass}>
              View on X <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
            {slide.kind === "image" && (
              <Link href={sceneSplitterHref(slide.scene)} prefetch={false} className={actionClass}>
                <Scissors aria-hidden="true" className="size-3.5" /> Load in Splitter
              </Link>
            )}
          </div>
        </>
      )}
    />
  );
}

export function TestimonialCarousel({ posts }: { posts: readonly string[] }) {
  return (
    <EditorialCarousel
      label="PicSnips testimonials"
      variant="posts"
      slides={posts.map(postSlide)}
      renderSlide={(slide) => <XPostCard slide={slide} preload replyOnly />}
    />
  );
}

function XPostCard({ slide, preload, replyOnly = false }: { slide: ReturnType<typeof postSlide>; preload: boolean; replyOnly?: boolean }) {
  return (
    <div className="testimonial-slide">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <span className="truncate text-sm font-medium">{slide.label}</span>
        <a href={slide.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs hover:underline focus-visible:outline-2">
          View on X <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </a>
      </div>
      <div className={replyOnly ? "testimonial-reply" : "testimonial-body"}>
        {preload ? <PostPreview id={slide.id} replyOnly={replyOnly} /> : (
          <p className="text-sm text-muted-foreground">Community post on X</p>
        )}
      </div>
    </div>
  );
}

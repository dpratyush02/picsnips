"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { scenes } from "@/components/scenes";
import { Button } from "@/components/ui/button";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="px-6 pt-16 pb-8 sm:pt-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <p className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
            Built for X&apos;s new 20-image feature
          </p>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl sm:leading-[1.05]">
            One Image. Twenty Pieces. One Epic Post.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg">
            Turn any image into a stunning 20-image X post in seconds. No Photoshop. No manual cropping. Just upload, split, and post.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-full px-6 text-[15px]">
              <Link href="/#splitter">Start Splitting — It&apos;s Free</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-full px-6 text-[15px]">
              <Link href="/#demo">Watch Demo Video</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 rounded-full px-5 text-[15px] text-muted-foreground hover:text-foreground">
              <Link href="/#library">Stock Library</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.16),transparent_65%)]" />
          <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-black shadow-[0_40px_120px_-48px_rgba(0,0,0,0.9)]">
            <div className="hero-strips flex h-64 w-full sm:h-80 gap-0.5 bg-black">
              {scenes[0].slices.map((sliceUrl, index) => (
                <div
                  key={index}
                  className="h-full min-w-0 flex-1 bg-cover bg-center"
                  style={{
                    backgroundImage: `url("${sliceUrl}")`,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Real X Post: Spider-Man 20-Piece Split
              </span>
              <a
                href={scenes[0].tweetUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs hover:text-white transition"
              >
                01 → 20 • View on X ↗
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

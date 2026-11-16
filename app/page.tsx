import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GitFork } from "lucide-react";
import { Examples } from "@/components/examples";
import { Faq } from "@/components/faq";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Logo } from "@/components/logo";
import { SectionHeading } from "@/components/section-heading";
import { SiteFrame } from "@/components/site-frame";
import { SplitShowcase } from "@/components/split-showcase";
import { ToolkitCards } from "@/components/toolkit-cards";
import { Button } from "@/components/ui/button";
import { TestimonialCarousel } from "@/components/community-carousel";
import { VisitorCount } from "@/components/visitor-count";
import { testimonialPosts } from "@/lib/community-posts";
import { siteUrl } from "@/lib/site";
import { hasVoiceRuntime } from "@/lib/voice/availability";

export const metadata: Metadata = { alternates: { canonical: `${siteUrl}/` } };

export default function HomePage() {
  const voiceReady = hasVoiceRuntime();

  return (
    <SiteFrame showHeader={false}>
      <header className="flex min-h-16 items-center justify-between gap-2 px-4 sm:px-8">
        <Link href="/" aria-label="PicSnips home" className="inline-flex shrink-0 rounded-md focus-visible:outline-2">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 text-sm sm:gap-4">
          <VisitorCount />
          <a
            href="https://github.com/dpratyush02/picsnips"
            target="_blank"
            rel="noreferrer"
            aria-label="PicSnips on GitHub"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-2.5 transition-colors hover:bg-muted focus-visible:outline-2 sm:px-3"
          >
            <GitFork aria-hidden="true" className="size-4" />
            <span className="hidden min-[380px]:inline">GitHub</span>
          </a>
        </div>
      </header>
      <main>
        <Hero voiceReady={voiceReady} />
        <section id="tools" className="editorial-section site-width">
          <SectionHeading
            title="Every creator needs a few good tools."
            body="Everything you need to make creating a little easier."
          />
          <div className="mt-8"><ToolkitCards voiceReady={voiceReady} heading="h3" /></div>
        </section>
        <Examples />
        <section id="demo" className="editorial-section site-width">
          <SectionHeading
            title="From one image to twenty."
            body="Drag the divider to compare the original with the split. Switch to Download order to see how the pieces line up."
          />
          <div className="mt-8"><SplitShowcase /></div>
        </section>
        <HowItWorks />
        <section id="community" className="editorial-section">
          <div className="site-width">
            <SectionHeading align="center" title="Small tools. Real love." body="Built for creators. Shaped by the people using it." />
          </div>
          <div className="mt-8 sm:mt-12"><TestimonialCarousel posts={testimonialPosts} /></div>
        </section>
        <Faq voiceReady={voiceReady} />
        <section className="site-width pb-16 pt-6 sm:pb-24">
          <div className="rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground sm:py-20">
            <Logo className="[&_g]:fill-primary" />
            <h2 className="display-title mt-6">Make something great.</h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-6 opacity-80">Your next creative idea deserves tools that get out of the way.</p>
            <Button asChild variant="secondary" className="editorial-button mt-6">
              <Link href="/tools">Explore PicSnips <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
    </SiteFrame>
  );
}

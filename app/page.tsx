import { Faq } from "@/components/faq";
import { Hero } from "@/components/hero";
import { DemoVideo } from "@/components/demo-video";
import { HowItWorks } from "@/components/how-it-works";
import { SiteFrame } from "@/components/site-frame";
import { ImageSplitter } from "@/components/splitter/image-splitter";
import { LibraryTeaser } from "@/components/library-teaser";
import { Examples } from "@/components/examples";

export default function HomePage() {
  return (
    <SiteFrame>
      <main>
        <Hero />
        <DemoVideo />
        <ImageSplitter />
        <LibraryTeaser />
        <Examples />
        <HowItWorks />
        <Faq />
      </main>
    </SiteFrame>
  );
}

import { Faq } from "@/components/faq";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { SiteFrame } from "@/components/site-frame";
import { ImageSplitter } from "@/components/splitter/image-splitter";
import { Examples } from "@/components/examples";

export default function HomePage() {
  return (
    <SiteFrame>
      <main>
        <Hero />
        <ImageSplitter />
        <HowItWorks />
        <Examples />
        <Faq />
      </main>
    </SiteFrame>
  );
}

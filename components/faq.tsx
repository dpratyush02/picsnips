import { SectionHeading } from "@/components/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const questions = [
  {
    id: "feature",
    question: "What is the 20-image X feature?",
    answer:
      "X lets a single post include up to 20 images. Creators slice one wide picture into vertical strips and upload those strips in order so the post reads as one continuous panorama.",
  },
  {
    id: "quality",
    question: "Does PicSnap reduce image quality?",
    answer:
      "PNG export is lossless after your browser decodes the image. Pieces keep the original pixel size, nothing is upscaled, and remainder pixels are distributed so every column and row is kept. JPEG is optional and starts at quality 95, with transparency flattened onto white. EXIF metadata is not copied, because the browser works from decoded pixels.",
  },
  {
    id: "free",
    question: "Is PicSnap free?",
    answer:
      "Yes. There is no account, watermark, or paywall. The only limit is what your browser can hold in memory.",
  },
  {
    id: "upload",
    question: "Are my images uploaded to a server?",
    answer:
      "No. Splitting, preview, and the ZIP are all created locally in your browser. The image file is never sent to PicSnap. Opening X only sends the caption you typed to X's composer.",
  },
  {
    id: "count",
    question: "Can I change the number of splits?",
    answer:
      "Yes. Choose any count from 2 to 20. Vertical strips are the default for panoramic posts. You can also split horizontally, or into a grid whose rows and columns multiply to 20 or fewer.",
  },
  {
    id: "post",
    question: "Can I post directly to X?",
    answer:
      "Post to X opens the composer with your caption filled in. X does not let a website attach images through that link, so you add the downloaded files yourself, in order from 01. This version does not sign in to X or publish on your behalf.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Before you post it."
          body="The short version: it is free, private, and it will not post the images for you."
        />
        <Accordion type="single" collapsible className="mt-10">
          {questions.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="border-border">
              <AccordionTrigger className="py-4 text-base hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-6">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

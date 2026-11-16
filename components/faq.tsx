import { SectionHeading } from "@/components/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Faq({ voiceReady }: { voiceReady: boolean }) {
  const questions = [
    {
      id: "toolkit",
      question: "What is PicSnips?",
      answer: "PicSnips is a growing collection of browser-based creator tools for preparing images, video frames, and other media to share.",
    },
    {
      id: "tools",
      question: "What tools are currently available?",
      answer: voiceReady
        ? "Image Splitter, Scroll Animation Maker, Auto Enhance for audio and video, and a curated Image Library."
        : "Image Splitter, Scroll Animation Maker, and a curated Image Library.",
    },
    {
      id: "free",
      question: "Is PicSnips free? Do I need an account?",
      answer: "Yes, it’s free. Open any available tool without signing up. Exports have no watermark.",
    },
    {
      id: "upload",
      question: "Are my files uploaded to a server?",
      answer: "Image splitting, frame extraction, and audio enhancement happen in your browser. PicSnips doesn’t receive your files.",
    },
    {
      id: "mobile",
      question: "Can I use PicSnips on mobile?",
      answer: "Yes, on current mobile browsers. Large files can run into device memory limits, and audio or video support depends on the file’s codec.",
    },
    {
      id: "quality",
      question: "Does the image splitter reduce image quality?",
      answer: "PNG preserves the original decoded pixels and dimensions. JPEG is optional and uses lossy compression. The browser works with decoded pixels, so exports don’t copy EXIF metadata.",
    },
    {
      id: "count",
      question: "Can I change the number of image slices?",
      answer: "Yes. Choose 2 to 20 vertical or horizontal slices, or set your own rows and columns for a grid of up to 20 tiles.",
    },
    {
      id: "feature",
      question: "How do 20-image posts on X work?",
      answer: "A post can include up to 20 images. Attach your tiles in order to share a panorama as a sequence. Check how X displays the post before sharing it widely.",
    },
    {
      id: "post",
      question: "How do I share something I created?",
      answer: "Download your files and share them wherever you like. In the splitter, Post to X opens the composer with your caption. Attach the images manually in order, starting with 01.",
    },
  ];

  return (
    <section id="faq" className="editorial-section site-width">
      <div className="grid gap-7 border-t border-line pt-9 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
        <SectionHeading title="Frequently asked questions." />
        <Accordion type="single" collapsible className="overflow-hidden rounded-2xl border border-border bg-card px-4 sm:px-6">
          {questions.map(({ id, question, answer }) => (
            <AccordionItem key={id} value={id} className="border-border">
              <AccordionTrigger className="py-4 text-left text-base font-normal hover:no-underline">{question}</AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-muted-foreground">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

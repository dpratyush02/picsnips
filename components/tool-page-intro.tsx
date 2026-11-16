import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

export function ToolPageIntro({ label, title, body }: { label?: string; title: string; body: string }) {
  return (
    <header>
      <Link href="/tools" className="mb-6 inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2">
        <ArrowLeft aria-hidden="true" className="size-4" /> All tools
      </Link>
      <SectionHeading as="h1" eyebrow={label} title={title} body={body} />
    </header>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { publishedSponsors, sponsorPriceLabel, type PublishedSponsor } from "@/lib/sponsors";

function SponsorMark({ sponsor }: { sponsor: PublishedSponsor }) {
  return sponsor.logoPath ? (
    <Image src={sponsor.logoPath} alt="" width={44} height={44} className="size-full object-contain" />
  ) : <span aria-hidden="true" className="font-medium">{sponsor.name.slice(0, 1).toUpperCase()}</span>;
}

export function SponsorStrip({ className }: { className: string }) {
  return (
    <nav aria-label="Sponsor placements" className={`flex items-center gap-1.5 ${className}`}>
      {publishedSponsors.slice(0, 4).map((sponsor) => (
        <a key={sponsor.website} href={sponsor.website} target="_blank" rel="sponsored noopener noreferrer" title={sponsor.name} aria-label={`${sponsor.name}, sponsor`} className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-muted text-sm transition-colors hover:border-foreground focus-visible:outline-2">
          <SponsorMark sponsor={sponsor} />
        </a>
      ))}
      <Link href="/sponsors" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 text-xs font-medium whitespace-nowrap transition-colors hover:border-foreground hover:bg-muted focus-visible:outline-2">
        <Plus className="size-3.5" aria-hidden="true" /> Sponsor us
      </Link>
    </nav>
  );
}

export function SponsorSection() {
  return (
    <section id="sponsors" aria-labelledby="sponsors-title" className="editorial-section site-width">
      <div className="grid overflow-hidden rounded-2xl border border-line bg-card md:grid-cols-[1fr_0.8fr]">
        <div className="p-6 sm:p-10 lg:p-12">
          <h2 id="sponsors-title" className="display-title">Sponsor PicSnips.</h2>
          <p className="mt-4 max-w-sm text-pretty text-muted-foreground">
            Put your brand in front of people making things. Get a linked spot on the PicSnips homepage for the lifetime of the site.
          </p>
          <p className="mt-6 text-sm text-muted-foreground"><strong className="font-medium text-foreground">{sponsorPriceLabel} USD</strong> · One-time payment</p>
        </div>

        <div className="grid content-center gap-3 border-t border-line bg-muted/40 p-5 sm:p-8 md:border-t-0 md:border-l">
          {publishedSponsors.map((sponsor) => (
            <a key={sponsor.website} href={sponsor.website} target="_blank" rel="sponsored noopener noreferrer" className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-card p-3.5 transition-colors hover:border-foreground focus-visible:outline-2">
              <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted"><SponsorMark sponsor={sponsor} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium break-words">{sponsor.name}</span>
                <span className="mt-0.5 block text-sm break-words text-muted-foreground">{sponsor.description}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </a>
          ))}
          <Link href="/sponsors" className="flex items-center gap-3 rounded-xl border border-line bg-card p-3.5 transition-colors hover:border-foreground focus-visible:outline-2">
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Plus className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Buy an ad slot</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">Lifetime homepage placement</span>
            </span>
            <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

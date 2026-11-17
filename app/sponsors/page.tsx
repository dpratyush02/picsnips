import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { SiteFrame } from "@/components/site-frame";
import { SponsorForm } from "@/components/sponsor-form";
import { siteUrl } from "@/lib/site";
import { sponsorPriceLabel } from "@/lib/sponsors";

export const metadata: Metadata = {
  title: "Sponsor PicSnips",
  description: "Register your interest in a $69 USD lifetime sponsor placement on the PicSnips homepage.",
  alternates: { canonical: `${siteUrl}/sponsors` },
};

const benefits = [
  "Your logo, name, and description on the homepage",
  "A direct link to your website",
  "Placement for the lifetime of PicSnips",
];

export default function SponsorsPage() {
  return (
    <SiteFrame showFaqLink={false}>
      <main className="site-width py-12 sm:py-20">
        <Link href="/#sponsors" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to homepage
        </Link>
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[0.9fr_1fr] lg:gap-16">
          <div>
            <h1 className="text-5xl font-medium tracking-tight sm:text-6xl">Sponsor PicSnips.</h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">Give your brand a spot on the tools site for creators.</p>
            <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-muted/40">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-5 sm:p-6">
                <div>
                  <h2 className="text-sm font-medium">Lifetime sponsor placement</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Planned one-time price</p>
                </div>
                <p className="font-mono text-4xl tracking-tight">{sponsorPriceLabel}<span className="ml-1.5 text-sm text-muted-foreground">USD</span></p>
              </div>
              <ul className="grid gap-3 p-5 sm:p-6">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Share your details and we’ll follow up by email about availability and next steps.
            </p>
          </div>
          <SponsorForm />
        </div>
      </main>
    </SiteFrame>
  );
}

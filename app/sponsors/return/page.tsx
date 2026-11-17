import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sponsorship checkout", robots: { index: false, follow: false } };

export default function SponsorReturnPage() {
  return (
    <SiteFrame showFaqLink={false}>
      <main className="site-width pb-24 pt-16 sm:pt-24">
        <div className="max-w-xl">
          <h1 className="display-title">Back from checkout.</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">If your payment went through, look for a receipt from Dodo Payments. We’ll verify the payment and review your brand details before publishing your listing.</p>
          <Button asChild className="editorial-button mt-6"><Link href="/sponsors">Back to sponsorships</Link></Button>
        </div>
      </main>
    </SiteFrame>
  );
}

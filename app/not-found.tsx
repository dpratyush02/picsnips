import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteFrame>
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">This page doesn&apos;t exist.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The splitter is still on the home page.
        </p>
        <Button asChild className="mt-6 rounded-full px-5">
          <Link href="/">Back home</Link>
        </Button>
      </main>
    </SiteFrame>
  );
}

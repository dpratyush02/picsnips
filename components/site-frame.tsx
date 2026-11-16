import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteFrame({
  children,
  showHeader = true,
  showFaqLink = true,
}: {
  children: ReactNode;
  showHeader?: boolean;
  showFaqLink?: boolean;
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>
      {showHeader && <SiteHeader showFaqLink={showFaqLink} />}
      <div id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</div>
      <SiteFooter showFaqLink={showFaqLink} />
    </>
  );
}

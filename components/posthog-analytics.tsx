"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

export function PostHogAnalytics() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || previous.current === pathname) return;
    previous.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}

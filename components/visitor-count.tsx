"use client";

import { UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

const baselineVisitors = 29369;
const refreshInterval = 5 * 60 * 1000;
const numberFormat = new Intl.NumberFormat("en-US");

export function VisitorCount() {
  const [visitors, setVisitors] = useState<number>(baselineVisitors);

  useEffect(() => {
    const controller = new AbortController();
    let timer: number;

    async function recordOrFetch() {
      try {
        if (document.visibilityState === "hidden") return;

        let isNewVisitor = true;
        const now = Date.now();
        try {
          const lastVisit = localStorage.getItem("picsnips:visited_at");
          if (lastVisit && now - Number(lastVisit) < 24 * 60 * 60 * 1000) {
            isNewVisitor = false;
          }
        } catch {}

        const method = isNewVisitor ? "POST" : "GET";
        const response = await fetch("/api/visitor-count", {
          method,
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          if (typeof data.visitors === "number" && !controller.signal.aborted) {
            setVisitors(Math.max(baselineVisitors, data.visitors));
            if (isNewVisitor) {
              try {
                localStorage.setItem("picsnips:visited_at", String(now));
              } catch {}
            }
          }
        }
      } catch {
        // Keep the current count while connection recovers
      } finally {
        if (!controller.signal.aborted) timer = window.setTimeout(recordOrFetch, refreshInterval);
      }
    }

    void recordOrFetch();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground"
      title="Total creators and visitors"
    >
      <UsersRound aria-hidden="true" className="hidden size-4 sm:inline" />
      <span>
        <strong className="font-medium text-foreground tabular-nums">
          {numberFormat.format(visitors)}
        </strong>{" "}visitors
        <span className="sr-only"> reached</span>
      </span>
    </span>
  );
}

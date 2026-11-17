"use client";

import { UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

const baselineVisitors = 19154;
const refreshInterval = 5 * 60 * 1000;
const numberFormat = new Intl.NumberFormat("en-US");

export function VisitorCount() {
  const [visitors, setVisitors] = useState<number>(baselineVisitors);

  useEffect(() => {
    const controller = new AbortController();
    let timer: number;

    async function refresh() {
      try {
        if (document.visibilityState === "hidden") return;

        const response = await fetch("/api/visitor-count", { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          if (typeof data.visitors === "number" && !controller.signal.aborted) {
            setVisitors(Math.max(baselineVisitors, data.visitors));
          }
        }
      } catch {
        // Keep the last known count while the connection recovers.
      } finally {
        if (!controller.signal.aborted) timer = window.setTimeout(refresh, refreshInterval);
      }
    }

    void refresh();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground"
      title="Total visitors reached"
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

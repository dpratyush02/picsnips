"use client";

import dynamic from "next/dynamic";

const ScrollMaker = dynamic(() => import("./scroll-maker"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-center text-muted-foreground">
      Loading the local frame editor…
    </p>
  ),
});

export function ScrollLoader() {
  return <ScrollMaker />;
}

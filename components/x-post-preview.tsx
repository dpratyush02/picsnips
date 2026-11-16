"use client";

import { useEffect, useRef, useState } from "react";

type XWidgets = {
  createTweet(
    id: string,
    target: HTMLElement,
    options: { theme: "light"; dnt: boolean; conversation: "none"; cards?: "hidden" },
  ): Promise<HTMLElement | undefined>;
};

type XWindow = Window & {
  twttr?: { widgets?: XWidgets; ready?: (callback: () => void) => void };
};

let widgetsPromise: Promise<XWidgets> | undefined;

function currentWidgets() {
  const widgets = (window as XWindow).twttr?.widgets;
  return typeof widgets?.createTweet === "function" ? widgets : undefined;
}

function loadWidgetScript(src: string) {
  return new Promise<XWidgets>((resolve, reject) => {
    const host = window as XWindow;
    const script = document.createElement("script");
    let settled = false;
    const timer = window.setTimeout(fail, 5000);

    function fail() {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      script.remove();
      reject(new Error("X widgets are unavailable"));
    }

    function ready() {
      if (settled) return;
      const widgets = currentWidgets();
      if (!widgets) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(widgets);
    }

    script.src = src;
    script.async = true;
    script.onload = () => {
      ready();
      if (!settled) host.twttr?.ready?.(ready);
    };
    script.onerror = fail;
    document.head.append(script);
  });
}

function loadWidgets() {
  const widgets = currentWidgets();
  if (widgets) return Promise.resolve(widgets);

  // All mounted cards share the same pair of script attempts.
  widgetsPromise ??= loadWidgetScript("https://platform.x.com/widgets.js")
    .catch(() => loadWidgetScript("https://platform.twitter.com/widgets.js"))
    .catch((error: unknown) => {
      widgetsPromise = undefined;
      throw error;
    });

  return widgetsPromise;
}

export function PostPreview({ id, replyOnly = false }: { id: string; replyOnly?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "frame">("loading");

  useEffect(() => {
    const target = container.current;
    if (!target) return;

    let finished = false;
    function finish(result: "ready" | "frame") {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      setStatus(result);
    }

    const timer = window.setTimeout(() => finish("frame"), 14000);

    async function renderPost(element: HTMLDivElement) {
      try {
        const widgets = await loadWidgets();
        if (finished) return;

        const post = await widgets.createTweet(id, element, {
          theme: "light",
          dnt: true,
          conversation: "none",
          cards: replyOnly ? "hidden" : undefined,
        });

        finish(post ? "ready" : "frame");
      } catch {
        finish("frame");
      }
    }

    void renderPost(target);
    return () => {
      finished = true;
      window.clearTimeout(timer);
      target.replaceChildren();
    };
  }, [id, replyOnly]);

  return (
    <div className="mx-auto min-w-0 max-w-[550px]" aria-busy={status === "loading"}>
      {status === "loading" && (
        <p role="status" className="py-4 text-center text-sm text-muted-foreground">Loading post from X…</p>
      )}
      {status === "frame" ? (
        <iframe
          title={replyOnly ? "Reply on X" : "Post on X"}
          src={`https://platform.twitter.com/embed/Tweet.html?id=${encodeURIComponent(id)}&theme=light&dnt=true&hideThread=true${replyOnly ? "&hideCard=true" : ""}`}
          className="block h-72 w-full border-0 bg-white"
        />
      ) : <div ref={container} />}
    </div>
  );
}

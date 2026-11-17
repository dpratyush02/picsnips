"use client";

import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";

export function SponsorCheckoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function startCheckout() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");

    const fallback = "We couldn’t open Dodo checkout. Please try again in a moment.";
    try {
      const response = await fetch("/api/sponsors/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (response.ok && typeof result?.url === "string") {
        posthog.capture("sponsor_checkout_opened");
        window.location.assign(result.url);
        return;
      }
      setError(typeof result?.error === "string" ? result.error : fallback);
    } catch {
      setError(fallback);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <Button type="button" size="lg" disabled={pending} onClick={startCheckout} className="min-h-11 w-full rounded-full">
        {pending ? "Opening Dodo Payments…" : "Buy an ad slot"}
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </Button>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </>
  );
}

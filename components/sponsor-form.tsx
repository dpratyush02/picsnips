"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseSponsorDetails } from "@/lib/sponsors";

const fieldClass = "mt-2 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function SponsorForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || sent) return;
    setError("");
    const details = parseSponsorDetails(Object.fromEntries(new FormData(event.currentTarget)));
    if (!details) {
      setError("Check your email, HTTPS links, and field lengths.");
      return;
    }
    submitting.current = true;
    setPending(true);

    try {
      const response = await fetch("/api/sponsors/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      const result = await response.json();
      if (response.ok && result.sent === true) {
        setSent(true);
        return;
      }
      setError(typeof result.error === "string" ? result.error : "We couldn't send your inquiry. Please try again.");
    } catch {
      setError("We couldn't send your inquiry. Please try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section id="inquiry" aria-labelledby="inquiry-title" className="scroll-mt-24 rounded-2xl border border-line bg-card p-5 sm:p-8">
      <h2 id="inquiry-title" className="text-2xl font-medium tracking-tight">Your brand details</h2>
      {sent ? (
        <p role="status" className="mt-4 text-muted-foreground">Thanks! Your inquiry was sent. We’ll follow up using the email you provided.</p>
      ) : (
        <form method="post" action="/api/sponsors/inquiry" className="mt-6" onSubmit={submit} aria-busy={pending}>
          <fieldset disabled={pending} className="grid gap-5">
            <label className="block text-sm font-medium">
              Brand name
              <input className={fieldClass} name="brand" placeholder="Your brand or product" maxLength={70} required />
            </label>
            <label className="block text-sm font-medium">
              Website
              <input className={fieldClass} type="url" name="website" placeholder="https://example.com" maxLength={300} required />
            </label>
            <label className="block text-sm font-medium">
              Short description
              <textarea className={`${fieldClass} min-h-24 resize-y`} rows={3} name="description" placeholder="Describe what you make in 200 characters or less." maxLength={200} required />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input className={fieldClass} type="email" name="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required />
            </label>
            <label className="block text-sm font-medium">
              Logo URL <span className="font-normal text-muted-foreground">(optional)</span>
              <input className={fieldClass} type="url" name="logo" placeholder="https://example.com/logo.png" maxLength={300} />
            </label>
            <p className="text-sm text-muted-foreground">We’ll use your email to follow up on your inquiry.</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button size="lg" type="submit" className="min-h-11 w-full rounded-full">
              {pending ? "Sending…" : "Send inquiry"}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
          </fieldset>
        </form>
      )}
    </section>
  );
}

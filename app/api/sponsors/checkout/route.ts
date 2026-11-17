import { SeverityNumber } from "@opentelemetry/api-logs";
import { after } from "next/server";
import { loggerProvider, posthogLog } from "@/instrumentation";
import { createSponsorCheckout, sponsorCheckoutConfig } from "@/lib/sponsor-checkout";

function flushPostHogLogs() {
  after(async () => {
    await loggerProvider.forceFlush().catch(() => {});
  });
}

function reply(body: { error: string } | { url: string }, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return reply({ error: "Open the sponsorship page on PicSnips." }, 403);
  }
  if (request.headers.get("content-type")?.split(";", 1)[0].trim() !== "application/json") {
    return reply({ error: "Expected a JSON request." }, 415);
  }

  const config = sponsorCheckoutConfig();
  if (!config) return reply({ error: "Sponsor checkout is currently unavailable." }, 503);

  try {
    const url = await createSponsorCheckout(config);
    posthogLog.emit({
      body: "Sponsor checkout redirect created",
      severityNumber: SeverityNumber.INFO,
      attributes: { route: "/api/sponsors/checkout", provider: "dodo" },
    });
    flushPostHogLogs();
    return reply({ url });
  } catch (error) {
    posthogLog.emit({
      body: "Sponsor checkout redirect failed",
      severityNumber: SeverityNumber.ERROR,
      attributes: { route: "/api/sponsors/checkout", provider: "dodo" },
    });
    flushPostHogLogs();
    console.warn("Sponsor checkout failed", error instanceof Error ? error.message : "Unknown error");
    const message = error instanceof Error ? error.message : "We couldn’t open Dodo checkout. Please try again in a moment.";
    return reply({ error: message }, 502);
  }
}

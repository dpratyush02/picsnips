import { createSponsorCheckout, sponsorCheckoutConfig } from "@/lib/sponsor-checkout";

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
    return reply({ url: await createSponsorCheckout(config) });
  } catch (error) {
    console.warn("Sponsor checkout failed", error instanceof Error ? error.message : "Unknown error");
    const message = error instanceof Error ? error.message : "We couldn’t open Dodo checkout. Please try again in a moment.";
    return reply({ error: message }, 502);
  }
}

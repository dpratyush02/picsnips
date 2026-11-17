import { siteUrl } from "@/lib/site";
import { parseSponsorDetails } from "@/lib/sponsors";

function reply(body: { error: string } | { sent: true }, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const destination = process.env.SPONSOR_INQUIRY_DESTINATION?.trim();
  if (!destination) return reply({ error: "Sponsor inquiries are temporarily unavailable." }, 503);

  if (request.headers.get("sec-fetch-site") === "cross-site") return reply({ error: "Open the form on PicSnips." }, 403);
  if (request.headers.get("content-type")?.split(";", 1)[0].trim() !== "application/json") {
    return reply({ error: "Expected a JSON request." }, 415);
  }
  if (Number(request.headers.get("content-length")) > 8192) return reply({ error: "The inquiry is too large." }, 413);

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return reply({ error: "The inquiry is too large." }, 413);
    body = JSON.parse(raw);
  } catch {
    return reply({ error: "We couldn't read the inquiry." }, 400);
  }

  const details = parseSponsorDetails(body);
  if (!details) return reply({ error: "Check your email, HTTPS links, and field lengths." }, 400);

  try {
    const submission = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destination)}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Referer: `${siteUrl}/sponsors` },
      body: JSON.stringify({
        ...details,
        _subject: "New PicSnips sponsorship inquiry",
        _replyto: details.email,
        _template: "table",
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (submission.ok) {
      const result = await submission.json();
      if (result?.success === true || result?.success === "true") return reply({ sent: true });
    }
  } catch {
    // Keep the details in the form so the visitor can retry.
  }
  return reply({ error: "We couldn't send your inquiry. Please try again in a moment." }, 502);
}

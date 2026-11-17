import { connection } from "next/server";

const baselineVisitors = 19154;
const sevenDays = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  await connection();

  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID;
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID;
  let visitors: number = baselineVisitors;

  if (token && projectId) {
    const now = Date.now();
    const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/count");
    url.searchParams.set("projectId", projectId);
    url.searchParams.set("since", new Date(now - sevenDays).toISOString());
    url.searchParams.set("until", new Date(now).toISOString());
    if (teamId) url.searchParams.set("teamId", teamId);

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });

      if (response.ok) {
        const result = await response.json();
        const count: unknown = result?.data?.visitors;
        if (typeof count === "number" && Number.isSafeInteger(count) && count >= 0) {
          visitors = Math.max(baselineVisitors, count);
        }
      }
    } catch {
      // The homepage shows its recorded milestone when analytics is unavailable.
    }
  }

  return Response.json({ visitors }, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=300" },
  });
}

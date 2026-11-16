# PicSnips

Free browser-based splitter for X's 20-image posts. Upload one picture, cut it into ordered slices, and download a ZIP. Images are processed locally and are not uploaded.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional environment variables:

- `NEXT_PUBLIC_SITE_URL` — canonical URL used for metadata

## Homepage visitor count

Enable Web Analytics for the Vercel project and set these server-side environment variables in Vercel before redeploying:

- `VERCEL_ANALYTICS_TOKEN` — access token with permission to read the project's Web Analytics
- `VERCEL_ANALYTICS_PROJECT_ID` — ID of the PicSnips project
- `VERCEL_ANALYTICS_TEAM_ID` — team ID for a team-owned project. Omit for a personal project.

The badge requests the production visitor count for the past seven days, then refreshes every five minutes while the page is visible. If the first request cannot get a count, it displays the recorded visitor milestone. See the [Vercel Web Analytics API guide](https://vercel.com/docs/analytics/web-analytics-api).

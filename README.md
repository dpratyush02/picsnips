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

## Sponsorships

The sponsor panel sits directly above the homepage FAQ and links to `/sponsors`. The page advertises a planned $69 USD one-time price for a lifetime homepage listing and collects sponsorship inquiries.

The **Send inquiry** button passes submissions to [FormSubmit](https://formsubmit.co/documentation) for email delivery. Set `SPONSOR_INQUIRY_DESTINATION` to your inbox address in the server environment, using `.env.local` for development or Vercel project settings for deployment. For the first activation, send a test inquiry through `/sponsors`, open the confirmation email in the sponsor inbox, and click **Activate Form**. Then send a second test and verify the inquiry and Reply-To address.

You can switch `SPONSOR_INQUIRY_DESTINATION` to the opaque address token from the activation email. Keep `NEXT_PUBLIC_SITE_URL` set to your public PicSnips URL so FormSubmit sees a consistent referring page.

To publish an approved sponsor, store its logo under `public/` and add it to `publishedSponsors` in `lib/sponsors.ts`. The compact homepage strip shows up to four of the same sponsors. Keep contact emails out of the public list.

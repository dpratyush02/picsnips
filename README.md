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

The live visitor counter uses Upstash Redis (or Vercel KV) to track and display total unique visitors in real-time. Set these server-side environment variables:

- `UPSTASH_REDIS_REST_URL` (or `KV_REST_API_URL`) — REST endpoint for your Upstash Redis database
- `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_TOKEN`) — REST access token

Visitors are deduplicated per browser session/day via localStorage so page reloads do not inflate the count. If Redis is temporarily unreachable, it displays the baseline milestone.

## Secondary analytics

PostHog runs alongside Vercel Analytics and the Redis visitor counter. Configure these public variables in `.env.local` and in Vercel, then restart development or redeploy. Next.js embeds public variables at build time.

```dotenv
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Use the project key from PostHog project settings. For an EU project, set the host to `https://eu.i.posthog.com`. The project key is intended for browser event ingestion. Personal API keys stay private and are not used here. With no project key, the PostHog SDK is not loaded and no PostHog requests are made.

The SDK loads asynchronously after the page renders. Page views are recorded on initial load and client navigation, with duplicate React effect runs ignored. Anonymous browser IDs are stored in localStorage for repeat-visit reports. Browser Do Not Track and Global Privacy Control disable this secondary integration.

| Events | Report |
| --- | --- |
| `$pageview`, `$pageleave` | Traffic, referral campaigns, page visits |
| `file_selected`, `file_loaded`, `file_failed`, `file_cancelled`, `file_removed` | File loading and abandonment |
| `processing_started`, `processing_completed`, `processing_failed`, `processing_cancelled` | Tool funnels, success rates, processing time |
| `export_started`, `export_completed`, `export_failed`, `export_cancelled`, `download_requested` | Export results and download requests |
| `comparison_switched`, `x_composer_opened`, `x_composer_blocked` | A/B comparison and X composer use |
| `sponsor_checkout_started`, `sponsor_checkout_opened`, `sponsor_checkout_failed` | Sponsor checkout activity |

Filter by `tool` (`image_splitter`, `scroll_animation`, `voice_enhancer`, `sponsors`, or `website`). ZIP export events use `format=zip`; scroll image encoding uses the image MIME type. Downloads record browser download requests. Checkout opened records the redirect to Dodo. Confirmed purchases and revenue remain available in Dodo; the return page does not emit a payment-success event.

For example, create a funnel from `file_loaded` → `processing_completed` → `download_requested`, filtered to `tool=voice_enhancer`. Add processing failures and average `elapsed_ms` as separate insights.

Session recording, autocapture, automatic exception capture, and remote script loading are disabled. Events contain selected usage metadata. Media bytes, filenames, captions, raw error messages, and checkout details are excluded. URL query strings and fragments are removed from event URLs, with UTM campaign tags collected separately. Analytics failures are isolated from tool operations. Review `/privacy` before enabling analytics for your audience.

Verify events in PostHog's Activity view using a local sample or development fixture, then navigate between tools and request an export. A blocked tracker should leave tool exports and `/api/visitor-count` working.

## Sponsorships

The sponsor panel links to `/sponsors`, where buyers can purchase a lifetime homepage placement for one $59 USD payment. Dodo Payments collects the brand name, website, description, and optional logo URL during hosted checkout.

Set these server-side variables in `.env.local` for development or in Vercel for the target environment:

- `DODO_PAYMENTS_API_KEY` — API key for the selected mode
- `DODO_SPONSOR_PRODUCT_ID` — product ID for a fixed, one-time $59 USD sponsor product in the same mode
- `DODO_PAYMENTS_ENVIRONMENT` — `test_mode` (default) or `live_mode`

Use the base USD price with discounts, localized pricing, purchasing power adjustments, pay-what-you-want, and add-ons off for this product. Set `NEXT_PUBLIC_SITE_URL` to the URL buyers should return to. Run a sandbox purchase and verify the payment and brand details before enabling live mode. See the [Dodo Checkout Sessions reference](https://docs.dodopayments.com/api-reference/checkout-sessions/create).

Verify that the sponsor product payment succeeded in Dodo before publishing. If needed, use the [payment details API](https://docs.dodopayments.com/api-reference/payments/get-payments-1) to read `custom_field_responses`. Review the website and brand details, store the approved logo under `public/`, and add the listing to `publishedSponsors` in `lib/sponsors.ts`. The compact homepage strip shows up to four of the same sponsors. Keep contact emails out of the public list.

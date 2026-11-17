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

## Sponsorships

The sponsor panel links to `/sponsors`, where buyers can purchase a lifetime homepage placement for one $59 USD payment. Dodo Payments collects the brand name, website, description, and optional logo URL during hosted checkout.

Set these server-side variables in `.env.local` for development or in Vercel for the target environment:

- `DODO_PAYMENTS_API_KEY` — API key for the selected mode
- `DODO_SPONSOR_PRODUCT_ID` — product ID for a fixed, one-time $59 USD sponsor product in the same mode
- `DODO_PAYMENTS_ENVIRONMENT` — `test_mode` (default) or `live_mode`

Use the base USD price with discounts, localized pricing, purchasing power adjustments, pay-what-you-want, and add-ons off for this product. Set `NEXT_PUBLIC_SITE_URL` to the URL buyers should return to. Run a sandbox purchase and verify the payment and brand details before enabling live mode. See the [Dodo Checkout Sessions reference](https://docs.dodopayments.com/api-reference/checkout-sessions/create).

Verify that the sponsor product payment succeeded in Dodo before publishing. If needed, use the [payment details API](https://docs.dodopayments.com/api-reference/payments/get-payments-1) to read `custom_field_responses`. Review the website and brand details, store the approved logo under `public/`, and add the listing to `publishedSponsors` in `lib/sponsors.ts`. The compact homepage strip shows up to four of the same sponsors. Keep contact emails out of the public list.

import { siteUrl } from "@/lib/site";
import { sponsorPriceInCents, sponsorPriceLabel } from "@/lib/sponsors";

export function sponsorCheckoutConfig() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
  const productId = process.env.DODO_SPONSOR_PRODUCT_ID?.trim();
  const mode = process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
  if (!apiKey || !productId || (mode !== "test_mode" && mode !== "live_mode")) return null;

  const live = mode === "live_mode";
  if (apiKey.startsWith(live ? "dodo_test_" : "dodo_live_")) return null;

  return {
    apiKey,
    productId,
    live,
    apiOrigin: live ? "https://live.dodopayments.com" : "https://test.dodopayments.com",
    checkoutOrigin: live ? "https://checkout.dodopayments.com" : "https://test.checkout.dodopayments.com",
  };
}

type DodoProduct = {
  product_id?: string;
  is_recurring?: boolean;
  pricing_mode?: string | null;
  addons?: unknown[] | null;
  price?: {
    type?: string;
    currency?: string;
    price?: number;
    discount?: number;
    discount_bps?: number;
    pay_what_you_want?: boolean;
    purchasing_power_parity?: boolean;
  };
};

export async function createSponsorCheckout(config: NonNullable<ReturnType<typeof sponsorCheckoutConfig>>) {
  const options = {
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    cache: "no-store" as const,
    redirect: "error" as const,
    signal: AbortSignal.timeout(9000),
  };
  const productResponse = await fetch(`${config.apiOrigin}/products/${encodeURIComponent(config.productId)}`, options);
  if (!productResponse.ok) throw new Error(`Dodo product lookup returned HTTP ${productResponse.status}.`);

  const product: DodoProduct | null = await productResponse.json();
  const price = product?.price;
  if (
    product?.product_id !== config.productId || product.is_recurring !== false || product.pricing_mode || product.addons?.length ||
    price?.type !== "one_time_price" || price.currency !== "USD" || price.price !== sponsorPriceInCents ||
    price.discount || price.discount_bps || price.pay_what_you_want || price.purchasing_power_parity
  ) {
    throw new Error(`The Dodo sponsor product must be a fixed ${sponsorPriceLabel} USD one-time purchase.`);
  }

  const response = await fetch(`${config.apiOrigin}/checkouts`, {
    ...options,
    method: "POST",
    body: JSON.stringify({
      product_cart: [{ product_id: config.productId, quantity: 1 }],
      billing_currency: "USD",
      cancel_url: `${siteUrl}/sponsors`,
      return_url: `${siteUrl}/sponsors/return`,
      short_link: false,
      feature_flags: { allow_discount_code: false, allow_currency_selection: false, allow_editing_addons: false },
      metadata: { source: "picsnips_sponsorship" },
      custom_fields: [
        { field_type: "text", key: "brand_name", label: "Brand name", required: true },
        { field_type: "text", key: "website", label: "Website URL", placeholder: "https://example.com", required: true },
        { field_type: "text", key: "description", label: "Short brand description", required: true },
        { field_type: "text", key: "logo_url", label: "Logo URL", placeholder: "https://example.com/logo.png", required: false },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Dodo checkout creation returned HTTP ${response.status}.`);

  const session = await response.json();
  if (typeof session?.checkout_url !== "string") throw new Error("Dodo did not return a checkout URL.");
  const checkout = new URL(session.checkout_url);
  if (checkout.origin !== config.checkoutOrigin || checkout.username || checkout.password) {
    throw new Error("Dodo returned an unexpected checkout URL.");
  }
  return checkout.href;
}

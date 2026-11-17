export const sponsorPriceInCents = 6900;
export const sponsorPriceLabel = `$${sponsorPriceInCents / 100}`;

export type PublishedSponsor = {
  name: string;
  website: string;
  description: string;
  logoPath?: `/${string}`;
};

// Add entries after verifying payment and approving the brand details.
export const publishedSponsors: readonly PublishedSponsor[] = [];

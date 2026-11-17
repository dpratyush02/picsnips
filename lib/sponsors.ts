export const sponsorPriceLabel = "$69";

export type SponsorDetails = {
  brand: string;
  website: string;
  description: string;
  email: string;
  logo: string;
};

export type PublishedSponsor = {
  name: string;
  website: string;
  description: string;
  logoPath?: `/${string}`;
};

// Add entries when a sponsorship has been agreed and approved for publication.
export const publishedSponsors: readonly PublishedSponsor[] = [];

function field(value: unknown, limit: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length <= limit ? text : "";
}

function httpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export function parseSponsorDetails(value: unknown): SponsorDetails | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const brand = field(record.brand, 70);
  const website = field(record.website, 300);
  const description = field(record.description, 200);
  const email = field(record.email, 254);
  const logo = field(record.logo, 300);

  if (!brand || !description || !httpsUrl(website) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (record.logo && !httpsUrl(logo)) return null;
  return { brand, website, description, email, logo };
}

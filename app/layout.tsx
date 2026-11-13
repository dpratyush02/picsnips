import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { seoDescription, siteName, siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "PicSnips — Free 20 Image Splitter for X (Twitter)";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s — PicSnips",
  },
  description: seoDescription,
  applicationName: siteName,
  keywords: [
    "20 image X post",
    "Twitter image splitter",
    "split image into 20 parts",
    "X panoramic post maker",
    "PicSnips",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description: seoDescription,
    type: "website",
    url: "/",
    siteName,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: seoDescription,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteName,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  url: siteUrl,
  description: seoDescription,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  browserRequirements: "Requires a modern browser with HTML canvas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}

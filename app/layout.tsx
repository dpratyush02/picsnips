import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { InkCanvas } from "@/components/ink-canvas";
import { PostHogAnalytics } from "@/components/posthog-analytics";
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

const title = "PicSnips — Free Creator Toolkit & Image Splitter";

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
    "video to frames",
    "free creator tools",
    "PicSnips",
  ],
  openGraph: {
    title,
    description: seoDescription,
    type: "website",
    url: `${siteUrl}/`,
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
  themeColor: "#ffffff",
  colorScheme: "light dark",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: `${siteUrl}/`,
  description: seoDescription,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              var dark = false;
              try { dark = localStorage.getItem("theme") === "dark"; } catch {}
              var root = document.documentElement;
              root.classList.toggle("dark", dark);
              root.setAttribute("data-theme", dark ? "dark" : "light");
              var themeColor = document.querySelector('meta[name="theme-color"]');
              if (themeColor) themeColor.setAttribute("content", dark ? "#000000" : "#ffffff");
            })();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <InkCanvas />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
        <Toaster />
        <Analytics />
        <Suspense fallback={null}>
          <PostHogAnalytics />
        </Suspense>
      </body>
    </html>
  );
}

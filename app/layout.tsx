import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { InkCanvas } from "@/components/ink-canvas";
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
  themeColor: "#09090b",
  colorScheme: "dark light",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: `${siteUrl}/`,
  description: seoDescription,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("theme");var p=window.matchMedia("(prefers-color-scheme:dark)").matches;var t=s?s:(p?"dark":"light");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.setAttribute("data-theme","dark");}else{document.documentElement.classList.remove("dark");document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`,
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
      </body>
    </html>
  );
}

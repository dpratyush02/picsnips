import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { Legal } from "@/components/legal";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "PicSnips processes images in your browser. They are not uploaded, stored, or used to train anything.",
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <SiteFrame>
      <Legal title="Privacy" updated="November 18, 2026">
        <p>
          PicSnips is a free image splitter. It does not ask you to create an account, and it does not have a backend that receives your pictures.
        </p>
        <h2>Images</h2>
        <p>
          When you choose a file, your browser decodes it and cuts it with the HTML canvas. Previews, individual downloads, and the ZIP are created on your device. The image bytes are not sent to a PicSnips server, because there is no image upload endpoint.
        </p>
        <p>
          Removing the image, replacing it, or leaving the page drops those previews from the page. They are not written to an account or a library.
        </p>
        <h2>Post to X</h2>
        <p>
          Post to X opens <a href="https://twitter.com/intent/tweet">X&apos;s public composer</a> in a new tab. Only the caption you typed is placed in that link. Your image files are not included. X receives that request under its own privacy policy once you use their site.
        </p>
        <h2>What the host can see</h2>
        <p>
          Loading this website is a normal web request. Whoever hosts the page may log the usual request data, such as IP address, browser, and the URL. That log does not include the image you split.
        </p>
        <h2>Sponsor checkout</h2>
        <p>
          Dodo Payments collects your payment, contact, and brand details on its hosted checkout. PicSnips uses the contact and brand details from completed purchases to follow up and set up your sponsorship. Approved listings display the brand name, link, description, and logo when provided.
        </p>
        <h2>Usage analytics</h2>
        <p>
          PicSnips uses Vercel Analytics for website traffic and, when configured, PostHog for page visits, tool usage, processing results, download requests, and sponsor checkout activity. Events may include your browser and device, referral source, campaign tags, file type and size, recording duration, output settings, and processing time. Uploaded media, filenames, captions, and payment or contact details are excluded from these events. URL query strings are removed, except for campaign tags collected separately.
        </p>
        <p>
          PostHog session recording and automatic form and click capture are disabled. The PostHog integration respects browser Do Not Track and Global Privacy Control signals.
        </p>
        <h2>Cookies and storage</h2>
        <p>
          This integration stores a random PostHog browser identifier in local storage to measure repeat visits without an account. It is configured to use local storage instead of analytics cookies. PicSnips also stores your theme preference and the time your browser last contributed to the Redis visitor counter. Your uploaded media and captions are not saved in local storage.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about this page can be directed to the contact information listed on the site.
        </p>
      </Legal>
    </SiteFrame>
  );
}

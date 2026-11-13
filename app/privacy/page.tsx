import type { Metadata } from "next";
import { Legal } from "@/components/legal";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "PicSnips processes images in your browser. They are not uploaded, stored, or used to train anything.",
};

export default function PrivacyPage() {
  return (
    <SiteFrame>
      <Legal title="Privacy" updated="November 13, 2026">
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
        <h2>Cookies and storage</h2>
        <p>
          This version does not set analytics cookies and does not save your image or caption in local storage.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about this page can be directed to the contact information listed on the site.
        </p>
      </Legal>
    </SiteFrame>
  );
}

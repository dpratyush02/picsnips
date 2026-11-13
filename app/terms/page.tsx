import type { Metadata } from "next";
import { Legal } from "@/components/legal";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms for using PicSnips, a free browser-based image splitter for X posts.",
};

export default function TermsPage() {
  return (
    <SiteFrame>
      <Legal title="Terms" updated="November 13, 2026">
        <p>
          PicSnips is a free tool provided as-is. By using it, you agree to these terms.
        </p>
        <h2>The tool</h2>
        <p>
          PicSnips splits an image in your browser and lets you download the pieces. Post to X only opens X&apos;s composer with optional caption text. It does not sign in to X, upload media, or publish a post for you.
        </p>
        <h2>Your images</h2>
        <p>
          You are responsible for the files you use. Only split images you have the right to edit and post. Follow X&apos;s rules when you publish. PicSnips does not review your images.
        </p>
        <h2>No affiliation</h2>
        <p>
          PicSnips is an independent project. It is not affiliated with, endorsed by, or operated by X Corp. X and Twitter are trademarks of their owner.
        </p>
        <h2>No warranty</h2>
        <p>
          The splitter aims to keep every pixel and the correct order, but browsers differ. Check the pieces before you post. The tool is provided without warranties of any kind, including fitness for a particular purpose or uninterrupted availability.
        </p>
        <h2>Liability</h2>
        <p>
          To the extent the law allows, the people who publish PicSnips are not liable for lost images, a post that looks different on X, or any other damage arising from use of the tool.
        </p>
        <h2>Changes</h2>
        <p>
          These terms can be updated by publishing a new version on this page. The date at the top is the latest revision.
        </p>
      </Legal>
    </SiteFrame>
  );
}

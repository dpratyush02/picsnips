import { GalleryCarousel } from "@/components/community-carousel";
import { SectionHeading } from "@/components/section-heading";
import { scenes } from "@/components/scenes";
import { creatorPosts } from "@/lib/community-posts";

const gallery = [scenes[2], scenes[0], scenes[1]];

export function Examples() {
  return (
    <section id="examples" className="editorial-section">
      <div className="site-width">
        <SectionHeading
          align="center"
          title="Made with PicSnips."
          body="A little inspiration from what creators are making."
        />
      </div>
      <div className="mt-8 sm:mt-12">
        <GalleryCarousel scenes={gallery} posts={creatorPosts} />
      </div>
    </section>
  );
}

export type SceneId = "spiderman" | "sunset" | "skyline";

export interface Scene {
  id: SceneId;
  title: string;
  caption: string;
  tweetUrl: string;
  tweetId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  fullSrc: string;
  slices: string[];
}

export const scenes: Scene[] = [
  {
    id: "spiderman",
    title: "Spider-Man Panorama",
    caption: "had to try this trend with the mandatory Spider-Man image 🕷️",
    tweetUrl: "https://x.com/dpratyush02/status/2121312224182775896",
    tweetId: "2121312224182775896",
    authorName: "Pratyush",
    authorHandle: "dpratyush02",
    authorAvatar: "https://pbs.twimg.com/profile_images/2083749727577997312/dHBP6_c4_200x200.jpg",
    fullSrc: "/examples/spiderman/full.png",
    slices: Array.from({ length: 20 }, (_, i) => 
      `/examples/spiderman/slice_${String(i + 1).padStart(2, "0")}.png`
    ),
  },
  {
    id: "sunset",
    title: "Cosmic Pathway to Black Hole",
    caption: "Made this for free in just one click — Try it yourself > picsnips.site",
    tweetUrl: "https://x.com/dpratyush02/status/2121293695433781312",
    tweetId: "2121293695433781312",
    authorName: "Pratyush",
    authorHandle: "dpratyush02",
    authorAvatar: "https://pbs.twimg.com/profile_images/2083749727577997312/dHBP6_c4_200x200.jpg",
    fullSrc: "/examples/sunset/full.jpg",
    slices: Array.from({ length: 20 }, (_, i) => 
      `/examples/sunset/slice_${String(i + 1).padStart(2, "0")}.jpg`
    ),
  },
  {
    id: "skyline",
    title: "Sunrise Over Mars Craters",
    caption: "20 images huh.......",
    tweetUrl: "https://x.com/dpratyush02/status/2121219106066313642",
    tweetId: "2121219106066313642",
    authorName: "Pratyush",
    authorHandle: "dpratyush02",
    authorAvatar: "https://pbs.twimg.com/profile_images/2083749727577997312/dHBP6_c4_200x200.jpg",
    fullSrc: "/examples/skyline/full.jpg",
    slices: Array.from({ length: 20 }, (_, i) => 
      `/examples/skyline/slice_${String(i + 1).padStart(2, "0")}.jpg`
    ),
  },
];

export function sceneSrc(scene: Scene): string {
  return scene.fullSrc;
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{
      source: "/voice-assets/:directory(deepfilter|ffmpeg|core)/:asset*",
      headers: [{ key: "Cache-Control", value: "public, max-age=86400, must-revalidate" }],
    }];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "picsnips.site",
          },
        ],
        destination: "https://www.picsnips.site/:path*",
        permanent: true,
      },
      {
        source: "/app",
        destination: "/split",
        permanent: true,
      },
      {
        source: "/splitter",
        destination: "/split",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

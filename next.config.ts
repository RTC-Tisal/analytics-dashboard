import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,

  // Old addresses that moved. Checked before any page is looked up; anything
  // after "?" is kept, so /prospecting?range=7d goes to /linkedin?range=7d.
  // permanent: true sends status 308 ("moved for good"), which browsers remember.
  async redirects() {
    return [
      // The Prospecting page (Sales Navigator) was replaced by the LinkedIn page.
      { source: "/prospecting", destination: "/linkedin", permanent: true },
    ];
  },

  partialPrefetching: true,
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

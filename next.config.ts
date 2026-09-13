import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /testimonials is a leftover from the previous site on this domain. It
      // still ranked (position ~5, 42 impressions over 16 months) when it went
      // 404, so it gets a permanent redirect to where the testimonials live
      // now: the home page. The locale-prefixed forms exist because the proxy
      // used to bounce /testimonials to /et/testimonials, and Google saw both.
      {
        source: "/testimonials",
        destination: "/et#testimonials",
        permanent: true,
      },
      {
        source: "/:lang(et|en)/testimonials",
        destination: "/:lang#testimonials",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // ============================
  // 🛑 GLOBAL NO-CACHE SETTINGS
  // ============================

  // Disable all Next.js runtime caching
  cache: false,

  // Disable fetch() caching globally
  experimental: {
    fetchCache: false,
  },

  // Force all pages/routes to run dynamically on every request
  // (prevents static optimization and stale DB queries)
  dynamic: "force-dynamic",

  // ============================
  // ⭐ YOUR ORIGINAL CONFIG BELOW
  // ============================

  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule: any) =>
      rule.test?.test?.(".svg"),
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },

      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      },
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;

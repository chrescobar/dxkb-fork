import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

// Pin the Turbopack workspace root to this directory. Stray package-lock.json
// files in parent directories otherwise make Next infer an ancestor as the root,
// which breaks file-watching/cache invalidation (nested API routes silently 404).
const projectRoot = dirname(fileURLToPath(import.meta.url));

// Minimal type for webpack rule (avoids depending on full webpack types)
interface WebpackRuleLike {
  test?: { test?(s: string): boolean };
  issuer?: unknown;
  resourceQuery?: unknown;
  exclude?: RegExp;
}

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },

  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule: WebpackRuleLike) =>
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
    qualities: [25, 50, 75, 80, 90, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },

  turbopack: {
    root: projectRoot,
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;

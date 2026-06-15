import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

// Minimal type for webpack rule (avoids depending on full webpack types)
interface WebpackRuleLike {
  test?: { test?(s: string): boolean };
  issuer?: unknown;
  resourceQuery?: { not?: unknown[] } | RegExp;
  exclude?: RegExp;
  use?: string[];
}

interface WebpackConfig {
  module: {
    rules: WebpackRuleLike[];
  };
}

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },

  webpack(config: WebpackConfig): WebpackConfig {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
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
        issuer: fileLoaderRule?.issuer,
        resourceQuery: {
          not: [
            ...((fileLoaderRule?.resourceQuery as { not?: unknown[] } | undefined)?.not ?? []),
            /url/,
          ],
        }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      },
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

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
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;

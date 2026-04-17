/** @type {import('next').NextConfig} */

const { normalizeBasePath } = require("./lib/base-path-utils");

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || "");

const nextConfig = {
  output: "standalone",
  basePath,
  assetPrefix: basePath || undefined,

  headers: async () => {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate, public, max-age=0",
          },
          {
            key: "Content-Type",
            value: "application/javascript",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
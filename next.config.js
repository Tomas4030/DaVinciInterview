/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/tomas",
  assetPrefix: "/tomas",
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
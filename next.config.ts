import type { NextConfig } from "next";
import path from "path";

const rootDir = path.resolve( __dirname )   

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: rootDir ,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: rootDir,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;


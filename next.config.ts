import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // context/ is populated locally by `npm run sync-context` (personas, skills,
  // agents, sample-data) and isn't traced automatically since nothing in the
  // route code imports it by static path. Force it into the deployed trace
  // so it travels with the app.
  outputFileTracingIncludes: {
    "/*": ["./context/**/*"],
  },
};

export default nextConfig;

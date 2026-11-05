import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure context/ (personas, skills, agents, sample-data) is traced and
  // bundled into Vercel serverless functions for /api/chat, /api/report,
  // and /api/review.
  outputFileTracingIncludes: {
    "/*": ["./context/**/*"],
  },
};

export default nextConfig;


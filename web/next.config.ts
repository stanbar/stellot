import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence the "multiple lockfiles" warning — this app lives inside a monorepo
  // whose root also has a package-lock.json (for the CLI scripts).
  outputFileTracingRoot: path.join(__dirname, ".."),

  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;

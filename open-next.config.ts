import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    runtime: "edge",
  },
  middleware: {
    external: true,
  },
  dangerous: {
    unstable_allowInsecureEmptyIncrementalCache: true,
  }
};

export default config;

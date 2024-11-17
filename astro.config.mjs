// @ts-check
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://hhandika.github.io",
  base: "mammaldiversity-org",
  integrations: [tailwind()],
});

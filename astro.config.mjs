// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import pagefind from "astro-pagefind";
import partytown from "@astrojs/partytown";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  // site: "https://www.mammaldiversity.org/",
  site: "https://www.mdd.hhandika.com/",
  integrations: [
    tailwind(),
    react(),
    pagefind(),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
  redirects: {
    "/about.html": "/about",
    // "/explore.html": "/explore/deprecated",
  },
});

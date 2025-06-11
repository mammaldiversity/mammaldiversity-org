// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import pagefind from "astro-pagefind";
import partytown from "@astrojs/partytown";

// https://astro.build/config
export default defineConfig({
  // site: "https://www.mammaldiversity.org/",
  site: "https://www.mdd.hhandika.com/",
  integrations: [
    tailwind(),
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

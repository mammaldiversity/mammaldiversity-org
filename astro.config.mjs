// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import pagefind from "astro-pagefind";
import partytown from "@astrojs/partytown";
import preact from "@astrojs/preact";

export default defineConfig({
  site: "https://www.mammaldiversity.org/",
  integrations: [
    tailwind(),
    preact(),
    pagefind(),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
  redirects: {
    "/about.html": "/about",
  },
});

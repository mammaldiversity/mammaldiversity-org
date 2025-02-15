// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import pagefind from "astro-pagefind";

// https://astro.build/config
export default defineConfig({
  site: "https://www.mammaldiversity.org/",
  integrations: [tailwind(), pagefind()],
});

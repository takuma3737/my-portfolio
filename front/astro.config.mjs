import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import { config } from "dotenv";

// 環境変数を読み込み
config();

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
});
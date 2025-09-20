import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import { config } from "dotenv";
import path from "path";

// 環境変数を読み込み（親ディレクトリの.envファイルを指定）
config({ path: path.resolve(process.cwd(), '../.env') });
config({ path: path.resolve(process.cwd(), '.env') }); // ローカルの.envも読み込み

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
});
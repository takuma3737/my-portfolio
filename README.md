# My Portfolio

このプロジェクトは、Astro を使用して構築された個人ポートフォリオサイトです。

## 🚀 プロジェクト構成

```text
/
├── front/                  # フロントエンド関連ファイル
│   ├── public/            # 静的ファイル
│   ├── src/               # ソースコード
│   │   ├── components/    # Astroコンポーネント
│   │   ├── content/       # マークダウンコンテンツ
│   │   ├── layouts/       # レイアウトコンポーネント
│   │   ├── pages/         # ページファイル
│   │   └── styles/        # スタイルファイル
│   ├── astro.config.mjs   # Astro設定
│   ├── package.json       # パッケージ依存関係
│   ├── tailwind.config.mjs # Tailwind CSS設定
│   └── tsconfig.json      # TypeScript設定
├── app/                   # バックエンド関連ファイル
└── README.md              # このファイル
```

## 🧞 開発コマンド

プロジェクトのセットアップと開発を行うには、以下のコマンドを使用してください：

```bash
# フロントエンドディレクトリに移動
cd front

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# プレビュー
npm run preview
```

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
